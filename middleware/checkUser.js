const jwt=require('jsonwebtoken')
const {User}=require('../model/usermodel')
require('dotenv').config()


 const checkUser=async(req,res,next)=>{
  const token=req.cookies.jwt  
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async(err, decodedToken) => {
        if (err) {
            console.error("JWT verification error:", err.message); // Log the error for debugging
            res.locals.localsUser=null;
            next();
        } else {
            try {
                console.log(decodedToken.id);
                
                const user=await User.findById(decodedToken.id)
                req.userdata=user;
                console.log("user uuuu",user);
                
                res.locals.localsUser=user;
                console.log(user);
                
                next();
            } catch (error) {
                console.log(error);
                next();
            }
            
        }
    });
} else {
    res.locals.localsUser=null
    next();
}
 }

 module.exports=checkUser;