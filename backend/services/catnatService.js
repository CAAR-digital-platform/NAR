/**
 * services/catnatService.js
 *
 * Business logic for the CATNAT (Natural Disaster) subscription flow.
 * Three operations:
 *   1. createQuote    — find/create user + client + property, build quote
 *   2. confirmQuote   — ownership check, pending → confirmed
 *   3. processPayment — atomic transaction: contract, payment, notification, audit
 */

'use strict';

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const pool    = require('../db');
const m       = require('../models/catnatModel');

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) throw new Error('FATAL: JWT_SECRET is not set.');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function _generateInsuranceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand  = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `CAAR-${date}-${rand}`;
}

function _generatePolicyReference(quoteId) {
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const padded = String(quoteId).padStart(6, '0');
  return `CAT-${date}-${padded}`;
}

function _getContractDates() {
  const start = new Date();
  const end   = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start_date: fmt(start), end_date: fmt(end) };
}

function _signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '1d' }
  );
}

// ─── 1. CREATE QUOTE ──────────────────────────────────────────────────────────

/**
 * Body fields expected:
 *   first_name, last_name, email, phone?
 *   construction_type, usage_type, built_area, num_floors,
 *   year_construction, declared_value, address?,
 *   wilaya_id?, city_id?,
 *   is_seismic_compliant, has_notarial_deed, is_commercial,
 *   extra_coverages (array, e.g. ["floods","storms"]),
 *   plan_id
 *
 * Returns: { quote_id, estimated_amount, plan_name, token }
 */
async function createQuote({
  first_name, last_name, email, phone,
  construction_type, usage_type, built_area, num_floors,
  year_construction, declared_value, address,
  wilaya_id, city_id,
  is_seismic_compliant, has_notarial_deed, is_commercial,
  extra_coverages,
  plan_id,
}) {
  // Pre-transaction reads
  const plan = await m.getPlanById(plan_id);
  if (!plan) {
    const err = new Error(`Plan with id ${plan_id} not found`);
    err.status = 404;
    throw err;
  }

  const product = await m.getCatnatProduct();
  if (!product) {
    const err = new Error('CATNAT product not found in database');
    err.status = 500;
    throw err;
  }

  const existingUser = await m.findUserByEmail(email);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Find or create user
    let userId, userEmail = email, userRole = 'client';
    if (existingUser) {
      userId   = existingUser.id;
      userRole = existingUser.role;
    } else {
      const tempPassword  = crypto.randomBytes(12).toString('hex');
      const password_hash = await bcrypt.hash(tempPassword, 12);
      userId = await m.createUser(conn, {
        first_name, last_name, email, password_hash, phone,
      });
    }

    // 2. Find or create client profile
    const existingClient = existingUser ? await m.findClientByUserId(userId) : null;
    let clientId;
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      clientId = await m.createClient(conn, {
        user_id:          userId,
        insurance_number: _generateInsuranceNumber(),
      });
    }

    // 3. Create property record
    const propertyId = await m.createProperty(conn, {
      client_id:           clientId,
      construction_type,
      usage_type,
      built_area:          built_area     ? parseFloat(built_area)     : null,
      num_floors,
      year_construction:   year_construction ? parseInt(year_construction, 10) : null,
      declared_value:      declared_value ? parseFloat(declared_value) : null,
      address,
      wilaya_id:           wilaya_id ? parseInt(wilaya_id, 10) : null,
      city_id:             city_id   ? parseInt(city_id,   10) : null,
      is_seismic_compliant: is_seismic_compliant ? 1 : 0,
      has_notarial_deed:    has_notarial_deed    ? 1 : 0,
      is_commercial:        is_commercial        ? 1 : 0,
      extra_coverages:      Array.isArray(extra_coverages) ? extra_coverages : [],
    });

    // 4. Create quote
    const quoteId = await m.createQuote(conn, {
      client_id:        clientId,
      property_id:      propertyId,
      product_id:       product.id,
      plan_id:          parseInt(plan_id, 10),
      estimated_amount: parseFloat(plan.price),
    });

    await conn.commit();

    const token = _signToken({ id: userId, email: userEmail, role: userRole });

    return {
      quote_id:         quoteId,
      estimated_amount: parseFloat(plan.price),
      plan_name:        plan.name,
      token,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── 2. CONFIRM QUOTE ─────────────────────────────────────────────────────────

async function confirmQuote(quoteId, authenticatedUserId) {
  const quote = await m.getQuoteById(quoteId);

  if (!quote) {
    const err = new Error('Quote not found');
    err.status = 404;
    throw err;
  }
  if (quote.user_id !== authenticatedUserId) {
    const err = new Error('Forbidden: this quote does not belong to you');
    err.status = 403;
    throw err;
  }
  if (quote.status !== 'pending') {
    const err = new Error(`Quote cannot be confirmed (status: ${quote.status})`);
    err.status = 409;
    throw err;
  }

  await m.updateQuoteStatus(quoteId, 'confirmed');
  return { message: 'Quote confirmed successfully', quote_id: quoteId };
}

// ─── 3. PROCESS PAYMENT ───────────────────────────────────────────────────────

/**
 * Runs atomically:
 *   1. Lock + verify quote
 *   2. Create contract (property-based, no vehicle_id)
 *   3. Create payment
 *   4. Optional document
 *   5. Notification
 *   6. Audit log
 *   7. Mark quote accepted
 */
async function processPayment(quoteId, authenticatedUserId, documentData = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const quote = await m.getQuoteByIdForUpdate(conn, quoteId);
    if (!quote) {
      const err = new Error('Quote not found');
      err.status = 404;
      throw err;
    }
    if (quote.user_id !== authenticatedUserId) {
      const err = new Error('Forbidden: this quote does not belong to you');
      err.status = 403;
      throw err;
    }
    if (quote.status !== 'confirmed') {
      const err = new Error(
        `Quote cannot be paid (status: ${quote.status}). Please confirm first.`
      );
      err.status = 409;
      throw err;
    }

    const policy_reference         = _generatePolicyReference(quoteId);
    const { start_date, end_date } = _getContractDates();
    const today                    = new Date().toISOString().slice(0, 10);

    // Contract — property_id instead of vehicle_id
    const contractId = await m.createContract(conn, {
      client_id:       quote.client_id,
      property_id:     quote.property_id,    // ← CATNAT-specific
      product_id:      quote.product_id,
      plan_id:         quote.plan_id,
      start_date,
      end_date,
      premium_amount:  quote.estimated_amount,
      policy_reference,
    });

    // Payment
    await m.createPayment(conn, {
      contract_id:  contractId,
      amount:       quote.estimated_amount,
      payment_date: today,
    });

    // Optional document
    if (documentData?.file_name && documentData?.file_path) {
      await m.createDocument(conn, {
        client_id:   quote.client_id,
        contract_id: contractId,
        file_name:   documentData.file_name,
        file_path:   documentData.file_path,
        file_type:   documentData.file_type || null,
      });
    }

    // Notification
    await m.createNotification(conn, {
      user_id: authenticatedUserId,
      title:   'Votre contrat CATNAT est actif',
      message: `Votre police (${policy_reference}) est valide du ${start_date} au ${end_date}.`,
      type:    'contract',
    });

    // Audit
    await m.createAuditLog(conn, {
      user_id:     authenticatedUserId,
      action:      'CREATE_CONTRACT',
      table_name:  'contracts',
      record_id:   contractId,
      description: `CATNAT contract created via online payment. Quote #${quoteId}, Policy: ${policy_reference}`,
    });

    // Mark quote accepted
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