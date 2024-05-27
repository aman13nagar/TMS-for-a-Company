const mongoose=require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt=require('bcrypt');
const userSchema = new mongoose.Schema({
    username: String,
    email: {type:String, unique:true},
    password: String,
    phone_no: String,
    resetToken :String,
    emailVerified:String,
    emailVerificationToken:Number,
    is_online:{type:Boolean,default:'0'},
    role:{type:String,enum:['employee','manager'],default:'manager'},
    profilePictureUrl: String,
    pricing:{type:String,enum:['Basic', 'Pro' ,'Enterprise'],default:'Pro'},
    GroupPictureUrl:String,
    totalMeetings:Number,
    totalTasks:Number,
    totalLeaves:Number,
    CompletedTasks:Number,
    PendingTasks:Number,
    OverdueTasks:Number,
    dailyData:Array,
    monthlyData:Array,
    yearlyData:Array,
});
userSchema.plugin(passportLocalMongoose,{ usernameField : 'email' });
let User=mongoose.model('User',userSchema);
module.exports=User;