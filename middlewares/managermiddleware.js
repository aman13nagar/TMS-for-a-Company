module.exports = async function(req, res, next) {
    console.log(req.session.user);
    if(req.session.user==undefined){
        return res.redirect('/');
    }
    else{
        if(req.session.user.role=='manager'){
            return res.redirect('/404error');
        }
        return next()
    }
}