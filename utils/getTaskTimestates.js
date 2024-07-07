const Task = require('../models/TaskModal');
const User = require('../models/UserModal');

async function getTaskTimeStats() {
    const users = await User.find({ role: 'employee' });
    const stats = [];

    for (const user of users) {
        const tasks = await Task.find({ assignedTo: user._id });
        let totalTimeSpent = 0;

        for (const task of tasks) {
            if (task.startTime && task.endTime) {
                const startTime = new Date(task.startTime);
                const endTime = new Date(task.endTime);
                const duration = (endTime - startTime) / (1000 * 60);
                totalTimeSpent += duration;

                // Logging for debugging
                console.log(`User: ${user.username}, Task: ${task.title}, StartTime: ${startTime}, EndTime: ${endTime}, Duration: ${duration}`);
            } else {
                // Logging for debugging
                console.log(`User: ${user.username}, Task: ${task.title} does not have valid startTime or endTime`);
            }
        }

        stats.push({ user: user.username, totalTimeSpent });
    }

    return stats;
}

module.exports = { getTaskTimeStats };
