const session = require("express-session");
const { User, Otp ,Cart} = require("../../model/usermodel");
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

module.exports.userloginpost = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);

  try {
    const user = await User.findOne({ email });
    console.log(user);

    // Handle case where user is not found
    if (!user) {
      return res.status(404).json({ message: "User not found. Please check your email or sign up." });
    }

    if (user.password === null) {
      return res.status(403).json({ message: "This email is registered through Google login. Please use Google to sign in." });
    }

    if (user.status === 'Active') {
      const compareResult = await bcrypt.compare(password, user.password);
      console.log("comparing part ", compareResult);

      if (!compareResult) {
        return res.status(404).json({ messagePassword: "Invalid password" });
      }

      // Generate token and set cookie
      const token = await jwtTokenCreation(user._id);
      res.cookie('jwt', token, {
        httpOnly: true,
      });
      return res.status(200).json({ redirect: '/user/home' });
    } else {
      // User is inactive or some other issue
      return res.status(403).json({ message: "Account is block. Please contact support." });
    }
  } catch (error) {
    console.log("Error in bcrypt in login post", error);
    return res.status(500).json({ message: "Internal server error. Please try again later." });
  }
};

//forgot password

module.exports.forgotPassword = (req, res) => {
  res.render('user/forgotPassword')
  };
  module.exports.newPassword = (req, res) => {
    res.render('user/newPassword')
    };
  module.exports.newPasswordPost = async(req, res) => {
      const {password}=req.body
      const email =session.forgotEmail

      console.log("password",password,"email",email);
      
      try {
        const user=await User.findOne({email})
if(!user)res.status(400).json({message:"email id not found"})
  user.password=password
await user.save()
console.log("done");

return res.status(200).json({ redirect: "Password updated successfully" });

      } catch (error) {
        console.log("error in forgot password . new password saving time",error); 
      }
    };
     

  module.exports.forgotPasswordPost = async(req, res) => {
    const {email} =req.body
    try {
      const user=await User.findOne({email})
      if(!user)return res.status(404).json({message:"Enter a valid email"})
        session.forgotEmail = email;
      console.log(session.forgotEmail,"stored in session");
      
      const otp = genarateOtp();
      const sendemailresult = await sendEmailAndStore(email, otp, "forgotpassword");
      console.log(sendemailresult);
      res.status(200).json({ otpsend: "otp shared to email" });
    } catch (error) {
      res.status(500).json({error:"servererror"})
    } 
    };
//userlogout

module.exports.userLogoutGet = (req, res) => {
res.cookie('jwt',"",{maxAge:1})
res.redirect('/user/login')
};
module.exports.shoppingCart = async(req, res) => {
const user=req.user;
  try {
    const category=await categoiesFind();
    console.log(user);
    
    return res.render('user/shoppingCart',{category})
  } catch (error) {
    console.log("error in shopping cart category find",error);
    
  }
};

module.exports.shoppingCartFetch = async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Unauthorized access. User not authenticated." });
  }

  try {
    const cart = await Cart.findOne({ userId: user }).populate('items.productId');
console.log(cart);

    if (!cart) {
      return res.status(404).json({ errormessage: "Shopping cart not found for the user." });
    }
    res.status(200).json({ cart });
  } catch (error) {
    console.error("Error in fetching shopping cart:", error);

    res.status(500).json({ error: "An error occurred while fetching the shopping cart." });
  }
};


  module.exports.addToCart = async (req, res) => {
    const { quantity, productId } = req.body;
    console.log(quantity, productId);
  
    if (quantity >= 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity limit reached. You can only have 10 quantity for each product.',
      });
    }
  
    try {
      console.log(req.user, quantity, productId);
  
      const user = await User.findById(req.user);
      const Product = await ProductModel.findById(productId);
  
      if (!Product) {
        return res.status(404).json({ status: 'error', message: 'Invalid product ID.' });
      }
  
      // Check if the requested quantity exceeds the stock, regardless of whether it's an existing or new item
      if (quantity > Product.stock) {
        return res.status(400).json({
          status: 'error',
          message: `Not enough stock. Only ${Product.stock} items available.`,
        });
      }
  
      const cart = await Cart.findOne({ userId: user._id });
  
      if (!cart) {
        const newCart = new Cart({
          userId: user._id,
          items: [
            {
              productId: Product._id,
              quantity,
              productname: Product.productname,
              saleprice: Product.saleprice,
              regularprice: Product.regularprice,
              discountprice: Product.discountedprice || 0,
            }
          ],
          totalamount: quantity * Product.saleprice,
          totalregularamount: quantity * Product.regularprice,
          totaldiscountamount: quantity * (Product.discountedprice || 0),
        });
  
        await newCart.save();
        return res.status(200).json({ status: 'success', message: 'Product added to cart' });
      }
  
      if (cart) {
        if (cart.items.length >= 10) {
          return res.status(400).json({
            status: 'error',
            message: 'Cart limit reached. You can only have 10 products in the cart.',
          });
        }
  
        const existingItemIndex = cart.items.findIndex(
          (item) => item.productId.toString() === productId
        );
  
        if (existingItemIndex >= 0) {
          const quantityInsideCart = cart.items[existingItemIndex].quantity;
  
          // Validate if the total quantity exceeds stock for existing items
          if (quantityInsideCart + quantity > Product.stock) {
            return res.status(400).json({
              status: 'error',
              message: `Not enough stock. Only ${Product.stock} items available.`,
            });
          }
  
          // Validate if the quantity exceeds the limit of 10 for any product
          if (quantityInsideCart + quantity > 10) {
            return res.status(400).json({
              status: 'error',
              message: 'Quantity limit reached. You can only have 10 quantity for each product in your cart.',
            });
          }
  
          console.log("Saving to existing cart");
  
          // Update the cart item
          cart.items[existingItemIndex].quantity += quantity;
          cart.items[existingItemIndex].saleprice += Product.saleprice;
          cart.items[existingItemIndex].regularprice += Product.regularprice;
          cart.items[existingItemIndex].discountprice += Product.discountedprice;

        } else {
          // If it's a new product, validate stock before adding
          if (quantity > Product.stock) {
            return res.status(400).json({
              status: 'error',
              message: `Not enough stock. Only ${Product.stock} items available.`,
            });
          }
  
          cart.items.push({
            productId: Product._id,
            quantity,
            productname: Product.productname,
            saleprice: Product.saleprice,
            regularprice: Product.regularprice,
            discountprice: Product.discountedprice || 0,
          });
        }
  
        await cart.save();
        return res.status(200).json({ success: 'success', message: 'Product added to cart' });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  };
  
  module.exports.CartRemove = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user;
  
    try {
      console.log(`Removing product with ID: ${productId} for user: ${userId}`);
  
      // Find the user's cart
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
  
      cart.items=cart.items.filter((item)=>item.productId.toString()!==productId)
  
      await cart.save();
  
      console.log(`Product removed successfully: ${productId}`);
      return res.json({ success: true, cart });
    } catch (error) {
      console.error('Error removing product:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  };
  

  module.exports.quantityEdit = async (req, res) => {
    const { productId } = req.body;
    const quantityEditValue = req.query.quantityEdit;
  
    try {
      // Fetch the product stock from the database
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      // Fetch the user's cart
      const cart = await Cart.findOne({ userId: req.user });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
  
      // Find the item in the cart
      const cartItem = cart.items.find(item => item.productId.toString() === productId);
      if (!cartItem) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
  
      // Perform the quantity update and validate stock
      if (quantityEditValue === 'increment') {
        
        if (cartItem.quantity + 1 > product.stock) {
          return res.status(400).json({ message: 'Not enough stock available' });
        }
        cartItem.quantity += 1;
      } else if (quantityEditValue === 'decrement') {
        if (cartItem.quantity - 1 < 1) {
          return res.status(400).json({ message: 'Quantity cannot be less than 1' });
        }
        cartItem.quantity -= 1;
      } else {
        return res.status(400).json({ message: 'Invalid quantity edit value' });
      }
  
      // Save the cart
      await cart.save();
  
      res.status(200).json({ saved: 'Quantity updated successfully', cart });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  
  
  //checkout 

  module.exports.checkOut = (req, res) => {
    res.render("user/checkOut");
  };

//user signup
module.exports.usersignupget = (req, res) => {
  res.render("user/usersignup");
};

module.exports.usersignuppost = async (req, res) => {
  const { email, password, name } = req.body;
  const otp = genarateOtp();
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email is already registered. Please use a different email or login." });
  }

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
    res.status(200).json({ otpsend: "otp shared to email" });
  } catch (error) {
    const err = errorHandling(error);
    console.log(err);
    return res.status(500).json({ err });
  }
};

module.exports.useremailotpget = (req, res) => {
  res.render("user/useremailotp");
};
module.exports.useremailotppost = async (req, res) => {
  const { userentredotp } = req.body;

  try {
    const otpresult = await Otp.findOne({ otp: userentredotp });
    console.log("Found OTP in MongoDB:", otpresult);

    if (!otpresult) {
      return res.status(404).json({ message: "Invalid OTP" });
    }

    if (otpresult.otpexpire <= Date.now()) {
      await Otp.deleteOne({ otp: userentredotp });
      return res.status(404).json({ message: "OTP expired. Please request a new OTP." });
    }

    if (req.query.value && req.query.value.includes("forgotpassword")) {
      await Otp.deleteOne({ otp: userentredotp });
      return res.status(200).json({ newpassword: "OTP verified successfully. You can now reset your password." });
    }

    const session = req.session;
    const newuser = new User({
      email: session.email,
      username: session.username,
      password: session.password,
    });

    await newuser.save();

    // Destroy the session only after a new user has signed up
    req.session.destroy(); 

    // Clean up OTP after successful verification
    await Otp.deleteOne({ otp: userentredotp });

    return res.status(200).json({ login: "User successfully registered and logged in." });

  } catch (error) {
    console.error("Error in processing OTP:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

//new user emil otp
module.exports.resendEmailOtpPost = async (req, res) => {
  try {
    // Generate OTP
    
    const otp = genarateOtp();
    let email = req.session?.email; // Safely access session.email
    let emailSubject = "Registration Resend OTP"; // Default subject

    // Check if "forgotpassword" flow
    if (req.query.value && req.query.value.includes("forgotpassword")) {
      email = session?.forgotEmail;
      console.log("session",session.forgotEmail);
      emailSubject = "Forgot Password Resend OTP"; // Change subject for forgot password
      
    }

    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Email not found in session." });
    }

    // Log email for debugging
    console.log("Email to send OTP:", email);

    // Send email and store OTP
    const sendemailresult = await sendEmailAndStore(
      email,
      otp,
      emailSubject // Dynamically passed email subject
    );

    console.log("Send Email Result:", sendemailresult);


    if (req.query.value && req.query.value.includes("forgotpassword")) {
      return res.status(200).json({ otp: "OTP sent successfully for password reset." });
    }

    return res.status(200).json({ otp: "OTP sent successfully for new user signup." });


  } catch (error) {
    // Log error
    console.error("Error during new email OTP send:", error);

    // Send error response
    return res.status(500).json({ message: "Failed to send OTP. Try again later." });
  }
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


//myAccountSettings in user side
module.exports.myAccountSettings=async(req,res)=>{
const category =await categoiesFind() 
  res.render('user/accountSettings',{category,subroute:"customers",mainroute:'addcustomers',title:"AddCustomers",side:"Account Settings"})
}