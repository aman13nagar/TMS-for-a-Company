const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdBy:{type:mongoose.Types.ObjectId,ref:'User'}
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
module.exports=LeaveRequest;