const mongoose=require('mongoose');

const groupChatSchema=new mongoose.Schema({
    sender_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    group_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Group'
    },
    message:{
        type:String,
        required:true
    },
    url:{
        type:String,
        ref:'User'
    }

},{timestamps:true}
)
let GroupChat=mongoose.model("GroupChat",groupChatSchema);
module.exports=GroupChat