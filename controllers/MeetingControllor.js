const User = require('../models/UserModal');
const Meeting = require('../models/MeetingModal');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { createNotification } = require('../utils/createNotifications');
const ScheduleMeeting = ('/scheduleMeeting', [
    body('title').notEmpty().withMessage('Title is required'),
    body('start').isISO8601().withMessage('Invalid start date'),
    body('end').isISO8601().withMessage('Invalid end date'),
    body('attendees').isString().withMessage('Invalid attendees')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const user = req.session.user;
    const newMeeting = new Meeting({
        title: req.body.title,
        start: new Date(req.body.start),
        end: new Date(req.body.end),
        attendees: req.body.attendees.split(','),
        createdBy: user._id,
        link: uuidv4()
    });

    const now = new Date();
    if (newMeeting.start < now) {
        return res.status(400).json({ errors: [{ msg: 'Cannot schedule a meeting in the past.' }] });
    }

    if (newMeeting.start >= newMeeting.end) {
        return res.status(400).json({ errors: [{ msg: 'Start date and time must be less than end date and time.' }] });
    }

    try {
        const conflictingMeetings = await Meeting.find({
            start: { $lt: newMeeting.end },
            end: { $gt: newMeeting.start }
        });

        if (conflictingMeetings.length > 0) {
            return res.status(400).json({ errors: [{ msg: 'Conflicting meetings found. Please reschedule.' }] });
        }

        await newMeeting.save();
        let totalMeetings = await Meeting.find({
            $or: [
                { createdBy: user._id },
                { attendees: user.email }
            ]
        }).countDocuments();
        let meetings = await Meeting.find({
            $or: [
                { createdBy: user._id },
                { attendees: user.email }
            ]
        });
        const dailyData = {};
        const monthlyData = {};
        const yearlyData = {};

        meetings.forEach(meeting => {
            const date = new Date(meeting.start);
            const day = date.toISOString().split('T')[0]; // yyyy-mm-dd
            const month = date.toISOString().slice(0, 7); // yyyy-mm
            const year = date.getFullYear().toString(); // yyyy

            const duration = (new Date(meeting.end) - new Date(meeting.start)) / (1000 * 60); // Convert milliseconds to minutes

            if (!dailyData[day]) dailyData[day] = 0;
            dailyData[day] += duration;

            if (!monthlyData[month]) monthlyData[month] = 0;
            monthlyData[month] += duration;

            if (!yearlyData[year]) yearlyData[year] = 0;
            yearlyData[year] += duration;
        });
        const cuser = await User.findOne({ _id:user._id });
        cuser.totalMeetings = totalMeetings;
        cuser.dailyData = dailyData;
        cuser.monthlyData = monthlyData;
        cuser.yearlyData = yearlyData;
        await cuser.save();
        req.session.user=cuser;
        const attendeeEmails = req.body.attendees.split(',');
        const attendees = await User.find({ email: { $in: attendeeEmails } });
        for (const attendee of attendees) {
            console.log(attendee)
            if (attendee) {
                await createNotification(attendee._id, `You have been invited to a meeting: <a href="/attend/${newMeeting.link}" target="_blank">Join Meeting</a>`);
            }
        }
        res.status(200).json({ message: 'Meeting scheduled successfully', link: newMeeting.link });
    } catch (err) {
        console.error(err);
        res.status(500).json({ errors: [{ msg: 'Error scheduling meeting' }] });
    }
});
const getMeetings = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(403).json({ message: 'Not authenticated' });
    }
    const user = req.session.user;
    Meeting.find({ createdBy: user._id }, (err, meetings) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching meetings' });
        }
        //res.render('meetings',{meetings:meetings});
        res.send(meetings);
    });
};
const showMeetings = async (req, res) => {
    const user = req.session.user;
    if (!user) {
        res.redirect('/');
    }
    Meeting.find({ createdBy: user._id }, (err, meetings) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching meetings' });
        }
        res.render('meetings', { meetings: meetings });
    })
}
module.exports = { ScheduleMeeting, getMeetings, showMeetings };