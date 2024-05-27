const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.USER, pass: process.env.APP_PASSWORD },
});
async function sendEmail(to, subject,task,client,user) {
    const text = `
      Task Title: ${task.title}
      Description: ${task.description}
      Due Date: ${task.dueDate}
      Assigned To: ${user.username}
      Created By: ${client}
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

module.exports = { sendEmail };
