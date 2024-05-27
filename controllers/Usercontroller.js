
const { default: mongoose } = require('mongoose');
const Group=require('../models/GroupModal');
const Member=require('../models/memberModal');
const GroupChats=require('../models/groupChatModal');
const User=require('../models/UserModal');
const bodyParser = require('body-parser');
const loadGroups=async(req,res)=>{
    try{
        const groups= await Group.find({creator_id:req.session.user._id});
        res.render('teamchannels',{groups:groups});
    }
    catch(error){
        console.log(error);
    }
}
const createGroup=async(req,res)=>{
    console.log(req.session.user);
    try{
        const group=new Group({
            creator_id:req.session.user._id,
            name:req.body.name,
            image:'images/', //+req.file.filename,
            limit:req.body.limit
        })
        await group.save();
        const groups=await Group.find({creator_id:req.session.user._id});
        res.render('teamchannels',{message:req.body.name+'Group created Successfully!',groups});
    }
    catch(error){
        console.log(error.message);
    }
}
const addMembers=async(req,res)=>{
    try{
        if(!req.body.members){
            res.status(200).send({success:false,msg:'Please select atleast one member'});
        }
        else if(req.body.members.length>parseInt(req.body.limit)){
            res.status(200).send({success:false,msg:'You can not select more than '+req.body.limit+' Members'});
        }
        else{
            Member.deleteMany({group_id:req.body.group_id});
            var data=[];
            const members=req.body.members;
            for(let i=0;i<members.length;i++){
                data.push({
                    group_id:req.body.group_id,
                    user_id:members[i]
                })
            }
            await Member.insertMany(data);
            res.status(200).send({success:true,msg:'Member added successfully'});
        }
        // res.status(200).send({success:true,data:users});
    }catch(error){
        res.status(200).send({success:false,msg:error.message});
    }
}
const updateChatGroup=async(req,res)=>{
    try{
        console.log(req.body)
        if(parseInt(req.body.limit)<parseInt(req.body.last_limit)){
            await Member.deleteMany({group_id:req.body.xid});
        }
        var updateobj;
        if(req.file!=undefined){
            updateobj={
                name:req.body.name,
                image:'images/',
                limit:req.body.limit
            }
        }else{
            updateobj={
                name:req.body.name,
                limit:req.body.limit
            }
        }
        await Group.findByIdAndUpdate({_id:req.body.xid},{
            $set:updateobj
        })
        res.status(200).send({success:true,msg:'Chat group updated successfully'});
    }catch(error){
        res.status(200).send({success:false,msg:error.message});
    }
}
const GroupChat=async(req,res)=>{
    try {
        const myGroups = await Group.find({ creator_id: req.session.user._id });
        const joinedGroups = await Member.find({ user_id: req.session.user._id }).populate('group_id');
        const user=await User.findOne({_id:req.session.user._id});
        console.log(myGroups,joinedGroups);
        res.render('chat-group', { myGroups: myGroups, joinedGroups: joinedGroups ,user:user});
      } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const SaveGroupChat=async(req,res)=>{
    try{
        var groupchat=new GroupChats({
            sender_id:req.body.sender_id,
            group_id:req.body.group_id,
            message:req.body.message,
            url:req.body.url
        })
        var newChat=await groupchat.save();
        var Chat=await GroupChats.findOne({_id:newChat._id}).populate('sender_id');
        res.send({success:true,chat:Chat});
    }catch(error){
        res.send({success:false,msg:error.message});
    }
}
const loadGroupChats=async(req,res)=>{
    try{
        var groupchats=await GroupChats.find({group_id:req.body.group_id}).populate('sender_id');
        res.send({success:true,chats:groupchats});
    }catch(error){
        res.send({success:false,msg:error.message});
    }
}
const DeleteGroupChat=async(req,res)=>{
    try{
        await GroupChats.deleteOne({_id:req.body.id});
        res.send({success:true,msg:'Chat Deleted'});
    }catch(error){
        res.send({success:false,msg:error.message});
    }
}
const UpdateGroupChat=async(req,res)=>{
    try{
        await GroupChats.findByIdAndUpdate({_id:req.body.id},{
            $set:{
                message:req.body.message
            }
        })
        res.send({success:true,msg:'Chat updated'});
    } catch(error){
        res.send({success:false,msg:error.message});
    }
}
const LoadSettings=async(req,res)=>{
    const cuser=req.session.user;
    res.render('settings',{cuser:cuser});
}
const UpdateProfile=async(req,res)=>{
    const user=req.session.user;
    await User.findByIdAndUpdate({_id:user._id},{
        $set:{
            username:req.body.username,
            email:req.body.mail
        }
    });
    const updateduser=await User.findById({_id:user._id});
    console.log(updateduser);
    res.redirect('/home-guestlogin');
}
module.exports={loadGroups,
                createGroup,
                addMembers,
                updateChatGroup,
                GroupChat,
                SaveGroupChat,
                loadGroupChats,
                DeleteGroupChat,
                UpdateGroupChat,
                LoadSettings,
                UpdateProfile
                }