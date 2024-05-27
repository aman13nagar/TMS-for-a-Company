
const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(403).send('Not authorized');
    }

    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
};

module.exports = {
    getNotifications
};
