const session = require("express-session");
const { User,Otp,Order,Favourite,Cart,Address, Wallet, walletTransaction} = require("../../model/usermodel");
const passport = require("../config/passport");
const bcrypt=require('bcrypt')
const {
  genarateOtp,
  sendEmailAndStore,
  errorHandling,
} = require("../functions/functions");
const jwtTokenCreation = require("../functions/jwttoken");
require("dotenv").config();
const { CategoryModel,ProductModel , CouponModel} = require("../../model/adminmodel");
const { date } = require("zod");

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
      return res.status(200).json({ redirect: '/' });
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
res.redirect('/login')
};


//favorites
module.exports.addFavourites = async (req, res) => {
  try {
    console.log("ok 111");
    
    const productId = req.body.id;
const user = req.user
    if (!user) {
      return res.json({
        success: false,
        message: 'Login is required to add item to the favourites. Please log in and try again.'
      });
    }
    console.log("ok 11122");

    console.log(`Received product ID: ${productId}`);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    console.log('Product found:', product);

    let favorites = await Favourite.findOne({ userId: req.user });
    console.log('Favorites collection:', favorites);

    const item = {
      productId: product._id,
      productname: product.productname,
      productimage: product.images[0],
      productsaleprice: product.saleprice,
      productregularprice: product.regularprice,
    };

    if (!favorites) {
      const newFavourites = new Favourite({
        userId: req.user,
        items: [item],
      });

      await newFavourites.save();
      return res.status(201).json({ success: true, message: 'Added to favorites' });
    }

    const isAlreadyFavorite = favorites.items.some(fav => fav.productId.equals(product._id));
    console.log('Is product already in favorites?', isAlreadyFavorite);

    if (isAlreadyFavorite) {
      console.log("loooooogrde");
      
      return res.json({ success: false, message: 'Product is already in favorites' });
    }

    favorites.items.push(item);
    await favorites.save();

    return res.status(200).json({ success: true, message: 'Added to favorites' });

  } catch (error) {
    console.error('Error while adding to favorites:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports.favouritesGet = async(req, res) => {
  const user=req.user;
    try {
      const category=await categoiesFind();
      console.log(user);
      
      return res.render('user/favourites',{category})
    } catch (error) {
      console.log("error in shopping cart category find",error);
      
    }
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
  const authuser=req.user
  if (!authuser) {
    return res.status(404).json({
      status: 'error',
      message: 'Login is required to add item to the cart. Please log in and try again.',
    });
  }
    if (quantity > 10) {
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
        const existingItem = cart.items.find((item) => item.productId.toString() === productId);

        if (existingItem) {
          return res.status(400).json({
            status: "error",
            message: "Product already exists in the cart.",
          });
        }
      
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
  
          if (quantityInsideCart + quantity > Product.stock) {
            return res.status(400).json({
              status: 'error',
              message: `Not enough stock. Only ${Product.stock} items available.`,
            });
          }
  
          if (quantityInsideCart + quantity > 10) {
            return res.status(400).json({
              status: 'error',
              message: 'Quantity limit reached. You can only have 10 quantity for each product in your cart.',
            });
          }
  
          console.log("Saving to existing cart");
  
          cart.items[existingItemIndex].quantity += quantity;
          cart.items[existingItemIndex].saleprice += Product.saleprice;
          cart.items[existingItemIndex].regularprice += Product.regularprice;
          cart.items[existingItemIndex].discountprice += Product.discountedprice;

        } else {
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
  
    const MAX_INCREMENT_LIMIT = 10; // Maximum increment limit
  
    try {
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const cart = await Cart.findOne({ userId: req.user });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
  
      const cartItem = cart.items.find(item => item.productId.toString() === productId);
      if (!cartItem) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
  
      if (quantityEditValue === 'increment') {
        if (cartItem.quantity + 1 > product.stock) {
          return res.status(400).json({ message: 'Not enough stock available' });
        }
        if (cartItem.quantity >= MAX_INCREMENT_LIMIT) {
          return res.status(400).json({ message: `You can only add ${MAX_INCREMENT_LIMIT} quantity for each product` });
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
 try {
  const product =await ProductModel.findById(id)
  const products = await ProductModel.find({isListed:true,category:product.category}).limit(8)
  const filterArray = products.filter((prd)=>{
    return  prd._id.toString()!==product._id.toString()
  })
  
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
    return res.status(500).redirect(`/login/?errorDuplicate=${encodeURIComponent("email already registerd through nomal login")}`);
  }
}
    if (!user) {
      console.warn("Authentication failed: No user found.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = user.token;
    res.cookie("jwt", token, { httpOnly: true });
    console.log("after seting cookie ");

    res.redirect("/");
  })(req, res, next); // Important: Call this with `req, res, next`
};


module.exports.myAccountSettings = async (req, res) => {
  try {
    const category = await CategoryModel.find(); 
    const user=req.user
    const orders=await Order.findOne({userId:user})
    const address=await Address.findOne({userId:user})
    const route = {
      home: "home",
      mainroute: 'accountsettings',
      title: "Account Settings",
      side: "Account Settings"
    };

    res.render('user/accountSettings', { category, route ,orders,address});

  } catch (error) {
    console.error("Error fetching categories for account settings:", error);

    res.status(500).send("An error occurred while fetching account settings.");
  }
};

module.exports.myDetailsedit = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user });
    const category =await categoiesFind() 
       console.log(req.query.id);

    if (!user) {
      return res.status(404).render("error", {
        message: "User not found",
        status: 404,
      });
    }

    const route = {
      home: "home",
      mainroute: "editdetails",
      accountsettings: "accountsettings",
      title: "Account Settings",
      side: "Account Settings",
    };

    res.render("user/editDetails", { user, route ,category});
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).render("error", {
      message: "An error occurred while fetching user details",
      status: 500,
    });
  }
};
module.exports.myDetailseditPost = async (req, res) => {
  try {
    const userId = req.user; 

    const { name, phone, dob } = req.body;

    if (!name ) {
        return res.status(400).json({ message: "Name and  are required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            name,
            phone: phone || null, 
            dob: dob || null,     
        },
        { new: true, runValidators: true } 
    );

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Details updated successfully.", user: updatedUser });
} catch (error) {
    console.error("Error updating user:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Internal server error." });
}
};

module.exports.AddressGet=async(req,res)=>{
  const userId = req.user;
  const id=req.query.id
  const category =await categoiesFind() 
  const address = await Address.findOne({userId})
  const route={
  home:"home",
  accountsettings:'accountsettings',
  mainroute:'address',
  title:"Address",
  side:"Address"
  }
    res.render('user/address',{category,route,address})
  }

  module.exports.AddAddressGet=async(req,res)=>{
    const category =await categoiesFind() 
    const route={
    home:"home",
    subroute:'address',
    mainroute:'addaddress',
    accountsettings:'accountsettings',
    title:"AddAddress",
    side:"Address"
    }
      res.render('user/addAddress',{category,route})
    }

    module.exports.ordersView = async (req, res) => {
      try {
        const category = await categoiesFind(); // Corrected function name and added `await`
        const orders = await Order.find({ userId: req.user }).sort({ createdAt: -1 }); // Added `await`
        const route = {
          home: "home",
          mainroute: "orders",
          accountsettings: "accountsettings",
          title: "Orders",
          side: "Orders"
        };
    
        res.render('user/ordersView', { category, route, orders }); // Passing corrected data
      } catch (error) {
        console.error("Error in ordersView:", error);
        res.status(500).send("Internal Server Error"); // Graceful error handling
      }
    };


    module.exports.ordersViewDetails = async (req, res) => {
      const orderId = req.params.id; 
  try {
    const category = await categoiesFind(); 

    const order = await Order.findOne({ _id: orderId }) 
      .populate('items.productId') 

    if (!order) {
      return res.status(404).send("Order not found"); 
    }

    console.log(order, "Order Details Retrieved");

    const route = {
      home: "home",
      mainroute: "orderdetails",
      subroute: "orders",
      accountsettings: "accountsettings",
      title: "OrdersDetails",
      side: "Orders"
    };

    res.render('user/orderDetaiilsManagement', { 
      category, 
      route, 
      order 
    });

  } catch (error) {
    console.error("Error in ordersViewDetails:", error);
    res.status(500).send("Internal Server Error"); 
  }
    };
    
    
    module.exports.AddAddressGetPost = async(req,res)=>{
      
      const address = req.body;
      console.log(req.body);
      
      const userId = req.user;

      if (!userId || !address) {
        return res.status(400).json({ error: "User ID and address details are required." });
      }
    
      try {
        let userAddress = await Address.findOne({ userId });
    
        if (!userAddress) {
          userAddress = new Address({ userId, addresses: [address] });
        } else {
          if (userAddress.addresses.length >= 5) {

            return res.status(400).json({ limit: "You can only have a maximum of 5 addresses." });
          }
          userAddress.addresses.push(address);
        }
    
        await userAddress.save();
        res.status(200).json({ message: "Address added successfully.", userAddress });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error." });
      }    
      }
      module.exports.AddressEditPost=async(req,res)=>{
        const addressId= req.params.id;
        const userId = req.user; 
        const updatedAddress = req.body;
      
        console.log("Request body:", req.body);
        console.log("User ID:", userId);
        console.log("Address ID:", addressId);
      
        try {
          if (!userId || !addressId || !updatedAddress) {
            return res.status(400).json({ error: "User ID, address ID, and address details are required." });
          }
      
          const userAddress = await Address.findOne({ userId });
      
          if (!userAddress) {
            return res.status(404).json({ error: "Address document not found for this user." });
          }
      
          const existingAddress = userAddress.addresses.find(
            (addr) => addr._id.toString() === addressId
          );
      
          if (!existingAddress) {
            return res.status(404).json({ error: "Address with the given ID not found." });
          }
      
          // Update fields
          existingAddress.name = updatedAddress.name || existingAddress.name;
          existingAddress.address = updatedAddress.address || existingAddress.address;
          existingAddress.addressline = updatedAddress.addressline || existingAddress.addressline;
          existingAddress.city = updatedAddress.city || existingAddress.city;
          existingAddress.state = updatedAddress.state || existingAddress.state;
          existingAddress.pincode = updatedAddress.pincode || existingAddress.pincode;
          existingAddress.phone = updatedAddress.phone || existingAddress.phone;
          existingAddress.email = updatedAddress.email || existingAddress.email;
      
          await Address.findOneAndUpdate(
            { _id: userAddress._id, "addresses._id": addressId },
            {
              $set: {
                "addresses.$": existingAddress,
              },
            },
            { new: true } 
          );
      
          res.status(200).json({ message: "Address updated successfully.", userAddress });
        } catch (error) {
          console.error("Error:", error);
          res.status(500).json({ error: "Internal Server Error." });
        }      
        
        }
     
module.exports.AddressEditGet = async (req, res) => {
  const { id: addressId } = req.params; 
  const userId = req.user; 

  try {
    if (!userId || !addressId) {
      return res.status(400).json({ error: "User ID and Address ID are required." });
    }

    const userAddress = await Address.findOne({ userId });

    if (!userAddress) {
      return res.status(404).json({ error: "Address document not found for this user." });
    }

    const address = userAddress.addresses.find(
      (addr) => addr._id.toString() === addressId
    );

    if (!address) {
      return res.status(404).json({ error: "Address with the given ID not found." });
    }

    const category = await categoiesFind(); 
    const route = {
      home: "home",
      subroute: "address",
      mainroute: "editaddress",
      accountsettings: "accountsettings",
      title: "EditAddress",
      side: "Address",
    };

    res.render("user/editAddress", { category, route, address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

        
      module.exports.AddressDelete=async(req,res)=>{
        
        try {
          const user = req.user; 
          const addressId = req.params.id; 
  
          const userAddress = await Address.findOne({ userId: user });
  
          if (!userAddress) {
              return res.status(404).json({ message: "User not found" });
          }
  
          const addressIndex = userAddress.addresses.findIndex(address => address._id.toString() === addressId);
  
          if (addressIndex === -1) {
              return res.status(404).json({ message: "Address not found" });
          }
  
          userAddress.addresses.splice(addressIndex, 1);
  
          await userAddress.save();
  
          res.status(200).json({ done: "Address deleted successfully" });
  
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Server error" });
      }

        }
      
  



  //checkout 

  module.exports.checkOut = async (req, res) => {
    try {
      const userId = req.user;  
      
      const address = await Address.findOne({ userId });
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      console.log(cart);
      console.log(address)
  
      res.render("user/checkOut", { address, cart });
  
    } catch (error) {
      console.error("Error fetching checkout data:", error);
      res.status(500).send("An error occurred while fetching the checkout data.");
    }
  };

  module.exports.checkOutFetch = async (req, res) => {
    try {
      const user = req.user; 
      const cart = await Cart.findOne({ userId: user }).populate('items.productId');
      
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found for this user' });
      }
      
      res.status(200).json({ message: 'Cart retrieved successfully', cart });
    } catch (error) {
      console.error('Error in checkout process:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  };


 module.exports.orderSave = async (req, res) => {
  try {
    const { 
      totalAmount, 
      totalDiscount, 
      deliveryCharge, 
      paymentMethod, 
      userInfo, 
      addressId, 
      coupponCode, 
      coupponDiscount, 
      coupponId 
    } = req.body;


    if (!totalAmount || !totalDiscount || !paymentMethod || !userInfo || !addressId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const userAddress = await Address.findOne({ userId: req.user });
    if (!userAddress || !userAddress.addresses) {
      return res.status(404).json({ error: "Address not found" });
    }

    const selectedAddress = userAddress.addresses.find(
      (address) => address._id.toString() === addressId
    );
    if (!selectedAddress) {
      return res.status(404).json({ error: "Selected address not found" });
    }

    const userCart = await Cart.findOne({ userId: req.user });
    if (!userCart || !userCart.items.length) {
      return res.status(404).json({ error: "Cart is empty" });
    }

    const orderId = `ORD${Date.now()}`;
    let walletUsedAmount = 0;

    if (paymentMethod === "Wallet") {
      console.log("Processing wallet payment...");
      const wallet = await Wallet.findOne({ userId: req.user });

      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      if (wallet.balance <= 0) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      if (wallet.balance < totalAmount) {
        return res.status(400).json({
          error: `Insufficient wallet balance. Wallet balance is ₹${wallet.balance}, but the total amount is ₹${totalAmount}.`,
        });
      }

      walletUsedAmount = totalAmount;
      wallet.balance -= totalAmount;
      const newWalletTransaction = new walletTransaction({
        userId:req.user,
        walletId:wallet._id,
        transactionId: `txn-${Date.now()}`,
type:'DEBIT',
description:'purchase',
date:new Date(),
amount:totalAmount
      })
      await newWalletTransaction.save()
      await wallet.save();
    }

    if (paymentMethod === "cod") {
      walletUsedAmount = 0;
    }

    const newOrder = new Order({
      userId: req.user,
      totalAmount,
      totalDiscount,
      deliveryCharge,
      username: userInfo.username,
      email: userInfo.email,
      code: orderId,
      selectedAddress: {
        name: selectedAddress.name,
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        phone: selectedAddress.phone,
        email: selectedAddress.email,
        _id: selectedAddress._id,
        createdAt: selectedAddress.createdAt,
      },
      paymentMethod,
      walletUsedAmount,
      items: userCart.items.map((item) => ({
        productId: item.productId,
        productname: item.productname,
        quantity: item.quantity,
        saleprice: item.saleprice,
        regularprice: item.regularprice,
        discountprice: item.discountprice || 0,
      })),
    });

    if (coupponCode && coupponDiscount && coupponId) {
      newOrder.coupponCode = coupponCode;
      newOrder.coupponDiscount = coupponDiscount;
      newOrder.coupponId = coupponId;
      newOrder.coupponUsed = true;
      const coupon = await CouponModel.findById(coupponId)

      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
     if(!coupon.noUsageLimit&&coupon.usageLimit > 0){
      coupon.usageLimit -= 1
     }
      coupon.usedBy.push(req.user)
      await coupon.save();
    }

    for (const item of userCart.items) {
      const product = await ProductModel.findById(item.productId);

      if (!product) {
        await newOrder.delete();
        return res
          .status(404)
          .json({ error: `Product not found: ${item.productname || "Unknown Product"}` });
      }

      if (product.stock < item.quantity) {
        await newOrder.delete();
        return res
          .status(400)
          .json({ error: `Insufficient stock for product: ${product.productname}` });
      }

      product.stock -= item.quantity;
      await product.save();
    }

    await newOrder.save();

    await Cart.findOneAndUpdate(
      { userId: req.user },
      {
        items: [],
        totalamount: 0,
        totalregularamount: 0,
        totaldiscountamount: 0,
      }
    );

    return res.status(200).json({
      message: "Order Placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error saving order:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};




module.exports.orderPlacedSuccess = async (req, res) => {

  res.render("user/orderSuccess");


};