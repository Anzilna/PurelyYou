const passport=require('passport')
const googleStrategy=require('passport-google-oauth20').Strategy;
const {User}=require('../../model/usermodel')
const jwtTokenCreation=require('../functions/jwttoken')
require('dotenv').config()


passport.use(new googleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'http://localhost:8080/user/auth/google/callback'
},async(accessToken,refreshToken,profile,done)=>{
  console.log("in something");
  
try {
    let user  =await User.findOne({googleId:profile.id})
    if(user){
        const token = await jwtTokenCreation(user._id)
        user.token=token;
        return done(null,user)
    }
    else{
      console.log(profile);
         const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

         if (!email) {
           console.error("No email found in Google profile");
           return done(new Error("No email found in Google profile"), null);
         }
        const newuser=new User({
            username:profile.displayName,
            email:email,
            googleId:profile.id
        });
        const user= await newuser.save();
        console.log("user id from google login for jwt token generating",user._id);
        const token = await jwtTokenCreation(user._id)
        console.log("after redirect");
        user.token=token;
         return done(null,user)

    }
} 
catch (error) {
    console.log(error);
    
    return done(error,null)
    
}
}
))

  // Export passport
  module.exports = passport;