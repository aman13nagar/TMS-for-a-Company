const mongoose = require('mongoose');
const realmessageSchema = new mongoose.Schema({
  username: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Realmessage', realmessageSchema);
