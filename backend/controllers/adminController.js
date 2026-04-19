'use strict';

const userModel = require('../models/userModel');
const pool = require('../db');

async function listUsers(req, res) {
  try {
    const users = await userModel.listForAdmin();
    return res.status(200).json({ count: users.length, users });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function updateUserStatus(req, res) {
  const userId = parseInt(req.params.id, 10);
  const isActive = req.body.is_active;

  if (isNaN(userId) || userId < 1) {
    return res.status(400).json({ error: 'User id must be a positive integer' });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be boolean' });
  }

  if (userId === req.user.id && isActive === false) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }

  try {
    const affected = await userModel.updateActiveStatus(userId, isActive);
    if (!affected) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await userModel.findById(userId);
    return res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updated,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function listExperts(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT ex.id AS expert_id,
              ex.is_available,
              ex.specialization,
              ex.agency_id,
              ex.wilaya_id,
              u.id AS user_id,
              u.first_name,
              u.last_name,
              u.email,
              u.phone,
              u.is_active
       FROM experts ex
       JOIN users u ON u.id = ex.user_id
       ORDER BY u.first_name, u.last_name`
    );

    return res.status(200).json({ count: rows.length, experts: rows });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  listUsers,
  updateUserStatus,
  listExperts,
};
