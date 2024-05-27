const mongoose=require('mongoose');

const feedbackSchema=new mongoose.Schema({
    name:String,
    email:String,
    rating:{type:String,enum:['5','4','3','2','1'],default:'1'},
    comments:String
})
const Feedback=mongoose.model('Feedback',feedbackSchema);
module.exports=Feedback;