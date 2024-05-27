const express = require('express');
const router = express.Router();
const MeetingControllor=require('../controllers/MeetingControllor');
const Meeting=require('../models/MeetingModal');
router.post('/scheduleMeeting',MeetingControllor.ScheduleMeeting);
router.get('/meetings',MeetingControllor.getMeetings);
router.get('/showmeetings',MeetingControllor.showMeetings);
router.get('/showmeetings/:link', (req, res) => {
    Meeting.findOne({ link: req.params.link }, (err, meeting) => {
      if (err || !meeting) {
        return res.status(404).send('Meeting not found');
      }
      res.render('attend', { meeting });
    });
  });
module.exports=router;