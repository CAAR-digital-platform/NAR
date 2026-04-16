/**
 * services/roadsideService.js
 *
 * Business logic for the Roadside Assistance subscription flow.
 * All DB access goes through roadsideModel — never directly here.
 *
 * Three operations:
 *   1. createQuote    — find/create user + client + vehicle, build quote
 *   2. confirmQuote   — ownership check, move status pending → confirmed
 *   3. processPayment — full DB transaction: contract, payment, doc, notification, audit
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const pool   = require('../db');
const m      = require('../models/roadsideModel');

const SECRET_KEY = process.env.JWT_SECRET || 'SECRET_KEY_CAAR';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate an insurance number: CAAR-YYYYMMDD-XXXX
 * where XXXX is 4 random uppercase alphanumeric characters.
 */
function generateInsuranceNumber() {
  const today = new Date();
  const date  = today.toISOString().slice(0, 10).replace(/-/g, '');
  const rand  = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `CAAR-${date}-${rand}`;
}

/**
 * Generate a policy reference: RSA-YYYYMMDD-000123
 * where 000123 is the quote id zero-padded to 6 digits.
 */
function generatePolicyReference(quoteId) {
  const today = new Date();
  const date  = today.toISOString().slice(0, 10).replace(/-/g, '');
  const padded = String(quoteId).padStart(6, '0');
  return `RSA-${date}-${padded}`;
}

/**
 * Return today and today+1year as 'YYYY-MM-DD' strings.
 */
function getContractDates() {
  const start = new Date();
  const end   = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);

  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start_date: fmt(start), end_date: fmt(end) };
}

/**
 * Sign a JWT for a user (id, email, role).
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '1d' }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE QUOTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs the full quote creation flow inside a single transaction:
 *   • find or create user
 *   • find or create client profile
 *   • create vehicle
 *   • look up plan price
 *   • look up roadside product id
 *   • create quote with status = 'pending'
 *
 * Returns { quote_id, estimated_amount, token }
 * The token lets the client immediately proceed to confirm/pay without a
 * separate login step.
 */
async function createQuote({
  first_name,
  last_name,
  email,
  phone,
  license_plate,
  brand,
  model,
  year,
  wilaya,
  plan_id,
}) {
  // ── Pre-transaction lookups (read-only, safe outside TX) ──────────────────

  // Validate plan exists and get its price
  const plan = await m.getPlanById(plan_id);
  if (!plan) {
    const err = new Error(`Plan with id ${plan_id} not found`);
    err.status = 404;
    throw err;
  }

  // Fetch the Roadside Assistance product
  const product = await m.getRoadsideProduct();
  if (!product) {
    const err = new Error('Roadside Assistance product not found in database');
    err.status = 500;
    throw err;
  }

  // Check if a user with this email already exists (outside TX for speed)
  const existingUser = await m.findUserByEmail(email);

  // ── Transaction ───────────────────────────────────────────────────────────
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Find or create the user
    let userId;
    let userEmail  = email;
    let userRole   = 'client';
    let isNewUser  = false;

    if (existingUser) {
      userId = existingUser.id;
      userRole = existingUser.role;
    } else {
      // New user: create a temporary password they can reset later via email
      const tempPassword   = crypto.randomBytes(12).toString('hex');
      const password_hash  = await bcrypt.hash(tempPassword, 12);

      userId    = await m.createUser(conn, { first_name, last_name, email, password_hash, phone });
      isNewUser = true;
    }

    // 2. Find or create the client profile
    let clientId;
    // findClientByUserId uses pool (read); if user is new it won't exist yet
    const existingClient = isNewUser ? null : await m.findClientByUserId(userId);

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const insurance_number = generateInsuranceNumber();
      clientId = await m.createClient(conn, { user_id: userId, insurance_number });
    }

    // 3. Create the vehicle
    const vehicleId = await m.createVehicle(conn, {
      client_id:     clientId,
      license_plate,
      brand,
      model,
      year:          parseInt(year, 10),
      wilaya,
    });

    // 4. Create the quote
    const quoteId = await m.createQuote(conn, {
      client_id:        clientId,
      vehicle_id:       vehicleId,
      product_id:       product.id,
      plan_id:          parseInt(plan_id, 10),
      estimated_amount: plan.price,
    });

    await conn.commit();

    // 5. Sign a JWT so the client can immediately confirm/pay
    const token = signToken({ id: userId, email: userEmail, role: userRole });

    return {
      quote_id:         quoteId,
      estimated_amount: parseFloat(plan.price),
      plan_name:        plan.name,
      token,             // client stores this to authorize the next two calls
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONFIRM QUOTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Moves a quote from 'pending' → 'confirmed'.
 *
 * Ownership rule: the quote's client must belong to the authenticated user
 * (req.user.id). This prevents users from confirming each other's quotes.
 */
async function confirmQuote(quoteId, authenticatedUserId) {
  const quote = await m.getQuoteById(quoteId);

  if (!quote) {
    const err = new Error('Quote not found');
    err.status = 404;
    throw err;
  }

  // Ownership check
  if (quote.user_id !== authenticatedUserId) {
    const err = new Error('Forbidden: this quote does not belong to you');
    err.status = 403;
    throw err;
  }

  // Status check — only pending quotes can be confirmed
  if (quote.status !== 'pending') {
    const err = new Error(`Quote cannot be confirmed (current status: ${quote.status})`);
    err.status = 409;
    throw err;
  }

  await m.updateQuoteStatus(quoteId, 'confirmed');

  return { message: 'Quote confirmed successfully', quote_id: quoteId };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PROCESS PAYMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes the full payment flow inside a single DB transaction.
 *
 * Steps (all or nothing):
 *   1. Lock and read the quote
 *   2. Ownership + status check
 *   3. Create contract
 *   4. Create payment
 *   5. Insert document (if provided)
 *   6. Insert notification
 *   7. Insert audit log
 *   8. Update quote status → 'accepted'
 *   9. Commit
 *
 * @param {number} quoteId
 * @param {number} authenticatedUserId  - from JWT (req.user.id)
 * @param {object} documentData         - optional { file_name, file_path, file_type }
 */
async function processPayment(quoteId, authenticatedUserId, documentData = null) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Lock the quote row for the duration of this transaction
    const quote = await m.getQuoteByIdForUpdate(conn, quoteId);

    if (!quote) {
      const err = new Error('Quote not found');
      err.status = 404;
      throw err;
    }

    // 2. Ownership check
    if (quote.user_id !== authenticatedUserId) {
      const err = new Error('Forbidden: this quote does not belong to you');
      err.status = 403;
      throw err;
    }

    // Only confirmed quotes can be paid
    if (quote.status !== 'confirmed') {
      const err = new Error(`Quote cannot be paid (current status: ${quote.status}). Please confirm the quote first.`);
      err.status = 409;
      throw err;
    }

    // 3. Generate identifiers
    const policy_reference = generatePolicyReference(quoteId);
    const { start_date, end_date } = getContractDates();
    const today = new Date().toISOString().slice(0, 10);

    // 4. Create contract
    const contractId = await m.createContract(conn, {
      client_id:       quote.client_id,
      vehicle_id:      quote.vehicle_id,
      product_id:      quote.product_id,
      plan_id:         quote.plan_id,
      start_date,
      end_date,
      premium_amount:  quote.estimated_amount,
      policy_reference,
    });

    // 5. Create payment
    await m.createPayment(conn, {
      contract_id:  contractId,
      amount:       quote.estimated_amount,
      payment_date: today,
    });

    // 6. Insert document if the client uploaded one
    if (documentData && documentData.file_name && documentData.file_path) {
      await m.createDocument(conn, {
        client_id:   quote.client_id,
        contract_id: contractId,
        file_name:   documentData.file_name,
        file_path:   documentData.file_path,
        file_type:   documentData.file_type || null,
      });
    }
// 1. Get user email
const [userRows] = await conn.execute(
  `SELECT u.email, u.first_name, u.last_name
   FROM clients c
   JOIN users u ON c.user_id = u.id
   WHERE c.id = ?`,
  [quote.client_id]
);

const user = userRows[0];

// 2. Generate PDF
const pdfBuffer = await createContractPDF({
  policy_reference,
  client_name: `${user.first_name} ${user.last_name}`,
  product_name: 'Roadside Assistance',
  start_date,
  end_date,
  amount: quote.estimated_amount
});

// 3. Send email (DO NOT block payment)
await sendContractEmail({
  to: user.email,
  pdfBuffer,
  policy_reference
});
    // 7. Notification for the user
    await m.createNotification(conn, {
      user_id: authenticatedUserId,
      title:   'Your Roadside Assistance contract is active',
      message: `Your policy (${policy_reference}) has been created and is valid from ${start_date} to ${end_date}.`,
      type:    'contract',
    });

    // 8. Audit log
    await m.createAuditLog(conn, {
      user_id:    authenticatedUserId,
      action:     'CREATE_CONTRACT',
      table_name: 'contracts',
      record_id:  contractId,
      description: `Roadside Assistance contract created via online payment. Quote #${quoteId}, Policy: ${policy_reference}`,
    });

    // 9. Mark quote as accepted
    await m.updateQuoteStatusTx(conn, quoteId, 'accepted');

    await conn.commit();

    return {
      message:          'Payment processed successfully',
      policy_reference,
      contract_id:      contractId,
      start_date,
      end_date,
      amount_paid:      parseFloat(quote.estimated_amount),
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = { createQuote, confirmQuote, processPayment };