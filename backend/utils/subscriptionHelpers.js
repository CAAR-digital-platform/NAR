'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}

function getDateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function generateInsuranceNumber() {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `CAAR-${getDateStamp()}-${rand}`;
}

function generatePolicyReference(prefix, recordId) {
  const padded = String(recordId).padStart(6, '0');
  return `${prefix}-${getDateStamp()}-${padded}`;
}

function getAnnualContractDates() {
  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);

  const format = (date) => date.toISOString().slice(0, 10);

  return {
    start_date: format(start),
    end_date: format(end),
  };
}

function issueAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      must_change_password: Boolean(user.must_change_password),
    },
    SECRET_KEY,
    { expiresIn: '1d' }
  );
}

module.exports = {
  generateInsuranceNumber,
  generatePolicyReference,
  getAnnualContractDates,
  issueAuthToken,
};
