const Task = require('../models/TaskModal');

const getEmployeeTasks = async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/home-guest');
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const tasks = await Task.find({ assignedTo: user._id }).skip(skip).limit(limit);
  const totalTasks = await Task.find({assignedTo:user._id}).countDocuments();
  res.render('employee-tasks', {
    tasks,
    currentPage: page,
    totalPages: Math.ceil(totalTasks / limit),
    limit:limit
  });
  // const tasks = await Task.find({ assignedTo: user._id });
  // res.render('employee-tasks', { tasks, user });
};
const completeTask = async (req, res) => {
    const taskId = req.params.taskId;
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).send('Task not found');
      }
  
      task.status = 'completed';
      task.endTime = new Date();
      await task.save();
      res.redirect('/employee/tasks'); // Redirect back to the employee's task list
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
module.exports={getEmployeeTasks,completeTask};
