// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get notifications for a user
router.get('/notifications/:userId', async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Mark notification as read
router.post('/notifications/mark-as-read/:id', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.send('Notification marked as read');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.post('/notifications/mark-all-as-read/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Error marking all notifications as read' });
    }
  });
module.exports = router;
