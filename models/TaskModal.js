const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['not started', 'in progress', 'completed'],
    default: 'not started'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  calendarEvent: {
    eventId: String,
    htmlLink: String
  },
  startTime: { type: Date },
  endTime: { type: Date }
});

let Task = mongoose.model('Task', taskSchema);
module.exports=Task;
