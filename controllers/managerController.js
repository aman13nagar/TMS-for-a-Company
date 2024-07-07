const Task = require('../models/TaskModal');
const User = require('../models/UserModal');
const { createCalendarEvent } = require('../googleCalendar');
const { sendEmail } = require('../email');
const {createNotification}=require('../utils/createNotifications');
const flash = require('express-flash');
const getTasks = async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/home-guest');

  const tasks = await Task.find({ createdBy: user._id }).populate('assignedTo');
  const employees = await User.find({ role: 'employee' });
  res.render('manager-tasks', { tasks, employees, user });
};
const editTasks = async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/home-guest');

  const perPage = 10; // Number of tasks per page
  const page = parseInt(req.query.page) || 1;

  try {
      const totalTasks = await Task.countDocuments({ createdBy: user._id });
      const totalPages = Math.ceil(totalTasks / perPage);
      const tasks = await Task.find({ createdBy: user._id })
                              .populate('assignedTo')
                              .skip((page - 1) * perPage)
                              .limit(perPage);
      const employees = await User.find({ role: 'employee' });

      res.render('edit-task', {
          tasks,
          employees,
          user,
          currentPage: page,
          totalPages,
      });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
};

const createTask = async (req, res) => {
  const { title, description, priority, dueDate, assignedTo } = req.body;
  let task = new Task({
    title,
    description,
    priority,
    dueDate,
    status: 'not started',
    assignedTo,
    createdBy: req.session.user._id,
  });
  const calendarEvent=await createCalendarEvent(task);
  task=new Task({
    title,
    description,
    priority,
    dueDate,
    status: 'not started',
    assignedTo,
    createdBy: req.session.user._id,
    calendarEvent:{eventId:calendarEvent.id,htmlLink:calendarEvent.htmlLink},
  });
  task.startTime=new Date();
  await task.save();
  const user=await User.findOne({_id:req.body.assignedTo});
  const userEmail = user.email;
  const client=req.session.user.username;
  const notificationMessage = `A new Task is assigned to you: ${task.title}.`
  await createNotification(user._id,notificationMessage)
  await sendEmail(userEmail, 'New Task Assigned',task,client,user);
  req.flash('success','Task created successfully');
  return res.redirect('/manager/tasks');
};

const updateTask = async (req, res) => {
  const { taskId, title, description, priority, dueDate, assignedTo, status } = req.body;
  let task=await Task.findByIdAndUpdate(taskId, {
    title,
    description,
    priority,
    dueDate,
    assignedTo,
    status,
  });
  const calendarEvent=await createCalendarEvent(task);
  task=await Task.findByIdAndUpdate(taskId,{
    calendarEvent:{eventId:calendarEvent.id,htmlLink:calendarEvent.htmlLink},
  })
  const user=await User.findOne({_id:req.body.assignedTo});
  const userEmail = user.email;
  const client=req.session.user.username;
  const notificationMessage = `A Task is updated: ${task.title}.`
  await createNotification(user._id,notificationMessage)
  await sendEmail(userEmail, 'Task Updated',task,client,user);
  res.redirect('/manager/edit-task');
};
const DeleteTask= async (req, res) => {
  try {
    const taskId = req.params.taskId;
    await Task.findByIdAndDelete(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
};

module.exports={getTasks,updateTask,createTask,DeleteTask,editTasks};

