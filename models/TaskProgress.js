const mongoose = require('mongoose');

const taskProgressSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  userId: String,
  startTime: Date,
  endTime: Date,
  description: String
});

const TaskProgress = mongoose.model('TaskProgress', taskProgressSchema);
module.exports = TaskProgress;
