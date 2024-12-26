const session = require("express-session");
const { User, Otp } = require("../../model/usermodel");
const passport = require("../config/passport");
const bcrypt=require('bcrypt')
const {
  genarateOtp,
  sendEmailAndStore,
  errorHandling,
} = require("../functions/functions");
const jwtTokenCreation = require("../functions/jwttoken");
require("dotenv").config();
const { CategoryModel,ProductModel } = require("../../model/adminmodel");

//category find

async function categoiesFind (){
  try {
    const category =await CategoryModel.find({isActive:true})
    return category
  } catch (error) {
    console.log(error);
    
  }
}
async function productFind(limitCount){
  if(limitCount){
    try {
      const product =await ProductModel.find({isListed:true}).limit(limitCount)
      return product
    } catch (error) {
      console.log(error);
      
    }
  }else{
    try {
      const product =await ProductModel.find({isListed:true})
      return product
    } catch (error) {
      console.log(error);
      
    }
  }
 
}


//user login
module.exports.userloginget = (req, res) => {
  res.render("user/userlogin");
};

module.exports.userloginpost = async(req, res) => {
 const {email,password}=req.body
console.log(email,password);
const user=await User.findOne({email})
if(user&&user.password!==null&&user.status==='Active'){
  try {
    const compareResult= await bcrypt.compare(password,user.password)
    console.log("comparing part ",compareResult);
    
    if(!compareResult){
      res.json({messagePassword:"invalid password"})
    }else{
      const token= await jwtTokenCreation(user._id)
      res.cookie('jwt',token,{
        httpOnly:true
      })
      res.status(200).json({redirect:'/user/home'})
    }
  } catch (error) {
    console.log("error in bcrypt in login post",error);
    
  }
}
else{
  res.json({message:"invalid mail"})
}

};
//forgot password

module.exports.forgotPassword = (req, res) => {
  res.render('user/forgotPassword')
  };

  module.exports.forgotPasswordPost = async(req, res) => {
    const {email} =req.body
    console.log(("foundddddddd",email));

    const user=await User.findOne({email})
    console.log(user);
    
    if(!user)res.status(404).json({failed:"Enter a registered email"})
      
    };
//userlogout

module.exports.userLogoutGet = (req, res) => {
res.cookie('jwt',"",{maxAge:1})
res.redirect('/user/login')
};


//user signup
module.exports.usersignupget = (req, res) => {
  res.render("user/usersignup");
};

module.exports.usersignuppost = async (req, res) => {
  const { email, password, name } = req.body;
  const otp = genarateOtp();

  try {
    const newUser = new User({
      email,
      username: name,
      password,
    });
    await newUser.validate();
    session.email = email;
    session.password = password;
    session.username = name;
    console.log("Stored in session otp and details");
    const sendemailresult = await sendEmailAndStore(email, otp, "registration");
    console.log(sendemailresult);
    res.json({ otpsend: "otp shared to email" });
  } catch (error) {
    const err = errorHandling(error);
    console.log(err);
    res.json({ err });
  }
};

module.exports.useremailotpget = (req, res) => {
  res.render("user/useremailotp");
};
module.exports.useremailotppost = async (req, res) => {
  const { userentredotp } = req.body;
  try {
    const otpresult = await Otp.findOne({ otp: userentredotp });
    console.log("found otp in moongodb", otpresult);
    if (otpresult) {
      console.log(userentredotp);

      if (
        otpresult.otpexpire > Date.now() &&
        parseInt(userentredotp) === otpresult.otp
      ) {
        const newuser = User({
          email: session.email,
          username: session.username,
          password: session.password,
        });
        await newuser.save();
        req.session.destroy();
        await Otp.deleteOne({ otp: userentredotp });
        res.json({ login: "all ok" });
      } else {
        res.json({ message: "otp expired" });
      }
    }
    if (!otpresult) {
      res.json({ message: "invalid otp" });
    }
  } catch (error) {
    console.log("error in finding otp from otp collection", error);
  }
};
//new user emil otp
module.exports.newuseremailotppost = async (req, res) => {
  const otp = genarateOtp();
  try {
    const email = session.email;
    console.log(email);

    const sendemailresult = await sendEmailAndStore(
      email,
      otp,
      "registration resend otp"
    );
    console.log(sendemailresult);
    res.json({ otp: "OTP sent successfully." });
  } catch (error) {
    console.log("error during new email otp snd", error);
  }
  session.c;
};
//user home
module.exports.userhomeget =async (req, res) => {
  try {
    const DaysAgo = new Date();
    DaysAgo.setDate(DaysAgo.getDate() - 30);
    const category=await categoiesFind()
    const recentLaunchProducts = await ProductModel.find({
      isListed:true,
      createdAt: { $gte: DaysAgo } 
    }).sort({createdAt:-1}).limit(8);

    res.render("user/userhome",{category,products:recentLaunchProducts});
  } catch (error) {
    console.log(error);
    
  }
};

/// product details
module.exports.ProductDetails = async(req, res) => {
 const id = req.params.id
 console.log(id);
 try {
  const product =await ProductModel.findById(id)
  const products = await ProductModel.find({isListed:true,category:product.category}).limit(8)
  const filterArray = products.filter((prd)=>{
    return  prd._id.toString()!==product._id.toString()
  })
  console.log(product._id);
  
  console.log(filterArray);
  const category = await categoiesFind()
 res.render('user/productDetails',{product,products:filterArray,category})
 } catch (error) {
  console.log(error);
  
 }
 
};


module.exports.viewallproducts=async(req,res)=>{
  const viewid=req.query.viewid
  const id=req.params.id
  if(viewid.includes('shopall')){
    try {
      const category=await categoiesFind()
  const products= await ProductModel.find({isListed:true}).populate({
    path:'category',
    match:{
      isActive:true
    }
  })
  
  const filteredProducts = products.filter(product => product.category);

  res.render('user/viewallPage',{category,products:filteredProducts})
    } catch (error) {
      console.log(error);
      
    }
  }if(viewid.includes('newlaunches')){
    const DaysAgo = new Date();
    DaysAgo.setDate(DaysAgo.getDate() - 30);
    const category=await categoiesFind()
    const recentLaunchProducts = await ProductModel.find({
      isListed:true,
      createdAt: { $gte: DaysAgo } 
    }).sort({createdAt:-1});
    
    res.render('user/viewallPage', {
      category, 
      products: recentLaunchProducts
    });    
  }
  if (id && typeof viewid === 'string' && viewid.includes('allcategory')) {
    try {
      const category=await categoiesFind()
      const products = await ProductModel.find({
        isListed:true,
        category:id
      }).populate({
        path: 'category',
        match: {
          isActive:true
        }
      });
  
      const filteredProducts = products.filter(product => product.category);
  
      res.render('user/viewallPage', {
        category, 
        products: filteredProducts
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).send('An error occurred while fetching products.');
    }
  }
  
}

// passport user google login session below this
//for initalizing
module.exports.googleLoginRoute = (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })(req, res, next);
};
//for handling the callback which google provide
module.exports.googleAuthCallback = (req, res, next) => {
  console.log("log 1");

  passport.authenticate("google", { session: false }, (err, user, info) => {
    console.log("log 2");
if(err&&err.message){
  if (err.message.includes('E11000')) {
    console.error("Error during authentication:");
    return res.status(500).redirect(`/user/login/?errorDuplicate=${encodeURIComponent("email already registerd through nomal login")}`);
  }
}
    if (!user) {
      console.warn("Authentication failed: No user found.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = user.token;
    res.cookie("jwt", token, { httpOnly: true });
    console.log("after seting cookie ");

    res.redirect("/user/home");
  })(req, res, next); // Important: Call this with `req, res, next`
};
