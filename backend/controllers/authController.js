const authService = require('../services/authService');

async function register(req, res) {
  const { first_name, last_name, email, password, phone } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({
      error: 'first_name, last_name, email and password are required',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters',
    });
  }

  try {
    const userId = await authService.register({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone ? phone.trim() : null,
    });

    return res.status(201).json({
      message: 'Account created successfully',
      user_id: userId,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const { token, user } = await authService.login({
      email: email.trim().toLowerCase(),
      password,
    });
    return res.status(200).json({ token, user });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function getMe(req, res) {
  try {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function updateProfile(req, res) {
  const { first_name, last_name, email, phone } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({
      error: 'first_name, last_name and email are required',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const user = await authService.updateProfile(req.user.id, {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
    });

    return res.status(200).json({
      message: 'Profile updated',
      user,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function changePassword(req, res) {
  const { current_password, new_password } = req.body;

  try {
    const result = await authService.changePassword(req.user.id, {
      current_password,
      new_password,
    });

    return res.status(200).json({
      message: 'Password updated',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { register, login, getMe, updateProfile, changePassword };
