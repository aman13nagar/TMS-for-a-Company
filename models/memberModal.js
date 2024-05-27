const mongoose=require('mongoose');
const MemberSchema=new mongoose.Schema({
    group_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Group'
    },
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
},{timestamps:true}
);
let Member=mongoose.model("Member",MemberSchema);
module.exports=Member;
