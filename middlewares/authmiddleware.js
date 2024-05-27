const User=require('../models/UserModal');
module.exports = async function(req, res, next) {
    console.log(req.session.user);
    if(req.session.user==undefined){
        return res.redirect('/');
    }
    else{
        return next()
    }
}