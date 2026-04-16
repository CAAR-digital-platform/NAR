'use strict';

const notificationService = require('../services/notificationService');

async function listMine(req, res) {
  try {
    const notifications = await notificationService.listForUser(
      req.user.id,
      req.query.limit
    );

    return res.status(200).json({
      count: notifications.length,
      unread_count: notifications.filter(n => !n.is_read).length,
      notifications,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function markRead(req, res) {
  const notificationId = parseInt(req.params.id, 10);
  if (isNaN(notificationId) || notificationId < 1) {
    return res.status(400).json({ error: 'Notification id must be a positive integer' });
  }

  try {
    const result = await notificationService.markReadForUser(
      notificationId,
      req.user.id
    );

    return res.status(200).json({
      message: 'Notification marked as read',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function markAllRead(req, res) {
  try {
    const result = await notificationService.markAllReadForUser(req.user.id);
    return res.status(200).json({
      message: 'Notifications marked as read',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  listMine,
  markRead,
  markAllRead,
};
