require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("./public"));
app.use("/uploads",express.static("uploads"));
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))

// Configure Passport to use the LocalStrategy
app.use(passport.initialize());
app.use(passport.session());
mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://aman13nagar:CmluH9w5Uq88szEZ@cluster0.e3nardl.mongodb.net/OurTMS", { useNewUrlParser: true});
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    phone_no: String
});
const appointmentSchema = new mongoose.Schema({
    username:String,
    invitedPersons: String,
    venue: String,
    dateTime: Date,
    duration: Number,
    project:String,
    project_id:Number,
    purpose: String
});
const Projects=[['Time Management Software (TMS) for a company',1],['Hotel Automation Software',2],['Road Repair and Tracking System (RRTS)',3],
                ['Judiciary Information System (JIS)' ,4],['Library Information System (LIS)',5],['Restaurant Automation System (RAS)',6],
                ['Transport company computerization (TCC) software',7],['simulation software',8],['Software component cataloguing software',9],
                ['Supermarket automation software (SAS)',10],['Book-shop Automation Software (BAS)',11],['structured software analysis and design',12],
                ['Newspaper Agency Automation Software',13],['University Department Information System',14],['Motor Part Shop Software (MPSS)',15],
                ['Students’ Auditorium Management Software',16],['Medicine Shop Automation (MSA)',17]]
const Appointment = mongoose.model('Appointment', appointmentSchema);
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    })
});
app.get("/", function (req, res) {
    res.render("home-guest");
})
let currexecutive;
let curremail;
app.post("/", function (req, res) {
    currexecutive=req.body.username;
    curremail=req.body.email;
    User.register({ username: req.body.username, email: req.body.mail, phone_no: req.body.mobile }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.render("home-dashboard");
            })
        }
    })
})
app.post("/home-guestlogin", function (req, res) {
    currexecutive=req.body.username;
    curremail=req.body.email;
    const user = new User({
        username: req.body.username,
        password: req.body.password,
        email: req.body.mail,
        phone_no: req.body.mobile
    })
    req.login(user, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/home-guest");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.render("home-dashboard");
            })
        }
    })
})
app.get("/home-dashboard", function (req, res) {
    res.render("home-dashboard");
})
app.get("/home-guestlogin", function (req, res) {
    res.render("home-guestlogin");
})
app.get("/find_slots", function (req, res) {
    res.render("find_slots");
})
  async function rearrangeAppointments(meetingDate) {
    try {
        // Retrieve all appointments for the given meeting date
        const appointments = await Appointment.find({ dateTime: meetingDate });
        console.log(meetingDate);
        console.log(appointments);
        // Sort appointments by priority or any other relevant criteria
        appointments.sort((a, b) => {
            // Logic to determine priority, e.g., based on the duration of the meeting
            return a.duration - b.duration;
        });

        // Define a function to check if a time slot is available
        const isSlotAvailable = (startTime, endTime) => {
            // Check if the time slot overlaps with any existing appointments
            for (const appointment of appointments) {
                if (appointment.startTime < endTime && appointment.endTime > startTime) {
                    return false; // Time slot is not available
                }
            }
            return true; // Time slot is available
        };

        // Loop through appointments and try to rearrange them
        for (const appointment of appointments) {
            // Check if there are alternative time slots available
            let startTime = new Date(appointment.dateTime);
            let endTime = new Date(startTime.getTime() + appointment.duration * 60000); // Convert duration to milliseconds
            console.log(startTime);
            console.log(endTime);
            while (!isSlotAvailable(startTime, endTime)) {
                // Increment startTime to find the next available time slot
                startTime.setMinutes(startTime.getMinutes() + 15); // Example: Increment by 15 minutes
                endTime = new Date(startTime.getTime() + appointment.duration * 60000);
            }

            // Update the appointment with the new time slot
            appointment.dateTime = endTime;
            console.log(appointment);
            // Save the updated appointment to the database
            await appointment.save();
        }
        console.log(appointments)
        console.log('Appointments rearranged successfully!');
        //res.send("<script>alert('Slot is not available but don't worry we rearranged your slot');window.location='/home-dashboard';</script>")
    } catch (error) {
        console.error('Error rearranging appointments:', error);
        throw new Error('Error rearranging appointments');
    }
}
app.post('/find_slots',async(req,res)=>{
    try{
        const {time,duration}=req.body;
        let startTime = new Date(time);
        let endTime = new Date(startTime.getTime() +duration * 60000);
        let find=await Appointment.find({dateTime:startTime});
        console.log(find);
        var Boolean =false;
        let t=time;
        for(let k=new Date(startTime);k<=endTime;k.setMinutes(k.getMinutes()+1)){
          console.log(k);
          find=await Appointment.find({dateTime:k});
          if(find.length!=0){
            Boolean=true;
            t=k;
            break;
          }
        }
        console.log(Boolean);
        if(Boolean==true){
          console.log("Slot is not Available");
          rearrangeAppointments(t);
            //res.status(201).send('Slot is not Available');
          res.send("<script>alert('Slot is not available but rearranged');window.location='/find_slots';</script>")
        }
        else{
          console.log("Slot is Available");
            //res.redirect('/schedule');
          res.send("<script>alert('Slot is available you can book now');window.location='/schedule';</script>")
        }
    } catch(error){
        //res.status(201).send('slot is not Available');
        console.log("Error",error);
    }
})
app.get("/schedule", function (req, res) {
    res.render("schedule",{Projects});
})
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.APP_PASSWORD
    }
  });
  
  // Function to send email notification
  const sendEmailNotification = async (username,recipientEmail,venue,time,duration,purpose) => {
    try {
      await transporter.sendMail({
        from: 'aammn52340@gmail.com',
        to: recipientEmail,
        subject: 'Appointment Confirmation',
        text: 'Your appointment has been registered successfully.Please find the meeting details:'
      });
      console.log('Email notification sent successfully.');
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  };
  
app.post('/schedule', async (req, res) => {

    try {
        const { username,invitedPersons, venue, dateTime, duration,project, purpose } = req.body;
        let startTime = new Date(dateTime);
        let endTime = new Date(startTime.getTime() +duration * 60000);
        const today=new Date();
        const startDateDate= new Date(startTime);
        if(startDateDate<today){
          res.send("<script>alert('error:Start date must be in the future');window.location='/schedule';</script>")
        }
        else if(username!==currexecutive){
          res.send("<script>alert('Please enter a valid username');window.location='/schedule';</script>")
        }
        else{
        let find=await Appointment.find({dateTime:startTime});
        console.log(find);
        var Boolean =false;
        let t=dateTime;
        for(let k=new Date(startTime);k<=endTime;k.setMinutes(k.getMinutes()+1)){
          console.log(k);
          find=await Appointment.find({dateTime:k});
          if(find.length!=0){
            Boolean=true;
            t=k;
            break;
          }
        }
        console.log(Boolean);
        if(Boolean==true){
          console.log("Slot is not Available");
          rearrangeAppointments(t);
            //res.status(201).send('Slot is not Available');
          res.send("<script>alert('Slot is not available but rearranged');window.location='/schedule';</script>")
        }
        else{
        const projectArray = JSON.parse(project);
        console.log(projectArray);
        console.log(projectArray[0],project[1]);
        const appointment = new Appointment({ username,invitedPersons, venue, dateTime, duration,project:projectArray[0],project_id:projectArray[1], purpose });
        await appointment.save();
        // Send email notification to the person
        await sendEmailNotification(username,invitedPersons,venue,dateTime,duration,purpose);
        //res.status(201).send('Appointment registered successfully.');
        res.send("<script>alert('Appointment registered successfully.Please check your email');window.location='/home-dashboard';</script>");
        //sendSuccessResponse(res,"Appointment registered successfully. For further details please check your Email");
        }
      }
    } catch (error) {
        console.error('Error registering appointment:', error);
        res.status(500).send('An error occurred while registering the appointment.');
    }
});
app.get('/check_appointments', async (req, res) => {
  if (!req.isAuthenticated()) {
    // Redirect to login page or handle unauthorized access
    return res.redirect('/');
  }
  const appointments = await Appointment.find({ username: req.user.username });
  console.log(appointments);
  console.log(req.user.username);
  Appointment.find({username:req.user.username},function(err, username){
    res.render("check_appointments", {username});
  })
});
app.get("/leave",async(req,res)=>{
  res.render("leave");
})
const leaveSchema =new mongoose.Schema({
  username:String,
  startDate:String,
  endDate:String,
  applyDate:String,
  purpose:String,
  document:String
})
const Leave =mongoose.model('Leave',leaveSchema);
app.post('/leave', async (req, res) => {
  try {
      const startDate=req.body.startDate;
      const endDate=req.body.endDate;
      const purpose=req.body.purpose;
      const link=req.body.document;
      console.log(startDate,endDate);
      const today=new Date();
      //const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startDateDate= new Date(startDate);
      console.log(startDateDate);
      console.log(today);
      if (startDate >= endDate) {
          res.send("<script>alert('error:End date must be after start date.');window.location='/leave';</script>");
      }
      else if(startDateDate<today){
        res.send("<script>alert('error:Start date must be in the future');window.location='/leave';</script>")
      }
      else{
      // Save leave application to the database
      const leave = new Leave({
          username:currexecutive,
          startDate:startDate,
          endDate:endDate,
          applyDate:today,
          purpose:purpose,
          document:link
      });
      await leave.save();
      try {
        await transporter.sendMail({
          from: 'aammn52340@gmail.com',
          to: 'aman13nagar@gmail.com',
          subject: 'Leave confirmation',
          text: 'Leave application submitted successfully'
        });
        console.log('Email notification sent successfully.');
      } catch (error) {
        console.error('Error sending email notification:', error);
      }
      res.send("<script>alert('Leave application submitted successfully. Please check your email');window.location='/leave';</script>");
      }
  } catch (error) {
      console.log('Error submitting leave application:', error);
      //res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});
app.get("/checkleaves",async(req,res)=>{
  if (!req.isAuthenticated()) {
    // Redirect to login page or handle unauthorized access
    return res.redirect('/');
  }
  const leaves=await Leave.find({username:currexecutive});
  console.log(leaves);
  //res.render("checkleaves",{leaves});
  Leave.find({username:currexecutive},function(err, username){
    res.render("checkleaves", {leaves});
  })
})
// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Folder where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize multer upload
const profileSchema = new mongoose.Schema({
  username: String,
  profilePictureUrl: String
});
const Profile = mongoose.model('Profile', profileSchema);
const upload = multer({ storage: storage });

// Endpoint to handle profile picture uploads
app.get('/upload-profile-picture',async(req,res)=>{
  res.render('upload-profile-picture');
})
app.post('/upload-profile-picture', upload.single('profilePicture'),async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const profilePictureUrl = req.file.path; // Change this to the actual URL if storing in a cloud service
  console.log(profilePictureUrl)
  try {
    const profile = new Profile({
      username: currexecutive, // Add the name of the user
      profilePictureUrl: profilePictureUrl
    });
    await profile.save();
    res.status(200).json({ message: 'Profile picture uploaded successfully', profilePictureUrl });
    //res.send("<script>alert('Profile picture uploaded successfully');window.location='/profile';</script>")
  } catch (error) {
    console.error('Error saving profile picture to database:', error);
    //res.status(500).json({ error: 'An error occurred while saving profile picture to database' });
  }
});
app.get("/profile",async(req,res)=>{
  if(!req.isAuthenticated()){
    return res.redirect('/');
  }
  const user=await User.find({username:req.user.username});
  console.log(user)
  const profile=await Profile.find({username:currexecutive});
  console.log(profile);
  console.log(user);
  console.log(req.user.username);
  User.find({username:req.user.username},function(err,user){
    res.render("profile",{user,profile});
  })
})
app.get('/statistics', async (req, res) => {
  try {
      // Get executive meeting time stats
      const stats1 = await getExecutiveMeetingTimeStats();
      const uniqueStats1 = new Set();
      stats1.forEach(row => {
        const rowString = JSON.stringify(row); // Convert the row object to a string
        uniqueStats1.add(rowString); // Add the string representation of the row to the Set
      });
      const executiveMeetingTimeStats = Array.from(uniqueStats1).map(rowString => JSON.parse(rowString));
      // Get project meeting stats
      const stats = await getProjectMeetingStats();
      const uniqueStats = new Set();
      stats.forEach(row => {
        const rowString = JSON.stringify(row); // Convert the row object to a string
        uniqueStats.add(rowString); // Add the string representation of the row to the Set
      });
      const projectMeetingStats = Array.from(uniqueStats).map(rowString => JSON.parse(rowString));
      // Get average executive meeting time
      const averageExecutiveMeetingTime = await getAverageExecutiveMeetingTime();
      const labels=[];
      const data=[];
      for(let i=0;i<executiveMeetingTimeStats.length;i++){
        labels.push(executiveMeetingTimeStats[i].executive);
        data.push(executiveMeetingTimeStats[i].totalMeetingTime);
      }
      console.log(labels,data);
      const labels1=[];
      const data1=[];
      for(let i=0;i<projectMeetingStats.length;i++){
        if(projectMeetingStats[i].project!==undefined){
          labels1.push(projectMeetingStats[i].project_id);
          data1.push(projectMeetingStats[i].totalMeetingTime);
        }
      }
      console.log(currexecutive);
      // const currexecutive=;
      console.log(labels1,data1);
      res.render('statistics', { executiveMeetingTimeStats, projectMeetingStats, averageExecutiveMeetingTime,labels,data,labels1,data1,
      currexecutive});
  } catch (error) {
      console.error('Error retrieving statistics:', error);
      res.status(500).send('An error occurred while retrieving statistics.');
  }
});
// Function to get statistics for executive meeting time
async function getExecutiveMeetingTimeStats() {
  // Retrieve all executives
  const executives = await User.find();
  //console.log(executives);
  // Iterate through executives and calculate their total meeting time
  const stats = [];
  for (const executive of executives) {
      const meetings = await Appointment.find({ username: executive.username });
      console.log(meetings)
      const totalMeetingTime = meetings.reduce((total, meeting) => total + meeting.duration, 0);
      stats.push({ executive: executive.username, totalMeetingTime });
  }
  return stats;
}
// Function to get statistics for project meetings
async function getProjectMeetingStats() {
  // Retrieve all projects
  const projects = await Appointment.find();
  // Iterate through projects and calculate the number of meetings and total meeting time
  const stats = [];
  for (const project of projects) {
      const meetings = await Appointment.find({ project:project.project});
      const numMeetings = meetings.length;
      const totalMeetingTime = meetings.reduce((total, meeting) => total + meeting.duration, 0);
      stats.push({ project: project.project,project_id:project.project_id, numMeetings, totalMeetingTime });
  }
  return stats;
}
// Function to calculate the average executive meeting time
async function getAverageExecutiveMeetingTime() {
  // Retrieve all meetings
  const meetings = await Appointment.find();
  // Calculate total meeting time and total number of executives
  const totalMeetingTime = meetings.reduce((total, meeting) => total + meeting.duration, 0);
  const totalExecutives = await User.countDocuments();
  // Calculate average meeting time per executive
  const averageMeetingTime = totalMeetingTime / totalExecutives;
  return averageMeetingTime;
}
app.post('/home-dashboard', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});
// Schedule the task to run every morning at 8:00 AM
function generateEmailContent(executiveAppointments) {
  let emailContent = "Your appointments for today:\n\n";

  executiveAppointments.forEach((appointment, index) => {
    const { venue, dateTime, duration, purpose } = appointment;
    const startTime = new Date(dateTime);
    const endTime = new Date(dateTime.getTime() + duration * 60000); // Convert duration from minutes to milliseconds

    emailContent += `Appointment ${index + 1}:\n`;
    emailContent += `Venue: ${venue}\n`;
    emailContent += `Date and Time: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}\n`;
    emailContent += `Purpose: ${purpose}\n\n`;
  });

  return emailContent;
}
//Every morning user will get notification through mail
cron.schedule('32 11 * * *', async (req,res) => {
  try {
    // Query the database for appointments scheduled for the current day
    const today = new Date();
    console.log(today);
    const appointments = await Appointment.find({ dateTime: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } });
    //console.log(appointments);
    // Retrieve email addresses of all executives
    const executives = await User.find();
    //console.log(executives);
    // Iterate through each executive's appointments and compile them into an email
    for (const executive of executives) {
      const executiveAppointments = appointments.filter(appointment => appointment.username === executive.username);
      console.log(executive.username);
      console.log(executiveAppointments);
      if(executiveAppointments.length!==0) {console.log(executiveAppointments[0].username)};
      const emailContent = generateEmailContent(executiveAppointments); // Implement this function to generate email content
      console.log(emailContent);
      // Send email to the executive
      if(executiveAppointments.length!==0&&executiveAppointments[0].username===executive.username){
        await transporter.sendMail({
          from: 'aammn52340@gmail.com',
          to: 'aman13nagar@gmail.com',
          subject: 'Your Appointments for Today',
          text: emailContent
        });
        console.log(`Email sent to ${executive.username}`);
      }
    }
  } catch (error) {
    console.error('Error sending daily appointment emails:', error);
  }
// }, {
//   scheduled: true,
//   timezone: 'America/New_York' // Set your timezone here
    console.log("Scheduled task running at 2:10pm");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
