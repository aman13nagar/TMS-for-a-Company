const User=require('../models/UserModal');
const Meeting=require('../models/MeetingModal');
const LeaveRequest=require('../models/LeaveRequest');
const Feedback=require('../models/FeedbackModal');
const { v4: uuidv4 } = require('uuid');
const {createNotification}=require('../utils/createNotifications');
const { body, validationResult } = require('express-validator');
const RequestLeave=('/request-leave', [
    body('start').isISO8601().withMessage('Invalid start date'),
    body('end').isISO8601().withMessage('Invalid end date'),
    body('reason').notEmpty().withMessage('Reason is required')
], async(req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(403).send('Not authenticated');
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const user=req.session.user;
    const leaveRequest = new LeaveRequest({
        user: req.user._id,
        start: new Date(req.body.start),
        end: new Date(req.body.end),
        reason: req.body.reason,
        createdBy:user._id
    });
    const admins=await User.find({role:'manager'});
    leaveRequest.save(async(err) => {
        if (err) {
            return res.status(500).send('Error requesting leave');
        }
        admins.forEach(async admin=>{
            await createNotification(admin._id,`${user.username} sent a leave request`);
        })
        res.status(200).send('Leave requested successfully');
    });
});
const GetLeaveRequests=async(req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(403).send('Not authenticated');
    }
    LeaveRequest.find({ createdBy: req.session.user._id }, (err, leaves) => {
        if (err) {
            return res.status(500).send('Error fetching leave requests');
        }
        res.send(leaves);
    });
};
const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.USER, pass: process.env.APP_PASSWORD },
});
async function sendEmail(to, subject,feedback) {
    const text = `
      Name: ${feedback.name}
      Email: ${feedback.email}
      Rating:${feedback.rating}
      Comments:${feedback.comments}
    `;
  try {
    const info = await transporter.sendMail({
      from: 'aammn52340@gmail.com',
      to,
      subject,
      text,
    });
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
const FeedbackForm=async(req,res)=>{
    try{
        const {feedback}=req.body;
        const feedbacks=new Feedback({
            name:req.body.name,
            email:req.body.email,
            rating:req.body.rating,
            comments:req.body.comments
        })
        sendEmail('aman13nagar@gmail.com','Feedback form',feedbacks)
        await feedbacks.save();
        res.send({success:true,msg:'Feedback form submitted successfully'});
    }catch(error){
        res.send({success:false,msg:error.message});
    }
}
module.exports={RequestLeave,GetLeaveRequests,FeedbackForm}