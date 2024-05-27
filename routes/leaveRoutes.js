const express = require('express');
const router = express.Router();
const LeaveController=require('../controllers/leaveControllor');
const LeaveRequest=require('../models/LeaveRequest');
const isEmployee=require('../middlewares/clientmiddleware');
const isManager=require('../middlewares/managermiddleware');
router.post('/request-leave',isManager,LeaveController.RequestLeave);
router.get('/leave-requests',isManager,LeaveController.GetLeaveRequests);
router.get('/pending-leave-requests',isEmployee, async (req, res) => {
    try {
        const leaveRequests = await LeaveRequest.find({ status: 'pending' }).populate('user');
        res.render('manager-approval', { leaveRequests });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
const {createNotification}=require('../utils/createNotifications');
router.post('/approve-leave/:id',isEmployee,async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest.findById(req.params.id);
        leaveRequest.status = 'approved';
        await createNotification(leaveRequest.user, 'Your leave request has been approved.');
        await leaveRequest.save();
        res.send('Leave approved');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.post('/reject-leave/:id',isEmployee, async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest.findById(req.params.id);
        leaveRequest.status = 'rejected';
        await createNotification(leaveRequest.user, 'Your leave request has been rejected.');
        await leaveRequest.save();
        res.send('Leave rejected');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.post('/feedback-form',LeaveController.FeedbackForm);
module.exports = router;
