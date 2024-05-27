const LeaveRequest=require('../models/LeaveRequest');
const User=require('../models/UserModal');
async function getLeaveTimeStats() {
    const users = await User.find({role:'employee'});
    const stats = [];
    for (const user of users) {
      const leaves = await LeaveRequest.find({ user: user._id });
      const totalLeaveTime = leaves.reduce((total, leave) => {
        const duration = (new Date(leave.end) - new Date(leave.start)) / (1000 * 60 * 60 * 24); // Convert milliseconds to days
        return total + duration;
      }, 0);
      stats.push({ user: user.username, totalLeaveTime });
    }
    return stats;
  }
module.exports={getLeaveTimeStats};