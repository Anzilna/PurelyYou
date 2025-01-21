const jwt=require('jsonwebtoken')
require('dotenv').config()

const jwtTokenCreation=async(id)=>{
    console.log("this ids the dat ag etuing",id);
    
    const secretKey=process.env.JWT_SECRET
    const maxAAge = 3 * 24 * 60 * 60;
    try {
        const token=await jwt.sign({id},secretKey,{expiresIn:maxAAge})
        return token

    } catch (error) {
        throw new Error("jwt error")
    }
}



module.exports=jwtTokenCreation;