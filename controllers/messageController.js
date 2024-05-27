const Realmessaging = require('../models/realmessage');
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Realmessaging.find().sort({ createdAt: 'asc' });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.postMessage = async (req, res) => {
  try {
    const { username, text } = req.body;
    const newMessage = new Realmessaging({ username, text });
    await newMessage.save();
    res.status(201).send('Message sent successfully');
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).send('Internal Server Error');
  }
};
