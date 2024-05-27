const Notification = require('../models/Notification');

const createNotification = async (userId, message) => {
    const notifications = new Notification({ userId, message });
    await notifications.save();
};

module.exports={createNotification};