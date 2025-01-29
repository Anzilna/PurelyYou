const jwt=require('jsonwebtoken')
require('dotenv').config()


const checklogin=async (req,res,next)=>{

    const token=req.cookies.jwt
    if(token){
         try {
            const result = jwt.verify(token,process.env.JWT_SECRET)
            res.redirect('/')
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