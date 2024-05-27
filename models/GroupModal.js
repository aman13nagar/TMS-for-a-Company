const  mongoose  = require("mongoose");
const  Schema  =  mongoose.Schema;
const  groupSchema  =  new Schema(
    {
    creator_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    name:{
        type:String,
        
    },
    image: {
        type: String,
        
    },
    limit:{
        type:Number,
        
    }
},
{
    timestamps: true
});

let  Group =  mongoose.model("Group", groupSchema);
module.exports  = Group;