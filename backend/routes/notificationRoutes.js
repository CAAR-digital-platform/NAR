'use strict';

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificationController');

router.get('/', authMiddleware, ctrl.listMine);
router.patch('/read-all', authMiddleware, ctrl.markAllRead);
router.patch('/:id/read', authMiddleware, ctrl.markRead);

module.exports = router;
