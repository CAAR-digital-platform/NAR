const authService = require('../services/authService');

/**
 * POST /api/auth/register
 * Body: { first_name, last_name, email, password, phone? }
 */
async function register(req, res) {
  const { first_name, last_name, email, password, phone } = req.body;

  // Input validation — keep controllers thin but catch obvious mistakes
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
    const userId = await authService.register({ first_name, last_name, email, password, phone });
    return res.status(201).json({
      message: 'Account created successfully',
      userId,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const { token, user } = await authService.login({ email, password });
    return res.status(200).json({ token, user });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * GET /api/auth/me
 * Protected — requires valid JWT (set by authMiddleware)
 */
async function getMe(req, res) {
  try {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { register, login, getMe };