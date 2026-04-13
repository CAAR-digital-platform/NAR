const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const userModel = require('../models/Usermodel');

// Hard requirement: JWT_SECRET must be set in .env — no fallback.
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}

/**
 * REGISTER
 * Creates user row + client profile row atomically (sequential inserts).
 * Returns the new user id.
 */
async function register({ first_name, last_name, email, password, phone }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const userId = await userModel.createUser({
    first_name,
    last_name,
    email,
    password_hash,
    phone,
    role: 'client',
  });

  // FIX: always create the clients row so ownership checks work
  await userModel.createClient(userId);

  return userId;
}

/**
 * LOGIN
 */
async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '1d' }
  );

  const safeUser = {
    id:         user.id,
    first_name: user.first_name,
    last_name:  user.last_name,
    email:      user.email,
    phone:      user.phone,
    role:       user.role,
  };

  return { token, user: safeUser };
}

/**
 * GET ME
 */
async function getMe(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  return user;
}

module.exports = { register, login, getMe };