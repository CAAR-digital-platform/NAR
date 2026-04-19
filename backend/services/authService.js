const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { issueAuthToken } = require('../utils/subscriptionHelpers');

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

  await userModel.createClient(userId);
  return userId;
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  if (!user.is_active) {
    const err = new Error('Your account is deactivated. Please contact support.');
    err.status = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = issueAuthToken(user);
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

async function getMe(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

async function updateProfile(userId, { first_name, last_name, email, phone }) {
  const user = await userModel.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const existing = await userModel.findByEmail(email);
  if (existing && existing.id !== userId) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  await userModel.updateProfile(userId, {
    first_name,
    last_name,
    email,
    phone,
  });

  return userModel.findById(userId);
}

async function changePassword(userId, { current_password, new_password }) {
  if (!current_password || !new_password) {
    const err = new Error('current_password and new_password are required');
    err.status = 400;
    throw err;
  }

  if (new_password.length < 8) {
    const err = new Error('New password must be at least 8 characters');
    err.status = 400;
    throw err;
  }

  const user = await userModel.findAuthById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Current password is incorrect');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(new_password, 12);
  await userModel.updatePassword(userId, passwordHash);
  return { user_id: userId };
}

module.exports = { register, login, getMe, updateProfile, changePassword };
