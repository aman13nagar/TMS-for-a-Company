const mongoose=require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: String,
    start: Date,
    end: Date,
    attendees: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    link: String 
});
const Meeting = mongoose.model('Meeting', meetingSchema);
module.exports=Meeting;