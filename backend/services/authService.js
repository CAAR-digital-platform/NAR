const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/Usermodel');

const SECRET_KEY = process.env.JWT_SECRET || 'SECRET_KEY_CAAR'; // move to .env in production

/**
 * REGISTER
 * - Validates no duplicate email
 * - Hashes the password
 * - Creates the user row
 * - Also inserts into the `clients` table (default role)
 * Returns the newly created user id
 */
async function register({ first_name, last_name, email, password, phone }) {
  // 1. Check for duplicate email
  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  // 2. Hash the password
  const password_hash = await bcrypt.hash(password, 12);

  // 3. Create the user with role = 'client' (default)
  const newId = await userModel.createUser({
    first_name,
    last_name,
    email,
    password_hash,
    phone,
    role: 'client',
  });

  return newId;
}

/**
 * LOGIN
 * - Verifies email + password
 * - Signs and returns a JWT
 * Returns { token, user }
 */
async function login({ email, password }) {
  // 1. Find user
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  // 3. Sign JWT — payload contains only what controllers need
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '1d' }
  );

  // 4. Return token + safe user object (no password_hash)
  const safeUser = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  return { token, user: safeUser };
}

/**
 * GET ME
 * Fetches the authenticated user's profile by id (from token).
 */
async function getMe(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

module.exports = { register, login, getMe };