function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}
    var userData=JSON.parse(getCookie('user'));

    console.log(userData);
    var sender_id=userData._id;
    var profilePicture=userData.profilePictureUrl;
    var receiver_id;
    var global_group_id;
    console.log();
    var socket=io('/user-namespace',{
      auth:{
        token:userData._id
      }
    })
    $(document).ready(function(){
        $('.user-list').click(function(){
            var userid=$(this).attr('data-id');
            receiver_id=userid;
            $('.user-list').css('background-color', ''); // Reset previous colors
            $(this).css('background-color', '#dcdcdc');
            $('.start-head').hide();
            $('.chat-section').show();
            socket.emit('existsChat',{sender_id:sender_id,receiver_id:receiver_id});
        })
    })
    socket.on('getOnlineUser',function(data){
        $('#'+data.user_id+'-status').text('Online');
        $("#"+data.user_id+'-status').removeClass('offline-status');
        $('#'+data.user_id+'-status').addClass('online-status');
    })
    socket.on('getOfflineUser',function(data){
        $('#'+data.user_id+'-status').text('Offline');
        $("#"+data.user_id+'-status').removeClass('online-status');
        $('#'+data.user_id+'-status').addClass('offline-status');
    })
    $('#chat-form').submit(function(event){
        event.preventDefault();
        var message=$('#message').val();
        $.ajax({
            url:'/save-chat',
            type:'POST',
            data:{sender_id:sender_id,receiver_id:receiver_id,message:message},
            success:function(response){
                if(response.success){
                    $('#message').val('');
                    let chat=response.data.message;
                    let html=`
                    <div class="current-user-chat" id='`+response.data._id+`'>
                        <h5><span><p>`+chat+`</p></span>
                          <i class="fa fa-trash DeleteChats" aria-hidden="true" data-id='`+response.data._id+`' data-toggle="modal" data-target="#deleteChatModal" style="font-size:x-small;margin-left:5px;margin-top:10px;cursor:pointer"></i>
                          <i class="fa fa-edit" aria-hidden="true" data-id='`+response.data._id+`' data-toggle="modal" data-msg='`+chat+`' data-target="#editChatModal" style="font-size:x-small;margin-left:5px;margin-top:10px;cursor:pointer"></i>
                        </h5>
                    </div>`;
                    $('#chat-container').append(html);
                    socket.emit('newChat',response.data);
                    scrollChat();
                }
            }
        })
    })
    socket.on('loadNewChat',function(data){
        if(sender_id==data.receiver_id&&receiver_id==data.sender_id){
            let html=`
            <div class="distance-user-chat" id='`+data._id+`'>
               <h5><span>`+data.message+`</span></h5>
            </div>`;
            $('#chat-container').append(html);
        }
        scrollChat();
    })
    //load old chats
    socket.on('loadChats',function(data){
      $('#chat-container').html('');
      var chats=data.chats;
      let html='';
      for(let x=0;x<chats.length;x++){
        let addClass='';
        if(chats[x]['sender_id']==sender_id){
          addClass='current-user-chat';
        }
        else{
          addClass='distance-user-chat';
        }
        html+=`
        <div class='`+addClass+`' id='`+chats[x]['_id']+`'>
          <h5><span><p>`+chats[x]['message']+`</p></span>`;
            if(chats[x]['sender_id']==sender_id){
              html+=`<i class="fa fa-trash DeleteChats" aria-hidden="true" data-id='`+chats[x]['_id']+`' data-toggle="modal" data-target="#deleteChatModal" style="font-size:x-small;margin-left:5px;margin-top:10px;cursor:pointer"></i>
              <i class="fa fa-edit" aria-hidden="true" data-id='`+chats[x]['_id']+`' data-toggle="modal" data-msg='`+chats[x]['message']+`' data-target="#editChatModal" style="font-size:x-small;margin-left:5px;margin-top:10px;cursor:pointer"></i>
              `;
            }
            html+=`</h5>
        </div>`;
      }
      $('#chat-container').append(html);
      scrollChat();
    })
    function scrollChat(){
      $('#chat-container').animate({
        scrollTop:$('#chat-container').offset().top+$('#chat-container')[0].scrollHeight
      },0);
    }
    //delete chat
    $(document).on('click','.DeleteChats',function(){
      let msg=$(this).parent().text();
      console.log(msg);
      $('#delete-message').text(msg);
      $('#delete-message-id').val($(this).attr('data-id'));
      var id=$('#delete-message-id').val();
      console.log(id);
    })
    $('#delete-chat-form').submit(function(event){
      event.preventDefault();
      var id=$('#delete-message-id').val();
      console.log(id);
      $.ajax({
        url:'/delete-chat',
        type:'POST',
        data:{id:id},
        success:function(res){
          if(res.success==true){
            $('#'+id).remove();
            $('#deleteChatModal').modal('hide');
            socket.emit('chatDeleted',id);
          }
          else{
            alert(res.msg);
          }
        }
      })
    })
    socket.on('chatMessageDeleted',function(id){
      $('#'+id).remove();
    })
    //update chat
    $(document).on('click','.fa-edit',function(){
      $('#edit-message-id').val($(this).attr('data-id'));
      $('#update-message').val($(this).attr('data-msg'));
    })
    $('#update-chat-form').submit(function(event){
      event.preventDefault();
      var id=$('#edit-message-id').val();
      var msg=$('#update-message').val();
      console.log(id);
      $.ajax({
        url:'/update-chat',
        type:'POST',
        data:{id:id,message:msg},
        success:function(res){
          if(res.success==true){
            $('#editChatModal').modal('hide');
            $('#'+id).find('span').text(msg);
            $('#'+id).find('.fa-edit').attr('data-msg',msg);
            socket.emit('chatUpdated',{id:id,message:msg});
          }
          else{
            alert(res.msg);
          }
        }
      })
    })
    socket.on('chatMessageUpdated',function(data){
      $('#'+data.id).find('span').text(data.message);
    })
    //add members
    $('.addMember').click(function(){
        var id=$(this).attr('data-id');
        var limit=$(this).attr('data-limit');

        $('#group_id').val(id);
        $('#limit').val(limit);
        $.ajax({
            url:'/get-members',
            type:'POST',
            data:{group_id:id},
            success:function(res){
                if(res.success==true){
                    let users=res.data;
                    let html='';
                    for(let i=0;i<users.length;i++){
                        let isMember=users[i]['member'].length>0?true:false;
                        html+=`
                            <tr>
                              <td>
                                 <input type="checkbox" `+(isMember?'checked':'')+` name="members[]" value="`+users[i]['_id']+`">
                              </td>
                              <td>`+users[i]['username']+`</td>
                            <tr>
                        `
                    }
                    $('.addMemberInTable').html(html);
                }else{
                    alert(res.msg);
                }
            }
        })
    })
    //add member form
    $('#add-member-form').submit(function(event){
        event.preventDefault();
        var formData=$(this).serialize();
        $.ajax({
            url:'/add-members',
            type:'POST',
            data:formData,
            success:function(res){
                if(res.success){
                    $('#memberModal').modal('hide');
                    $('#add-member-form')[0].reset();
                    alert(res.msg);
                }
                else{
                   $('#add-member-error').text(res.msg);
                   setTimeout(()=>{
                    $('#add-member-error').text('');
                   },3000);
                }
            }
        })
    });
    //update Group
    $('.updateMember').click(function(){
        var obj=JSON.parse($(this).attr('data-obj'));
        console.log(obj);
        $('#update_group_id').val(obj._id);
        $('#last_limit').val(obj.limit);
        $('#group_name').val(obj.name);
        $('#group_limit').val(obj.limit);
    });
    $('#updatechatgroupform').submit(function(event){
        event.preventDefault();
        var formData=$(this).serialize();
        console.log(formData,new FormData(this));
        $.ajax({
            url:'/update-chat-group',
            type:'POST',
            data:formData,
            
            success:function(res){
                console.log(res);
                alert(res.msg);
                if(res.success){
                    location.reload();
                }
            }
        })
    })
    //Delete Group
    $('.deleteGroup').click(function(){
        $('#delete_group_id').val($(this).attr('data-id'));
        $('#delete_group_name').text($(this).attr('data-name'));
    })
    $('#deletechatgroupform').submit(function(e){
        e.preventDefault();
        var formData=$(this).serialize();
        $.ajax({
            url:'/delete-chat-group',
            type:'POST',
            data:formData,
            success:function(res){
                alert(res.msg);
                if(res.success){
                    location.reload();
                }
            }
        })
    })
    //sharable link
    $('.copy').click(function(){
        $(this).prepend('<span class="copied_text">Copied</span>');
        var group_id=$(this).attr('data-id');
        var url=window.location.host+'/share-group/'+group_id;
        var temp=$("<input>");
        $("body").append(temp);
        temp.val(url).select();
        document.execCommand("copy");
        temp.remove();
        setTimeout(()=>{
            $('.copied_text').remove();
        },2000)
    })
    //join group via sharable line
    $('.join-now').click(function(){
        $(this).text('Wait...');
        $(this).attr('disabled','disabled');
        var group_id=$(this).attr('data-id');
        $.ajax({
            url:'/join-group',
            type:'POST',
            data:{group_id:group_id},
            success:function(res){
                alert(res.msg);
                if(res.success){
                    location.reload();
                }
                else{
                    $(this).text('Join Now');
                    $(this).removeAttr('disabled');
                }
            }
        })
    })
///Group chatting
$(document).ready(function(){
    $('.group-list').click(function(){
        $('.group-start-head').hide();
        $('.group-chat-section').show();
        global_group_id=$(this).attr('data-id');
        loadGroupChats();
    })
});
function scrollChat1(){
    $('#group-chat-container').animate({
      scrollTop:$('#group-chat-container').offset().top+$('#group-chat-container')[0].scrollHeight
    },0);
  }
$('#group-chat-form').submit(function(event){
    event.preventDefault();
    var message=$('#group-message').val();
    console.log(message);
    $.ajax({
        url:'/save-group-chat',
        type:'POST',
        data:{sender_id:sender_id,group_id:global_group_id,message:message,url:profilePicture},
        success:function(response){
            if(response.success){
                $('#group-message').val('');
                let message=response.chat.message;
                let html=`
                <div class="current-user-chat" id='`+response.chat._id+`'>
                    <h5><span><p>`+message+`</p></span>
                    <i class="fa fa-trash deleteGroupChats" aria-hidden="true" data-id='`+response.chat._id+`' data-toggle="modal" data-target="#deleteGroupChatModal" style="font-size:x-small;margin-left:5px;margin-top:10px;cursor:pointer"></i>
                    <i class="fa fa-edit updateGroupChats" aria-hidden="true" data-id='`+response.chat._id+`' data-toggle="modal" data-msg='`+message+`' data-target="#updateGroupChatModal" style="font-size:x-small;margin-left:5px;margin-top:10px;cursor:pointer"></i>
                    </h5>`;
                    var date=new Date(response.chat.createdAt);
                    let cdate=date.getDate();
                    let cmonth=(date.getMonth()+1)>9?(date.getMonth()+1):'0'+(date.getMonth()+1);
                    let cyear=date.getFullYear();
                    let getFullDate=cdate+'-'+cmonth+'-'+cyear;
                    html+=`
                    <div class="user-data">
                        <b>Me </b>`+getFullDate+`
                    </div>
                </div>`;
                $('#group-chat-container').append(html);
                console.log(response.chat);
                socket.emit('newGroupChat',response.chat);
                scrollChat1();
            }
            else{
                alert(response.msg);
            }
        }
    })
})
socket.on('loadNewGroupMessage',function(data){
    console.log(global_group_id+'jfkdsjfjdsfjdskljflsdjf');
    if(global_group_id==data.group_id){
        let html=`
        <div class="distance-user-chat" id='`+data._id+`'>
            <h5><span><p>`+data.message+`</p></span>
            </h5>`
            var date=new Date(data.createdAt);
            let cdate=date.getDate();
            let cmonth=(date.getMonth()+1)>9?(date.getMonth()+1):'0'+(date.getMonth()+1);
            let cyear=date.getFullYear();
            let getFullDate=cdate+'-'+cmonth+'-'+cyear;
            if(data.url==undefined){
                html+=`
                <div class="user-data">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" fill="currentColor" class="bi bi-person-circle " viewBox="0 0 30 16" style="margin-right:-15px">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                </svg>
                <div class="user-info">
                    <b>`+data.sender_id.username+`</b>`+getFullDate+`
                </div>
            </div>
                `
            }
            else{
                html+=`
                <div class="user-data">
                <img src="`+data.url+`" style="height:20px;width:20px;border-radius:20px;margin-right:-5px">
                <div class="user-info">
                    <b>`+data.sender_id.username+`</b>`+getFullDate+`
                </div>
            </div>`
            }
        html+=`</div>`;
        $('#group-chat-container').append(html);
        scrollChat1();
    }
})
function loadGroupChats(){
    $.ajax({
        url:'/load-group-chats',
        type:'POST',
        data:{group_id:global_group_id},
        success:function(res){
            if(res.success){
                var chats=res.chats;
                var html='';
                for(let i=0;i<chats.length;i++){
                    let className='distance-user-chat';
                    if(chats[i]['sender_id']._id==sender_id){
                        className='current-user-chat';
                    }
                    html+=`
                    <div class="`+className+`" id='`+chats[i]['_id']+`'>
                        <h5>
                            <span><p>`+chats[i]['message']+`</span></p>`;
                            if(chats[i]['sender_id']._id==sender_id){
                                html+=`<i class="fa fa-trash deleteGroupChats" aria-hidden="true" data-id='`+chats[i]['_id']+`' data-toggle="modal" data-target="#deleteGroupChatModal" style="font-size:x-small;margin-left:5px;margin-top:10px;cursor:pointer"></i>
                                <i class="fa fa-edit updateGroupChats" aria-hidden="true" data-id='`+chats[i]['_id']+`' data-toggle="modal" data-msg='`+chats[i]['message']+`' data-target="#updateGroupChatModal" style="font-size:x-small;margin-left:5px;margin-top:10px;cursor:pointer"></i>`
                            }
                        html+=`
                        </h5>`;
                        var date=new Date(chats[i]['createdAt']);
                        let cdate=date.getDate();
                        let cmonth=(date.getMonth()+1)>9?(date.getMonth()+1):'0'+(date.getMonth()+1);
                        let cyear=date.getFullYear();
                        let getFullDate=cdate+'-'+cmonth+'-'+cyear;
                        if(chats[i]['sender_id']._id==sender_id){
                            html+=`
                               <div class="user-data">
                                   <b>Me </b>`+getFullDate+`
                               </div>
                            `;
                        }else{
                            if(profilePicture==undefined){
                                html+=`
                                <div class="user-data">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20" fill="currentColor" class="bi bi-person-circle " viewBox="0 0 30 16" style="margin-right:-15px">
                                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                                    <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                                </svg>
                                <div class="user-info">
                                    <b>`+chats[i]['sender_id'].username+`</b>`+getFullDate+`
                                </div>
                            </div>
                                `
                            }
                            else{
                                html+=`
                                <div class="user-data">
                                <img src="`+chats[i]['url']+`" style="height:20px;width:20px;border-radius:20px;margin-right:-5px">
                                <div class="user-info">
                                    <b>`+chats[i]['sender_id'].username+`</b>`+getFullDate+`
                                </div>
                            </div>`
                            }
                        }
                        html+=`  
                    </div>`;
                }
                $('#group-chat-container').html(html);
            }else{
                alert(res.msg);
            }
        }
    })
}
$(document).on('click','.deleteGroupChats',function(){
    // $('#deleteGroupChatModal').modal('show');
    var msg=$(this).parent().find('p').text();
    console.log(msg);
    $('#delete-group-message').text(msg);
    $('#delete-group-message-id').val($(this).attr('data-id'));
})
$('#delete-group-chat-form').submit(function(event){
    event.preventDefault();
    var id=$('#delete-group-message-id').val();
    $.ajax({
        url:'/delete-group-chat',
        type:'POST',
        data:{id:id},
        success:function(res){
            if(res.success){
                $('#deleteGroupChatModal').modal('hide');
                $('#'+id).remove();
                socket.emit('groupChatDeleted',id);
            }
            else{
                alert(res.msg);
            }
        }
    })
})
socket.on('DeletedGroupChat',function(id){
    $('#'+id).remove();
})
//update group chat
$(document).on('click','.updateGroupChats',function(){
    $('#updateGroupChatModal').modal('show');
    
    $('#update-group-message').val($(this).attr('data-msg'));
    $('#update-group-message-id').val($(this).attr('data-id'));
})
$('#update-group-chat-form').submit(function(event){
    event.preventDefault();
    var id=$('#update-group-message-id').val();
    var msg=$('#update-group-message').val();
    $.ajax({
        url:'/update-group-chat',
        type:'POST',
        data:{id:id,message:msg},
        success:function(res){
            if(res.success){
                $('#updateGroupChatModal').modal('hide');
                $('#'+id).find('span').text(msg);
                $('#'+id).find('.updateGroupChat').attr('data-msg',msg);
                socket.emit('groupChatUpdated',{id:id,message:msg});
            }
            else{
                alert(res.msg);
            }
        }
    })
})
socket.on('UpdatedGroupChat',function(data){
    $('#'+data.id).find('span').text(data.msg);
})


