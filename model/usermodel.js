const mongoose=require('mongoose')
const {isEmail}=require('validator');
const bcrypt =require('bcrypt');

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:[true,"please enter a username"]
    },
    email:{
        type:String,
        required:[true,"please enter an email"],
        unique:true,
        lowercase:true,
        validate:[isEmail,"please enter a valid email"]
    },
    password:{
       type:String,
       required:false,
       default:null,
       minlength:[6,"Minimum password length is 6 characters"]
    },
    googleId:{
        type:String,
        unique:true,
        sparse:true
    },
    status:{
        type:String,
        enum:["Active","Blocked"],
        default:'Active'
    },
    dateofbirth:{
        type:Date
    }
},{
    timestamps:true
})


//user schema pre method for hashing password
userSchema.pre('save', async function (next) {
    // Check if the password field is modified
    if (this.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt();
            this.password = await bcrypt.hash(this.password, salt);
            console.log("Password hashed successfully.");
        } catch (error) {
            return next(error); // Pass error to the next middleware
        }
    }
    next(); // Proceed with the save operation
});

// for hashing password
const otpSchema =new mongoose.Schema({
    otp:{
    type :Number
    },
    email:{
     type:String,
     lowercase:true
    },
    otptype:{
        type:String
    },
    otpexpire:{
        type:Date
    }
},{timestamps:true})
otpSchema.index({otpexpire:1},{expireAfterSeconds:300})
module.exports={
    Otp:mongoose.model('otp',otpSchema),
    User:mongoose.model('user',userSchema)
}