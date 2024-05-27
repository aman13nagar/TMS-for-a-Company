require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const bcrypt = require('bcrypt');
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const flash = require('express-flash');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
app.use(cookieParser());
const http = require('http');
const socketIo = require("socket.io");
const messageController = require('./controllers/messageController');
const Usercontroller = require('./controllers/Usercontroller');
const MongoStore = require('connect-mongo');
const managerController = require('./controllers/managerController');
const isAuthenticated = require('./middlewares/authmiddleware');
const { pipeline } = require('stream');
const server = http.createServer(app);
const io = socketIo(server);
var usp = io.of('/user-namespace');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb+srv://aman13nagar:MvuudGm2Z0LsjwIY@cluster0.e3nardl.mongodb.net/TMS' }),
  cookie: { secure: false, maxAge: 12 * 60 * 60 * 1000 }
}))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://aman13nagar:MvuudGm2Z0LsjwIY@cluster0.e3nardl.mongodb.net/TMS", { useNewUrlParser: true });
const messageSchema = new mongoose.Schema({
  username: String,
  email: String,
  message: String
})
const User = require('./models/UserModal');
const Projects = [['Time Management Software (TMS) for a company', 1], ['Hotel Automation Software', 2], ['Road Repair and Tracking System (RRTS)', 3],
['Judiciary Information System (JIS)', 4], ['Library Information System (LIS)', 5], ['Restaurant Automation System (RAS)', 6],
['Transport company computerization (TCC) software', 7], ['simulation software', 8], ['Software component cataloguing software', 9],
['Supermarket automation software (SAS)', 10], ['Book-shop Automation Software (BAS)', 11], ['structured software analysis and design', 12],
['Newspaper Agency Automation Software', 13], ['University Department Information System', 14], ['Motor Part Shop Software (MPSS)', 15],
['Students’ Auditorium Management Software', 16], ['Medicine Shop Automation (MSA)', 17]]
const Message = mongoose.model("Message", messageSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  })
});
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/", function (req, res) {
  if (req.session.user) req.session.destroy();
  res.render("home");
})
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
)
app.get("/auth/google/home-dashboard",
  passport.authenticate('google', { failureRedirect: "/home-guest" }),
  function (req, res) {
    res.redirect('/home-dashboard');
  }
)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.USER, pass: process.env.APP_PASSWORD },
});
app.post("/home", async (req, res) => {
  const { name, email, message } = req.body;
  const mess = new Message({
    username: name,
    email: email,
    message: message
  })
  console.log(email);
  await mess.save();
  const mailOptions = {
    from: email,
    to: 'aammn52340@gmail.com',
    subject: 'Contact purpose',
    text: `${message}`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending verification email:', error);
    } else {
      console.log('Verification email sent:', info.response);
    }
  });
})
app.get("/home-guest", function (req, res) {
  if (req.session.user) req.session.destroy();
  res.render("home-guest");
})
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit code
}
app.post("/home-guest", async (req, res, next) => {
  try {
    const { username, mail: email, mobile, password, role } = req.body;
    const emailExists = await User.exists({ email });
    const mobileExists = await User.exists({ phone_no: mobile });
    if (emailExists || mobileExists) {
      //req.flash('error', 'Email or mobile number already exists.');
      return res.render("home-guest", { messages: { error: 'Email or mobile number already exists' } });
    }
    const code = generateCode();
    await sendVerificationEmail(email, code);
    const newUser = new User({
      username,
      email,
      phone_no: mobile,
      role,
      emailVerificationToken: code
    });
    User.register(newUser, password, (err, user) => {
      if (err) {
        console.error('Error registering user:', err);
        //req.flash('error', 'An error occurred during registration.');
        return res.redirect("/home-guest");
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.render("verify-cred", { email });
      });
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.redirect("/home-guest");
  }
});
function sendVerificationEmail(email, verificationCode) {
  const mailOptions = {
    from: 'aammn52340@gmail.com',
    to: email,
    subject: 'Email Verification',
    text: `Enter this code to verify your email: ${verificationCode}`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending verification email:', error);
    } else {
      console.log('Verification email sent:', info.response);
    }
  });
}
const Task = require('./models/TaskModal');
app.post('/verify-cred', async (req, res) => {
  const code = req.body.code;
  const cuser = await User.findOne({ emailVerificationToken: code });
  console.log(cuser);
  var users = await User.find();
  if (cuser) {
    let totalTasks;
    let totalMeetings = await Meeting.find({ createdBy: cuser._id }).count();
    if (cuser.role == 'manager') {
      totalTasks = await Task.find({ createdBy: cuser._id }).count();
    }
    else {
      totalTasks = await Task.find({ assignedTo: cuser._id }).count();
    }
    console.log(code, cuser.email);
    return res.render('home-guestlogin', {
      cuser: cuser, email: cuser.email, username: cuser.username
      , users: users, totalTasks: 0, completetasks: 0, pendingtasks:
        0, overduetasks: 0, totalMeetings: totalMeetings,
      messages: { success: 'Verification successful' }
    });
  } else {
    console.log(req.session.user);
    await User.deleteOne({ email: req.body.email });
    return res.render('verify-cred', {
      cuser: null, email: null, username: null, users: null,
      totalTasks: 0, completetasks: 0, pendingtasks: 0, overduetasks: 0, totalMeetings: 0,
      messages: { error: 'Verification failed! Register Again' }
    });
  }
});
app.delete('/delete-user', isAuthenticated, async (req, res) => {
  try {
    const email = req.body.useremail;
    await User.deleteOne({ email: email });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
const LeaveRequest = require('./models/LeaveRequest');

const vsp = io.of('/home-namespace');

vsp.on('connection', async (socket) => {
  console.log('User in Home-dashboard');
  console.log(socket.handshake.auth.token);
  var userid = socket.handshake.auth.token;
  const user = await User.findOne({ _id: userid });
  if (user) {
    let totalTasks, tasks, totalleaves;
    if (user.role === 'manager') {
      totalTasks = await Task.find({ createdBy: user._id }).countDocuments();
      tasks = await Task.find({ createdBy: user._id });
    } else {
      totalTasks = await Task.find({ assignedTo: user._id }).countDocuments();
      tasks = await Task.find({ assignedTo: user._id });
      totalleaves = await LeaveRequest.find({ createdBy: user._id }).countDocuments();
    }
    let completetasks = 0, pendingtasks = 0, overduetasks = 0;
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

    tasks.forEach(task => {
      if (task.status === 'completed') {
        completetasks++;
      } else if (task.status === 'in progress') {
        pendingtasks++;
      } else {
        overduetasks++;
      }
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

    user.totalMeetings = totalMeetings;
    user.totalTasks = totalTasks;
    user.totalLeaves = totalleaves;
    user.CompletedTasks = completetasks;
    user.PendingTasks = pendingtasks;
    user.OverdueTasks = overduetasks;
    user.dailyData = dailyData;
    user.monthlyData = monthlyData;
    user.yearlyData = yearlyData;
    vsp.emit('updatestates', user);
  }
  socket.on('disconnect', async function () {
    console.log('user Disconnected');
  });
});

app.post("/home-guestlogin", [
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are validation errors, redirect back to login with error messages
   // req.flash('error', errors.array().map(err => err.msg).join(' '));
    return res.render('home-guestlogin',{messages:{error:'error'}});
  }

  console.log(req.body.email);
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.log(err);
      return next(err);
    }
    console.log(user);
    if (!user) {
     // req.flash('error', 'Email or password is incorrect!');
      return res.render('home-guestlogin',{messages:{error:'Email or password is incorrect!'}});
    }
    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }

      const cuser = await User.findOne({ email: req.body.email });
      if (!cuser) {
        //req.flash('error', 'User not found!');
        return res.render('home-guestlogin',{messages:{error:'User not found!'}});
      }

      req.session.user = user; // Store the authenticated user in the session

      let totalTasks, tasks, totalleaves;
      if (cuser.role === 'manager') {
        totalTasks = await Task.find({ createdBy: cuser._id }).countDocuments();
        tasks = await Task.find({ createdBy: cuser._id });
      } else {
        totalTasks = await Task.find({ assignedTo: cuser._id }).countDocuments();
        tasks = await Task.find({ assignedTo: cuser._id });
        totalleaves = await LeaveRequest.find({ createdBy: cuser._id }).countDocuments();
      }
      let completetasks = 0, pendingtasks = 0, overduetasks = 0;
      let totalMeetings = await Meeting.find({
        $or: [
          { createdBy: cuser._id },
          { attendees: cuser.email }
        ]
      }).countDocuments();
      let meetings = await Meeting.find({
        $or: [
          { createdBy: cuser._id },
          { attendees: cuser.email }
        ]
      });

      tasks.forEach(task => {
        if (task.status === 'completed') {
          completetasks++;
        } else if (task.status === 'in progress') {
          pendingtasks++;
        } else {
          overduetasks++;
        }
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
      cuser.totalMeetings = totalMeetings;
      cuser.totalTasks = totalTasks;
      cuser.totalLeaves = totalleaves;
      cuser.CompletedTasks = completetasks;
      cuser.PendingTasks = pendingtasks;
      cuser.OverdueTasks = overduetasks;
      cuser.dailyData = dailyData;
      cuser.monthlyData = monthlyData;
      cuser.yearlyData = yearlyData;
      await cuser.save();
      console.log(req.session.user);
      req.session.user = cuser;
      res.cookie('user', JSON.stringify(cuser));

      return res.render('home-dashboard', {
        username: cuser.username,
        cuser,
        users: await User.find(),
      });
    });
  })(req, res, next);
});
app.get("/home-dashboard", isAuthenticated, async (req, res) => {
  var users = await User.find();
  const user= req.session.user;
  var cuser=await User.findById({_id:user._id});
  let totalTasks, tasks, totalleaves;
  if (cuser.role == 'manager') {
    totalTasks = await Task.find({ createdBy: cuser._id }).countDocuments();
    tasks = await Task.find({ createdBy: cuser._id });
  }
  else {
    totalTasks = await Task.find({ assignedTo: cuser._id }).countDocuments();
    tasks = await Task.find({ assignedTo: cuser._id });
    totalleaves = await LeaveRequest.find({ createdBy: cuser._id }).countDocuments();
  }
  let totalMeetings = await Meeting.find({
    $or: [
      { createdBy: cuser._id },
      { attendees: cuser.email }
    ]
  }).countDocuments();
  let meetings = await Meeting.find({
    $or: [
      { createdBy: cuser._id },
      { attendees: cuser.email }
    ]
  });
  let completetasks = 0, pendingtasks = 0, overduetasks = 0;
  tasks.forEach(task => {
    if (task.status == 'completed') {
      completetasks++;
    }
    else if (task.status == 'in progress') {
      pendingtasks++;
    }
    else {
      overduetasks++;
    }
  })
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
  cuser.totalMeetings = totalMeetings;
  cuser.totalTasks = totalTasks;
  cuser.totalLeaves = totalleaves;
  cuser.CompletedTasks = completetasks;
  cuser.PendingTasks = pendingtasks;
  cuser.OverdueTasks = overduetasks;
  cuser.dailyData = dailyData;
  cuser.monthlyData = monthlyData;
  cuser.yearlyData = yearlyData;
  await cuser.save();
  req.session.user = cuser;
  res.render("home-dashboard", {
    cuser:req.session.user, users
  });
})
app.get("/home-guestlogin", function (req, res) {
  try {
    console.log(req.session.user);
    if (req.session.user) req.session.destroy();
    res.render("home-guestlogin");
  } catch (error) {
    res.redirect('/');
  }
})
app.get("/forgot-password", function (req, res) {
  res.render("forgot-password");
})
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log(email);
  const user = await User.findOne({ email: email });
  console.log(user);
  if (!user) {
    return res.status(404).send('User not found');
  }
  // Generate a unique token
  const token = crypto.randomBytes(20).toString('hex');
  // Store the token in memory (replace with database in production)
  user.resetToken = token;
  console.log(user);
  await user.save();
  const mailOptions = {
    from: 'aammn52340@gmail.com',
    to: email,
    subject: 'Password Reset Request',
    text: `To reset your password, click the following link: http://time-management-system-for-a-company.onrender.com/reset_password?token=${token}`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      //req.flash('error', 'An Error occured please try later !');
      return res.render('forgot-password',{messages:{error:'An Error occured please try later!'}});
    }
    console.log('Email sent: ' + info.response);
    //res.send('Password reset email sent');
    //req.flash('success', 'Password reset email sent. Please check your email !!');
    return res.render('forgot-password',{messages:{success:'Password reset email sent. Please check your email !!'}});
  });
});
app.get("/reset_password", function (req, res) {
  const { token } = req.query;
  res.render("reset_password", { token });
})
app.post('/reset_password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  const user = await User.findOne({ resetToken: token });
  if (!user) {
    //req.flash('error', 'An error occured please try again !');
    return res.render('reset_password',{messages:{error:'An error occured please try again!'}})
  }
  user.setPassword(newPassword, function (err) {
    if (err) {
      console.error("Error updating password:", err);
      return res.status(500).send("Error updating password");
    }
    user.save(function (err) {
      if (err) {
        console.error("Error saving user after password update:", err);
        return res.status(500).send("Error updating password");
      }
      //req.flash('success', 'Password updated successsfully');
      return res.render('reset_password',{token:token,messages:{success:'Password updated successfully'}});
    });
  });
});
app.get("/find_slots", isAuthenticated, function (req, res) {
  res.render("find_slots");
})
app.post('/find_slots', isAuthenticated, async (req, res) => {
  try {
    const { time, duration } = req.body;
    let startTime = new Date(time);
    let endTime = new Date(startTime.getTime() + duration * 60000);
    let find = await Meeting.find({ start: startTime });
    console.log(find);
    var Boolean = false;
    let t = time;
    for (let k = new Date(startTime); k <= endTime; k.setMinutes(k.getMinutes() + 1)) {
      console.log(k);
      find = await Meeting.find({ start: k });
      if (find.length != 0) {
        Boolean = true;
        t = k;
        break;
      }
    }
    console.log(Boolean);
    if (Boolean == true) {
      console.log("Slot is not Available");
      req.flash('error', 'Slot is not available');
      res.redirect('/find_slots');
    }
    else {
      console.log("Slot is Available");
      req.flash('success', 'Slot is Available. You can schedule your Meeting');
      res.redirect('/find_slots');
    }
  } catch (error) {
    console.log("Error", error);
  }
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
const upload = multer({ storage: storage });
app.get('/upload-profile-picture', isAuthenticated, async (req, res) => {
  res.render('upload-profile-picture');
})
app.post('/upload-profile-picture', isAuthenticated, upload.single('profilePicture'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const profilePictureUrl = req.file.path;
  console.log(profilePictureUrl)
  try {
    await User.findByIdAndUpdate({ _id: req.session.user._id }, {
      $set: {
        profilePictureUrl: profilePictureUrl
      }
    })
    const updateduser = await User.findById({ _id: req.session.user._id });
    req.session.user = updateduser;
    res.status(200).json({ message: 'Profile picture uploaded successfully', profilePictureUrl });
  } catch (error) {
    console.error('Error saving profile picture to database:', error);
  }
});
app.get("/profile", isAuthenticated, async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect('/')
  }
  res.render('profile', { user: user });
})
const { getTaskTimeStats } = require('./utils/getTaskTimestates');
const { getLeaveTimeStats } = require('./utils/getLeaveTimestates');
app.get('/statistics', isAuthenticated, async (req, res) => {
  try {
    const taskTimeStats = await getTaskTimeStats();
    const leaveTimeStats = await getLeaveTimeStats();
    res.render('statistics', {
      taskTimeStats, leaveTimeStats,
    });
  } catch (error) {
    console.error('Error retrieving statistics:', error);
    res.status(500).send('An error occurred while retrieving statistics.');
  }
});

function generateEmailContent(executiveAppointments) {
  let emailContent = "Your Task for today:\n\n";
  executiveAppointments.forEach((appointment, index) => {
    const { title, description, priority, dueDate, status, calendarEvent } = appointment;
    emailContent += `Task ${index + 1}:\n`
    emailContent += `Title: ${title}\n`
    emailContent += `Description: ${description}\n`
    emailContent += `Priority: ${priority}\n`
    emailContent += `Due Date: Today\n`
    emailContent += `Status: ${status}\n`
    emailContent += `View on Calendar: ${calendarEvent.htmlLink}\n\n`
  });
  return emailContent;
}
//Every morning user will get notification through email
cron.schedule('0 8 * * *', async (req, res) => {
  try {
    const today = new Date();
    console.log(today);
    const tasks = await Task.find({ dueDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } });
    const employees = await User.find({ role: 'employee' });
    for (const employee of employees) {
      const executiveAppointments = tasks.filter(task => task.assignedTo === employee._id);
      console.log(executiveAppointments);
      const emailContent = generateEmailContent(executiveAppointments);
      console.log(emailContent);
      if (executiveAppointments.length !== 0) {
        await transporter.sendMail({
          from: 'aammn52340@gmail.com',
          to: employee.email,
          subject: 'Complete your task by Today',
          text: emailContent
        });
        console.log(`Email sent to ${employee.username}`);
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
// Socket.io
const chatSchema = new mongoose.Schema({
  sender_id: String,
  receiver_id: String,
  message: String
});
const Chat = mongoose.model('Chat', chatSchema);
app.post('/save-chat', isAuthenticated, async (req, res) => {
  try {
    var chat = new Chat({
      sender_id: req.body.sender_id,
      receiver_id: req.body.receiver_id,
      message: req.body.message
    });
    var newChat = await chat.save();
    res.status(200).send({ success: true, msg: 'chat inserted!', data: newChat });
  } catch (error) {
    console.log("false");
    res.status(200).send({ success: false, msg: error.message });
  }
})
app.post('/delete-chat', isAuthenticated, async (req, res) => {
  try {
    await Chat.deleteOne({ _id: req.body.id });
    res.status(200).send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(200).send({ success: false, msg: error.message });
  }
})
app.post('/update-chat', isAuthenticated, async (req, res) => {
  try {
    await Chat.findByIdAndUpdate({ _id: req.body.id }, {
      $set: {
        message: req.body.message
      }
    })
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ success: false, msg: error.message });

  }
})
var usp = io.of('/user-namespace');
usp.on('connection', async (socket) => {
  console.log('User connected');
  console.log(socket.handshake.auth.token);
  var userid = socket.handshake.auth.token;
  await User.findByIdAndUpdate({ _id: userid }, { $set: { is_online: '1' } });
  socket.broadcast.emit('getOnlineUser', { user_id: userid });
  socket.on('disconnect', async function () {
    console.log('user Disconnected');
    var userid = socket.handshake.auth.token;
    console.log(userid);
    await User.findByIdAndUpdate({ _id: userid }, { $set: { is_online: '0' } });
    socket.broadcast.emit('getOfflineUser', { user_id: userid });
  })
  socket.on('newChat', function (data) {
    console.log(data);
    socket.broadcast.emit('loadNewChat', data);
  })
  //old chats
  socket.on('existsChat', async function (data) {
    var chats = await Chat.find({
      $or: [
        { sender_id: data.sender_id, receiver_id: data.receiver_id },
        { sender_id: data.receiver_id, receiver_id: data.sender_id }
      ]
    });
    socket.emit('loadChats', { chats: chats });
  })
  socket.on('chatDeleted', function (id) {
    console.log(id);
    socket.broadcast.emit('chatMessageDeleted', id);
  })
  socket.on('chatUpdated', function (data) {
    console.log(data.id, data.message);
    socket.broadcast.emit('chatMessageUpdated', data);
  })
  ///group chat
  socket.on('newGroupChat', function (data) {
    socket.broadcast.emit('loadNewGroupMessage', data);
  })
  //delete chat broadcast
  socket.on('groupChatDeleted', function (id) {
    socket.broadcast.emit('DeletedGroupChat', id);
  })
  //update chat broadcast
  socket.on('groupChatUpdated', function (data) {
    socket.broadcast.emit('UpdatedGroupChat', data);
  })
})
app.get('/groups', isAuthenticated, Usercontroller.loadGroups);
app.post('/groups', isAuthenticated, Usercontroller.createGroup);
app.post('/get-members', isAuthenticated, async (req, res) => {
  try {
    var users = await User.aggregate([
      {
        $lookup: {
          from: "members",
          localField: "_id",
          foreignField: "user_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$group_id", mongoose.Types.ObjectId(req.body.group_id)] }
                  ]
                }
              }
            }
          ],
          as: "member"
        }
      },
      {
        $match: {
          "_id": {
            $nin: [mongoose.Types.ObjectId(req.session.user._id)]
          }
        }
      }
    ]);
    res.status(200).send({ success: true, data: users });
  } catch (error) {
    res.status(200).send({ success: false, msg: error.message });
  }
});
const Group = require('./models/GroupModal');
const Member = require('./models/memberModal');
app.post('/add-members', isAuthenticated, Usercontroller.addMembers);
app.post('/update-chat-group', isAuthenticated, async (req, res) => {
  try {
    console.log(req.body)
    if (parseInt(req.body.limit) < parseInt(req.body.last_limit)) {
      await Member.deleteMany({ group_id: req.body.xid });
    }
    var updateobj;
    if (req.file != undefined) {
      updateobj = {
        name: req.body.name,
        image: 'images/',
        limit: req.body.limit
      }
    } else {
      updateobj = {
        name: req.body.name,
        limit: req.body.limit
      }
    }
    await Group.findByIdAndUpdate({ _id: req.body.xid }, {
      $set: updateobj
    })
    res.status(200).send({ success: true, msg: 'Chat group updated successfully' });
  } catch (error) {
    res.status(200).send({ success: false, msg: error.message });
  }
});
app.post('/delete-chat-group', isAuthenticated, async (req, res) => {
  try {
    await Group.deleteOne({ _id: req.body.id });
    await Member.deleteMany({ group_id: req.body.id });
    res.status(200).send({ success: true, msg: 'Group deleted successfully!' });
  } catch (error) {
    res.status(200).send({ success: false, msg: error.message });
  }
})
app.get('/share-group/:id', isAuthenticated, async (req, res) => {
  try {
    var groupData = await Group.findOne({ _id: req.params.id });
    if (!groupData) {
      res.render('error', { message: '404 not found!' });
    }
    else if (req.session.user == undefined) {
      res.render('error', { message: 'You need to login to access this URL!' });
    }
    else {
      var totalMembers = await Member.find({ group_id: req.params.id }).count();
      var available = groupData.limit - totalMembers;
      var isOwner = groupData.creator_id == req.session.user._id ? true : false;
      var isJoined = await Member.find({ group_id: req.params.id, user_id: req.session.user._id }).count();
      res.render('shareLink', { group: groupData, totalMembers: totalMembers, isOwner: isOwner, isJoined: isJoined, available: available });
    }
  } catch (error) {
    console.log(error.message);
  }
})
app.post('/join-group', isAuthenticated, async (req, res) => {
  try {
    var member = Member({
      group_id: req.body.group_id,
      user_id: req.session.user._id
    });
    await member.save();
    res.send({ success: true, msg: 'Congratulation, you have joined the group successfully' });
  } catch (error) {
    res.send({ success: false, msg: error.message });
  }
})
app.get('/group-chat', isAuthenticated, Usercontroller.GroupChat);
app.post('/save-group-chat', isAuthenticated, Usercontroller.SaveGroupChat);
app.post('/load-group-chats', isAuthenticated, Usercontroller.loadGroupChats);
app.post('/delete-group-chat', isAuthenticated, Usercontroller.DeleteGroupChat);
app.post('/update-group-chat', isAuthenticated, Usercontroller.UpdateGroupChat);
const isEmployee=require('./middlewares/clientmiddleware');
const isManager=require('./middlewares/managermiddleware');
const managerRoutes = require('./routes/managerRoutes');
app.use('/manager', isAuthenticated,isEmployee, managerRoutes);
const employeeRoutes = require('./routes/employeeRoutes');
app.use('/employee', isAuthenticated,isManager, employeeRoutes);
app.get('/settings', isAuthenticated, Usercontroller.LoadSettings);
app.post('/settings', isAuthenticated, Usercontroller.UpdateProfile);
const Meeting = require('./models/MeetingModal');
app.get('/attend/:link', isAuthenticated, (req, res) => {
  Meeting.findOne({ link: req.params.link }, (err, meeting) => {
    if (err || !meeting) {
      return res.status(404).send('Meeting not found');
    }
    res.render('attend', { meeting });
  });
});
app.get('/scheduleMeeting', isAuthenticated, async (req, res) => {
  res.render('scheduleMeeting');
})
const meetingRoutes = require('./routes/meetingRoutes');
app.use('/Meeting', isAuthenticated, meetingRoutes);
const leaveRoutes = require('./routes/leaveRoutes');
const GroupChat = require('./models/groupChatModal');
app.use('/Leave', isAuthenticated,isEmployee, leaveRoutes);
app.get('/LeaveRequest', isAuthenticated,isManager, async (req, res) => {
  res.render('LeaveRequest')
})
app.get('/manager-approval', isAuthenticated,isEmployee, async (req, res) => {
  res.render('manager-approval');
})
app.get('/projects', isAuthenticated, async (req, res) => {
  res.render('projects');
})
const notificationRoutes = require('./routes/notifications');
app.use('/home-dashboard', isAuthenticated, notificationRoutes);
const Notification = require('./models/Notification');
app.get('/notifications', isAuthenticated, async (req, res) => {
  const user = req.session.user;
  const notifications = await Notification.find({ userId: user._id });
  console.log(notifications);
  const notificationsJson = JSON.stringify(notifications, (key, value) => {
    if (typeof value === 'string') {
      return value.replace(/"/g, '\\"').replace(/'/g, "\\'");
    }
    return value;
  });
  res.render('notifications', { user: user, notifications: notificationsJson });
})
app.post('/home-dashboard', isAuthenticated, function (req, res, next) {
  req.logout(function (err) {
    res.clearCookie('user');
    req.session.destroy(err => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  });
});
app.delete('/delete-account', isAuthenticated, async (req, res) => {
  try {
    const userId = req.body.userId;
    await User.findByIdAndDelete(userId);
    await Task.findByIdAndDelete(userId);
    await Chat.findByIdAndDelete(userId);
    await GroupChat.findByIdAndDelete(userId);
    await Group.findByIdAndDelete(userId);
    await Meeting.findByIdAndDelete(userId);
    req.session.destroy();
    res.clearCookie('user');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
// 404 Error Handling
app.use((req, res, next) => {
  res.status(404).render('404error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    redirectUrl: '/'
  });
});
server.listen(3000, function () {
  console.log("Server started on port 3000");
});
app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
});
