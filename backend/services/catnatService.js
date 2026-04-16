'use strict';

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const pool    = require('../db');
const m       = require('../models/catnatModel');
const { createContractPDF } = require('../utils/pdfGenerator');
const { sendContractEmail } = require('../utils/mailer');
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) throw new Error('FATAL: JWT_SECRET is not set.');

// ─── HELPERS ─────────────────────────────────────────────────

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

// ─── PREMIUM ─────────────────────────────────────────────────

function calculatePremium({
  declared_value,
  construction_type,
  is_seismic_compliant,
  is_commercial,
  extra_coverages,
}) {
  let premium = declared_value * 0.0004;

  if (construction_type === 'Villa') premium *= 1.2;
  if (!is_seismic_compliant) premium *= 1.3;
  if (is_commercial) premium *= 1.25;

  if (Array.isArray(extra_coverages)) {
    if (extra_coverages.includes('floods')) premium += 2000;
    if (extra_coverages.includes('storms')) premium += 1500;
    if (extra_coverages.includes('ground')) premium += 1800;
  }

  const taxes = premium * 0.19;
  return premium + taxes;
}

// ─── CREATE QUOTE ────────────────────────────────────────────

async function createQuote(data) {
  const {
    first_name, last_name, email, phone,
    construction_type, usage_type,
    built_area, num_floors,
    year_construction, declared_value,
    address, wilaya_id, city_id,
    is_seismic_compliant, has_notarial_deed, is_commercial,
    extra_coverages,
  } = data;

  // Backend calculates premium — no plan dependency
  const estimated_amount = calculatePremium({
    declared_value,
    construction_type,
    is_seismic_compliant,
    is_commercial,
    extra_coverages,
  });

  const product = await m.getCatnatProduct();
  if (!product) throw new Error('CATNAT product not found');

  const existingUser = await m.findUserByEmail(email);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let userId;
    let userRole = 'client';

    if (existingUser) {
      userId   = existingUser.id;
      userRole = existingUser.role || 'client';
    } else {
      const tempPassword  = crypto.randomBytes(12).toString('hex');
      const password_hash = await bcrypt.hash(tempPassword, 12);
      userId = await m.createUser(conn, { first_name, last_name, email, password_hash, phone });
    }

    const existingClient = await m.findClientByUserId(userId);
    const clientId = existingClient
      ? existingClient.id
      : await m.createClient(conn, {
          user_id: userId,
          insurance_number: _generateInsuranceNumber(),
        });

    const propertyId = await m.createProperty(conn, {
      client_id: clientId,
      construction_type,
      usage_type,
      built_area,
      num_floors,
      year_construction,
      declared_value,
      address,
      wilaya_id,
      city_id,
      is_seismic_compliant,
      has_notarial_deed,
      is_commercial,
      extra_coverages,
    });

    const quoteId = await m.createQuote(conn, {
      client_id:        clientId,
      property_id:      propertyId,
      product_id:       product.id,
      plan_id:          null,   // no plan for CATNAT — premium calculated server-side
      estimated_amount,
    });

    // Notification
    await conn.execute(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [userId, 'Quote created', `Your CATNAT quote #${quoteId} has been created.`, 'info']
    );

    // Audit log — use correct column names (table_name, record_id, description)
    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'CREATE', 'quotes', quoteId, `CATNAT quote created for property_id=${propertyId}`]
    );

    await conn.commit();

    const token = _signToken({ id: userId, email, role: userRole });

    return { quote_id: quoteId, estimated_amount, token };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── CONFIRM ─────────────────────────────────────────────────

async function confirmQuote(quoteId, userId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // FIX: query must return user_id for ownership check
    const [rows] = await conn.execute(
      `SELECT q.*, c.user_id
       FROM quotes q
       JOIN clients c ON c.id = q.client_id
       WHERE q.id = ?
       FOR UPDATE`,
      [quoteId]
    );
    const quote = rows[0] || null;

    if (!quote) throw Object.assign(new Error('Quote not found'), { status: 404 });

    // FIX: ownership check
    if (quote.user_id !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });

    // Only pending quotes can be confirmed
    if (quote.status !== 'pending') {
      throw Object.assign(
        new Error(`Quote cannot be confirmed (current status: ${quote.status})`),
        { status: 409 }
      );
    }

    await conn.execute(
      'UPDATE quotes SET status = ? WHERE id = ?',
      ['confirmed', quoteId]
    );

    // Notification
    await conn.execute(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [userId, 'Quote confirmed', `Your quote #${quoteId} has been confirmed.`, 'success']
    );

    // Audit log
    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'CONFIRM', 'quotes', quoteId, `CATNAT quote #${quoteId} confirmed`]
    );

    await conn.commit();

    return { message: 'Quote confirmed', quote_id: quoteId };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── PAYMENT ─────────────────────────────────────────────────

async function processPayment(quoteId, userId, documentData = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // FIX: query must return user_id for ownership check
    const [rows] = await conn.execute(
      `SELECT q.*, c.user_id
       FROM quotes q
       JOIN clients c ON c.id = q.client_id
       WHERE q.id = ?
       FOR UPDATE`,
      [quoteId]
    );
    const quote = rows[0] || null;

    if (!quote) throw Object.assign(new Error('Quote not found'), { status: 404 });

    // FIX: ownership check
    if (quote.user_id !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });

    // FIX: enforce status flow — must be confirmed before payment
    if (quote.status !== 'confirmed') {
      throw Object.assign(
        new Error(`Quote must be confirmed before payment (current status: ${quote.status})`),
        { status: 409 }
      );
    }

    // FIX: prevent duplicate contracts — check via property_id + client_id + product_id
    // Since contracts has no quote_id, we guard on property_id which is unique per quote
    if (quote.property_id) {
      const [existing] = await conn.execute(
        'SELECT id FROM contracts WHERE property_id = ? AND client_id = ? AND product_id = ?',
        [quote.property_id, quote.client_id, quote.product_id]
      );
      if (existing.length > 0) {
        throw Object.assign(
          new Error('A contract already exists for this property and product'),
          { status: 409 }
        );
      }
    }

    const { start_date, end_date } = _getContractDates();
    const policy_reference = _generatePolicyReference(quoteId);

    const contractId = await m.createContract(conn, {
      client_id:      quote.client_id,
      property_id:    quote.property_id,
      product_id:     quote.product_id,
      plan_id:        null,
      start_date,
      end_date,
      premium_amount: quote.estimated_amount,
      policy_reference,
    });

    await m.createPayment(conn, {
      contract_id:  contractId,
      amount:       quote.estimated_amount,
      payment_date: new Date().toISOString().slice(0, 10),
    });

    // Optional document
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
  product_name: 'CATNAT Insurance',
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
    // Notification
    await conn.execute(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [userId, 'Payment successful', `Your policy ${policy_reference} is now active.`, 'success']
    );

    // Audit log
    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'CREATE_CONTRACT', 'contracts', contractId,
       `CATNAT contract created via online payment. Quote #${quoteId}, Policy: ${policy_reference}`]
    );

    // FIX: mark quote as accepted (not 'paid' — not a valid enum value)
    await conn.execute(
      'UPDATE quotes SET status = ? WHERE id = ?',
      ['accepted', quoteId]
    );

    await conn.commit();

    return {
      message:        'Payment successful',
      contract_id:    contractId,
      policy_reference,
      start_date,
      end_date,
      amount_paid:    parseFloat(quote.estimated_amount),
    };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { createQuote, confirmQuote, processPayment };