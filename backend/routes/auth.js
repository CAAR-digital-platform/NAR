const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// ── Public routes (no token needed) ────────────────────────────────────

// POST /api/auth/register
// Body: { first_name, last_name, email, password, phone? }
router.post('/register', authController.register);

// POST /api/auth/login
// Body: { email, password }
// Returns: { token, user }
router.post('/login', authController.login);

// ── Protected routes (valid JWT required) ───────────────────────────────

// GET /api/auth/me
// Header: Authorization: Bearer <token>
// Returns the profile of the currently logged-in user
router.get('/me', authMiddleware, authController.getMe);
// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  try {
    await pool.execute(
      'UPDATE users SET first_name=?, last_name=?, phone=? WHERE id=?',
      [first_name, last_name, phone || null, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;