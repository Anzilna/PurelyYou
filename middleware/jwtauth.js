const jwt=require('jsonwebtoken')
require('dotenv').config()


 const jwtAuthentication=(req,res,next)=>{
  const token=req.cookies.jwt  
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            console.error("JWT verification error:", err.message); // Log the error for debugging
            return res.redirect("/user/login");
        } else {
            req.user = decodedToken;
            next();
        }
    });
} else {
    res.redirect("/user/login");
}
 }

 module.exports=jwtAuthentication;