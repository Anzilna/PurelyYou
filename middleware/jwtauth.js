const jwt=require('jsonwebtoken')
require('dotenv').config()


 const jwtAuthentication=(req,res,next)=>{
  const token=req.cookies.jwt  
  console.log(token,"sssssssssssssssssssssss");
  
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            console.error("JWT verification error:", err.message); 
            return res.redirect("/login");
        } else {
            console.log(decodedToken.id,"userrrrrrrr");

            req.user = decodedToken.id;

            
            next();
        }
    });
} else {
    res.redirect("/login");
}
 }

 module.exports=jwtAuthentication;