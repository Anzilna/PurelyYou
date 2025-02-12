const passport=require('passport')
const googleStrategy=require('passport-google-oauth20').Strategy;
const {User}=require('../../model/usermodel')
const jwtTokenCreation=require('../functions/jwttoken')
require('dotenv').config()

passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:8080/auth/google/callback',
    passReqToCallback: true 
}, async (req,accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            const token = await jwtTokenCreation(user._id); 
            req.authToken = token;
    
            console.log("SameSite=None cookie set in strategy");
            return done(null, user);
        } else {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

            if (!email) {
                console.error("No email found in Google profile");
                return done(new Error("No email found in Google profile"), null);
            }

            const newUser = new User({
                username: profile.displayName,
                email: email,
                googleId: profile.id
            });

            const savedUser = await newUser.save();
            const token = await jwtTokenCreation(savedUser._id); 
            req.authToken = token;

            console.log("SameSite=None cookie set in strategy");
            return done(null, savedUser);
        }
    } catch (error) {
        console.error(error);
        return done(error, null);
    }
}));

  module.exports = passport;