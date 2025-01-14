const jwt=require('jsonwebtoken')
const {User}=require('../model/usermodel')
require('dotenv').config()


 const checkUser=async(req,res,next)=>{
  const token=req.cookies.jwt  
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async(err, decodedToken) => {
        if (err) {
            console.error("JWT verification error:", err.message); 
            res.locals.localsUser=null;
            next();
        } else {
            try {
                
                const user=await User.findById(decodedToken.id)
                req.userdata=user;
                
                res.locals.localsUser=user;
                
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