'use strict';

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/adminController');

router.get('/users', authMiddleware, requireRole('admin'), ctrl.listUsers);
router.get('/experts', authMiddleware, requireRole('admin'), ctrl.listExperts);
router.patch('/users/:id/status', authMiddleware, requireRole('admin'), ctrl.updateUserStatus);

module.exports = router;
