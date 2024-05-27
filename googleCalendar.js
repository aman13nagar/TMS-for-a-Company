const { google } = require('googleapis');
require('dotenv').config()
const path = require('path');
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'graceful-karma-423508-n5-572ebe8197e5.json'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});
const calendar = google.calendar({ version: 'v3', auth });
async function createCalendarEvent(task) {
  const event = {
    summary: task.title,
    description: task.description,
    start: { dateTime: task.dueDate, timeZone: 'America/New_York' },
    end: { dateTime: task.dueDate, timeZone: 'America/New_York' },
  };
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    console.log('Calendar event created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
  }
}
module.exports = { createCalendarEvent };
