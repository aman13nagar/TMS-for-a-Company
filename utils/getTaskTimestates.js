const Task=require('../models/TaskModal');
const User=require('../models/UserModal');
async function getTaskTimeStats() {
    const users = await User.find({role:'employee'});
    const stats = [];
    for (const user of users) {
      const tasks = await Task.find({ assignedTo: user._id });
      const totalTimeSpent = tasks.reduce((total, task) => {
        if (task.startTime && task.endTime) {
          const duration = (new Date(task.endTime) - new Date(task.startTime)) / (1000 * 60); // Convert milliseconds to minutes
          return total + duration;
        }
        return total;
      }, 0);
      stats.push({ user: user.username, totalTimeSpent });
    }
    return stats;
  }
module.exports={getTaskTimeStats};