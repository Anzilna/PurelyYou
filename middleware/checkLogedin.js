const jwt=require('jsonwebtoken')
require('dotenv').config()


const checklogin=async (req,res,next)=>{

    const token=req.cookies.jwt
    if(token){
         try {
            console.log("before after");
            const result =await jwt.verify(token,process.env.JWT_SECRET)
            res.redirect('/user/home')
        } catch (error) {
            next();
        }
    }else{

        next();


    }
}

module.exports={
    checklogin
}