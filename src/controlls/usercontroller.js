const session = require("express-session");
const {
  User,
  Otp,
  Order,
  Favourite,
  Cart,
  Address,
  Wallet,
  walletTransaction,
  PendingOrders,
} = require("../../model/usermodel");
const passport = require("../config/passport");
const bcrypt = require("bcrypt");
const {
  genarateOtp,
  sendEmailAndStore,
  errorHandling,
} = require("../functions/functions");
const jwtTokenCreation = require("../functions/jwttoken");
require("dotenv").config();
const {
  CategoryModel,
  ProductModel,
  CouponModel,
  OfferModel,
} = require("../../model/adminmodel");
const { date } = require("zod");
const { generateReferralToken } = require("../functions/generateReferralToken");
const { decodeReferralToken } = require("../functions/decodeReferralToken");
const { pendingOrders } = require("./fetchUserController");

//category find

async function categoiesFind() {
  try {
    const category = await CategoryModel.find({ isActive: true });
    return category;
  } catch (error) {
    console.log(error);
  }
}
async function productFind(limitCount) {
  if (limitCount) {
    try {
      const product = await ProductModel.find({ isListed: true }).limit(
        limitCount
      );
      return product;
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
      const product = await ProductModel.find({ isListed: true });
      return product;
    } catch (error) {
      console.log(error);
    }
  }
}

//user login
module.exports.userloginget = async (req, res) => {
  try {
    const categories = await categoiesFind();

    res.render('user/userlogin', { category: categories });
  } catch (error) {
    console.error("Error in userloginget:", error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports.userloginpost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please check your email or sign up.",
      });
    }

    if (user.password === null) {
      return res.status(403).json({
        message:
          "This email is registered through Google login. Please use Google to sign in.",
      });
    }

    if (user.status === "Active") {
      const compareResult = await bcrypt.compare(password, user.password);

      if (!compareResult) {
        return res.status(404).json({ messagePassword: "Invalid password" });
      }

      const token = await jwtTokenCreation(user._id);
      res.cookie("jwt", token, {
        httpOnly: true,     
        secure: process.env.NODE_ENV === "production",  
        sameSite: "Strict", 
        maxAge: 1000 * 60 * 60 * 24,  
      });
      

      let wallet = await Wallet.findOne({ userId: user._id });
      if (!wallet) {
        wallet = new Wallet({
          userId: user._id,
          balance: 0,
        });
        await wallet.save();
      }

      let address = await Address.findOne({ userId: user._id });
      if (!address) {
        address = new Address({
          userId: user._id,
          addresses: [],
        });
        await address.save();
      }

      return res.status(200).json({ redirect: "/" });
    } else {
      return res
        .status(403)
        .json({ message: "Account is blocked. Please contact support." });
    }
  } catch (error) {
    console.log("Error in login post:", error);
    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};

//forgot password

module.exports.forgotPassword = async (req, res) => {
  try {
    const categories = await categoiesFind();  
    res.render("user/forgotPassword", { category: categories });  
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.newPassword = async (req, res) => {
  try {
    const categories = await categoiesFind();  
    res.render("user/newPassword", { category: categories });  
  } catch (error) {
    console.error("Error in newPassword:", error);
    res.status(500).send("Internal Server Error");
  }
};
module.exports.newPasswordPost = async (req, res) => {
  const { password } = req.body;
  const email = session.forgotEmail;

  try {
    const user = await User.findOne({ email });
    if (!user) res.status(400).json({ message: "email id not found" });
    user.password = password;
    await user.save();

    return res.status(200).json({ redirect: "Password updated successfully" });
  } catch (error) {
    console.log("error in forgot password . new password saving time", error);
  }
};

module.exports.forgotPasswordPost = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Enter a valid email" });
    session.forgotEmail = email;

    const otp = genarateOtp();
    const sendemailresult = await sendEmailAndStore(
      email,
      otp,
      "forgotpassword"
    );
    res.status(200).json({ otpsend: "otp shared to email" });
  } catch (error) {
    res.status(500).json({ error: "servererror" });
  }
};
//userlogout

module.exports.userLogoutGet = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/login");
};

//favorites
module.exports.addFavourites = async (req, res) => {
  try {
    const productId = req.body.id;
    const user = req.userforlogin;
    if (!user) {
      return res.json({
        success: false,
        message:
          "Login is required to add item to the favourites. Please log in and try again.",
      });
    }

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    let favorites = await Favourite.findOne({ userId: user });

    const item = {
      productId: product._id,
      productname: product.productname,
      productimage: product.images[0],
      productsaleprice: product.saleprice,
      productregularprice: product.regularprice,
    };

    if (!favorites) {
      const newFavourites = new Favourite({
        userId: user,
        items: [item],
      });

      await newFavourites.save();
      return res
        .status(201)
        .json({ success: true, message: "Added to favorites" });
    }

    const isAlreadyFavorite = favorites.items.some((fav) =>
      fav.productId.equals(product._id)
    );

    if (isAlreadyFavorite) {
      return res.json({
        success: false,
        message: "Product is already in favorites",
      });
    }

    favorites.items.push(item);
    await favorites.save();

    return res
      .status(200)
      .json({ success: true, message: "Added to favorites" });
  } catch (error) {
    console.error("Error while adding to favorites:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports.favouritesGet = async (req, res) => {
  const user = req.user;
  try {
    const category = await categoiesFind();

    return res.render("user/favourites", { category });
  } catch (error) {
    console.log("error in shopping cart category find", error);
  }
};
module.exports.shoppingCart = async (req, res) => {
  const user = req.user;
  try {
    const category = await categoiesFind();

    return res.render("user/shoppingCart", { category });
  } catch (error) {
    console.log("error in shopping cart category find", error);
  }
};

module.exports.shoppingCartFetch = async (req, res) => {
  const user = req.user;

  if (!user) {
    return res
      .status(401)
      .json({ error: "Unauthorized access. User not authenticated." });
  }

  try {
    const cart = await Cart.findOne({ userId: user }).populate(
      "items.productId"
    );

    if (!cart) {
      return res
        .status(404)
        .json({ errormessage: "Shopping cart not found for the user." });
    }
    res.status(200).json({ cart });
  } catch (error) {
    console.error("Error in fetching shopping cart:", error);

    res
      .status(500)
      .json({ error: "An error occurred while fetching the shopping cart." });
  }
};

module.exports.addToCart = async (req, res) => {
  const { quantity, productId } = req.body;
  const authUser = req.userforlogin;

  if (!authUser) {
    return res.status(404).json({
      status: "error",
      message:
        "Login is required to add item to the cart. Please log in and try again.",
    });
  }

  if (quantity > 10) {
    return res.status(400).json({
      status: "error",
      message:
        "Quantity limit reached. You can only have 10 quantity for each product.",
    });
  }

  try {
    const user = await User.findById(authUser);
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ status: "error", message: "Invalid product ID." });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        status: "error",
        message: `Not enough stock. Only ${product.stock} items available.`,
      });
    }

    let discountedPrice = product.discountedprice;
    let adjustedSalePrice = product.saleprice;

    let cart = await Cart.findOne({ userId: user._id });

    if (!cart) {
      cart = new Cart({
        userId: user._id,
        items: [
          {
            productId: product._id,
            quantity,
            productname: product.productname,
            saleprice: adjustedSalePrice,
            regularprice: product.regularprice,
            discountprice: discountedPrice,
          },
        ],
        totalamount: quantity * adjustedSalePrice,
        totalregularamount: quantity * product.regularprice,
        totaldiscountamount: quantity * discountedPrice,
      });

      await cart.save();
      return res
        .status(200)
        .json({ status: "success", message: "Product added to cart" });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      return res.status(400).json({
        status: "error",
        message: "Product already exists in the cart.",
      });
    }

    if (cart.items.length >= 10) {
      return res.status(400).json({
        status: "error",
        message:
          "Cart limit reached. You can only have 10 products in the cart.",
      });
    }

    cart.items.push({
      productId: product._id,
      quantity,
      productname: product.productname,
      saleprice: adjustedSalePrice,
      regularprice: product.regularprice,
      discountprice: discountedPrice,
    });

    cart.totalamount += quantity * adjustedSalePrice;
    cart.totalregularamount += quantity * product.regularprice;
    cart.totaldiscountamount += quantity * discountedPrice;

    await cart.save();
    return res
      .status(200)
      .json({ status: "success", message: "Product added to cart" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

module.exports.CartRemove = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    return res.json({ success: true, cart });
  } catch (error) {
    console.error("Error removing product:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports.quantityEdit = async (req, res) => {
  const { productId } = req.body;
  const quantityEditValue = req.query.quantityEdit;

  const MAX_INCREMENT_LIMIT = 10; // Maximum increment limit

  try {
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const cart = await Cart.findOne({ userId: req.user });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (quantityEditValue === "increment") {
      if (cartItem.quantity + 1 > product.stock) {
        return res.status(400).json({ message: "Not enough stock available" });
      }
      if (cartItem.quantity >= MAX_INCREMENT_LIMIT) {
        return res.status(400).json({
          message: `You can only add ${MAX_INCREMENT_LIMIT} quantity for each product`,
        });
      }
      cartItem.quantity += 1;
    } else if (quantityEditValue === "decrement") {
      if (cartItem.quantity - 1 < 1) {
        return res
          .status(400)
          .json({ message: "Quantity cannot be less than 1" });
      }
      cartItem.quantity -= 1;
    } else {
      return res.status(400).json({ message: "Invalid quantity edit value" });
    }

    // Save the cart
    await cart.save();

    res.status(200).json({ saved: "Quantity updated successfully", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//user signup
module.exports.usersignupget = async (req, res) => {
  try {
    const categories = await categoiesFind();

    res.render('user/usersignup', { category: categories });
  } catch (error) {
    console.error("Error in usersignupget:", error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports.usersignuppost = async (req, res) => {
  const { email, password, name, ref } = req.body;
  const otp = genarateOtp();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message:
        "Email is already registered. Please use a different email or login.",
    });
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
    session.referrer = ref || null;

    const sendemailresult = await sendEmailAndStore(email, otp, "registration");
    res.status(200).json({ otpsend: "otp shared to email" });
  } catch (error) {
    const err = errorHandling(error);
    console.log(err);
    return res.status(500).json({ err });
  }
};

module.exports.useremailotpget = async (req, res) => {
  try {
    const categories = await categoiesFind();

    res.render("user/useremailotp", { category: categories });
  } catch (error) {
    console.error("Error in useremailotpget:", error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports.useremailotppost = async (req, res) => {
  const { userentredotp } = req.body;

  try {
    const otpresult = await Otp.findOne({ otp: userentredotp });

    if (!otpresult) {
      return res.status(404).json({ message: "Invalid OTP" });
    }

    if (otpresult.otpexpire <= Date.now()) {
      await Otp.deleteOne({ otp: userentredotp });
      return res
        .status(404)
        .json({ message: "OTP expired. Please request a new OTP." });
    }

    if (req.query.value && req.query.value.includes("forgotpassword")) {
      await Otp.deleteOne({ otp: userentredotp });
      return res.status(200).json({
        newpassword:
          "OTP verified successfully. You can now reset your password.",
      });
    }

    let wallet = null;
    if (session.referrer) {
      const decodedRef = decodeReferralToken(session.referrer);

      wallet = await Wallet.findOne({ userId: decodedRef });
      if (!wallet) {
        wallet = new Wallet({ userId: decodedRef, balance: 100 });
        await wallet.save();
      } else {
        wallet.balance += 100;
        await wallet.save();
      }

      const newWalletTransaction = new walletTransaction({
        walletId: wallet._id,
        userId: decodedRef,
        transactionId: `TXN-${Date.now()}`,
        type: "CREDIT",
        amount: 100,
        description: "Referral reward",
      });
      await newWalletTransaction.save();
    }

    const existingUser = await User.findOne({ email: session.email });
    if (existingUser) {
      return res
        .status(200)
        .json({ login: "User already registered. Logged in successfully." });
    }

    const newuser = new User({
      email: session.email,
      username: session.username,
      password: session.password,
    });

    await newuser.save();

    req.session.destroy();

    await Otp.deleteOne({ otp: userentredotp });

    return res
      .status(200)
      .json({ login: "User successfully registered and logged in." });
  } catch (error) {
    console.error("Error in processing OTP:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

//new user emil otp
module.exports.resendEmailOtpPost = async (req, res) => {
  try {
    // Generate OTP

    const otp = genarateOtp();
    let email = session.email;

    let emailSubject = "Registration Resend OTP";

    if (req.query.value && req.query.value.includes("forgotpassword")) {
      email = session?.forgotEmail;

      emailSubject = "Forgot Password Resend OTP";
    }

    if (!email) {
      return res.status(400).json({ message: "Email not found in session." });
    }

    const sendemailresult = await sendEmailAndStore(email, otp, emailSubject);

    if (req.query.value && req.query.value.includes("forgotpassword")) {
      return res
        .status(200)
        .json({ otp: "OTP sent successfully for password reset." });
    }

    return res
      .status(200)
      .json({ otp: "OTP sent successfully for new user signup." });
  } catch (error) {
    console.error("Error during new email OTP send:", error);

    return res
      .status(500)
      .json({ message: "Failed to send OTP. Try again later." });
  }
};

//user home
module.exports.userhomeget = async (req, res) => {
  try {
    const DaysAgo = new Date();
    DaysAgo.setDate(DaysAgo.getDate() - 70);
    const category = await categoiesFind();
    const recentLaunchProducts = await ProductModel.find({
      isListed: true,
      createdAt: { $gte: DaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(8);

    res.render("user/userhome", { category, products: recentLaunchProducts });
  } catch (error) {
    console.log(error);
  }
};

/// product details
module.exports.ProductDetails = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await ProductModel.findById(id);
    const products = await ProductModel.find({
      isListed: true,
      category: product.category,
    }).limit(8);
    const filterArray = products.filter((prd) => {
      return prd._id.toString() !== product._id.toString();
    });

    const category = await categoiesFind();
    res.render("user/productDetails", {
      product,
      products: filterArray,
      category,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.viewallproducts = async (req, res) => {
  try {
    const category = await categoiesFind();

    res.render("user/viewallPage", { category });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("An error occurred while loading the page.");
  }
};

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
  passport.authenticate("google", { session: false }, async (err, user, info) => {
    if (err && err.message) {
      if (err.message.includes("E11000")) {
        console.error("Error during authentication:");
        return res
          .status(500)
          .redirect(
            `/login/?errorDuplicate=${encodeURIComponent(
              "email already registered through normal login"
            )}`
          );
      }
    }
    
    if (!user) {
      console.warn("Authentication failed: No user found.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = await jwtTokenCreation(user._id);
    console.log("tokennnn", token, "userr", user);

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 1000 * 60 * 60 * 24,
    });
    
    console.log("cookie set successfully");

    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = new Wallet({
        userId: user._id,
        balance: 0,
      });
      await wallet.save();
    }
    console.log("wallet set successfully");

    let address = await Address.findOne({ userId: user._id });
    if (!address) {
      address = new Address({
        userId: user._id,
        addresses: [],
      });
      await address.save();
    }
    console.log("address set successfully");

    return res.redirect("/");

  })(req, res, next);
};


module.exports.myAccountSettings = async (req, res) => {
  try {
    const category = await CategoryModel.find();
    const user = req.user;
    const orders = await Order.findOne({ userId: user });
    const address = await Address.findOne({ userId: user });
    const route = {
      home: "home",
      mainroute: "accountsettings",
      title: "Account Settings",
      side: "Account Settings",
    };

    res.render("user/accountSettings", { category, route, orders, address });
  } catch (error) {
    console.error("Error fetching categories for account settings:", error);

    res.status(500).send("An error occurred while fetching account settings.");
  }
};

module.exports.myAccountSettings = async (req, res) => {
  try {
    const category = await CategoryModel.find();
    const user = req.user;
    const orders = await Order.findOne({ userId: user });
    const address = await Address.findOne({ userId: user });
    const route = {
      home: "home",
      mainroute: "accountsettings",
      title: "Account Settings",
      side: "Account Settings",
    };

    res.render("user/accountSettings", { category, route, orders, address });
  } catch (error) {
    console.error("Error fetching categories for account settings:", error);

    res.status(500).send("An error occurred while fetching account settings.");
  }
};

module.exports.aboutUsGet = async (req, res) => {
  try {
    const category = await CategoryModel.find();
    res.render("user/aboutUs", { category });
  } catch (error) {
    console.error("Error fetching categories for account settings:", error);

    res.status(500).send("An error occurred while fetching category details.");
  }
};

module.exports.myDetailsedit = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user });
    const category = await categoiesFind();

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

    res.render("user/editDetails", { user, route, category });
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

    if (!name) {
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

    res
      .status(200)
      .json({ message: "Details updated successfully.", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports.AddressGet = async (req, res) => {
  const userId = req.user;
  const id = req.query.id;
  const category = await categoiesFind();
  const address = await Address.findOne({ userId });
  const route = {
    home: "home",
    accountsettings: "accountsettings",
    mainroute: "address",
    title: "Address",
    side: "Address",
  };
  res.render("user/address", { category, route, address });
};

module.exports.AddAddressGet = async (req, res) => {
  const category = await categoiesFind();
  const route = {
    home: "home",
    subroute: "address",
    mainroute: "addaddress",
    accountsettings: "accountsettings",
    title: "AddAddress",
    side: "Address",
  };
  res.render("user/addAddress", { category, route });
};

module.exports.ordersView = async (req, res) => {
  try {
    const category = await categoiesFind();
    const orders = await Order.find({ userId: req.user }).sort({
      createdAt: -1,
    }); // Added `await`
    const route = {
      home: "home",
      mainroute: "orders",
      accountsettings: "accountsettings",
      title: "Orders",
      side: "Orders",
    };

    res.render("user/ordersView", { category, route, orders }); // Passing corrected data
  } catch (error) {
    console.error("Error in ordersView:", error);
    res.status(500).send("Internal Server Error"); // Graceful error handling
  }
};

module.exports.ordersViewDetails = async (req, res) => {
  const orderId = req.params.id;
  const type = req.query.type;

  try {
    const category = await categoiesFind();

    if (type && type.includes("Payment Pending")) {
      const pendingOrder = await PendingOrders.findOne({
        _id: orderId,
      }).populate("items.productId");

      if (!pendingOrder) {
        return res.status(404).send("Pending order not found");
      }

      const route = {
        home: "home",
        mainroute: "orderdetails",
        subroute: "orders",
        accountsettings: "accountsettings",
        title: "OrdersDetails",
        side: "Orders",
      };

      const razorpaykey = process.env.RAZORPAY_KEY_ID;

      const pendingOrderObj = pendingOrder.toObject();
      pendingOrderObj.keyid = razorpaykey;

      return res.render("user/orderDetaiilsManagement", {
        category,
        route,
        order: pendingOrderObj,
      });
    }

    const order = await Order.findOne({ _id: orderId }).populate(
      "items.productId"
    );

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const route = {
      home: "home",
      mainroute: "orderdetails",
      subroute: "orders",
      accountsettings: "accountsettings",
      title: "OrdersDetails",
      side: "Orders",
    };

    res.render("user/orderDetaiilsManagement", {
      category,
      route,
      order,
    });
  } catch (error) {
    console.error("Error in ordersViewDetails:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.AddAddressGetPost = async (req, res) => {
  const address = req.body;

  const userId = req.user;

  if (!userId || !address) {
    return res
      .status(400)
      .json({ message: "User ID and address details are required." });
  }

  try {
    let userAddress = await Address.findOne({ userId });

    if (!userAddress) {
      userAddress = new Address({ userId, addresses: [address] });
    } else {
      if (userAddress.addresses.length >= 5) {
        return res
          .status(400)
          .json({ message: "You can only have a maximum of 5 addresses." });
      }
      userAddress.addresses.push(address);
    }

    await userAddress.save();
    res
      .status(200)
      .json({ message: "Address added successfully.", userAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

module.exports.AddressEditPost = async (req, res) => {
  const addressId = req.params.id;
  const userId = req.user;
  const updatedAddress = req.body;

  try {
    if (!userId || !addressId || !updatedAddress) {
      return res.status(400).json({
        error: "User ID, address ID, and address details are required.",
      });
    }

    const userAddress = await Address.findOne({ userId });

    if (!userAddress) {
      return res
        .status(404)
        .json({ error: "Address document not found for this user." });
    }

    const existingAddress = userAddress.addresses.find(
      (addr) => addr._id.toString() === addressId
    );

    if (!existingAddress) {
      return res
        .status(404)
        .json({ error: "Address with the given ID not found." });
    }

    // Update fields
    existingAddress.name = updatedAddress.name || existingAddress.name;
    existingAddress.address = updatedAddress.address || existingAddress.address;
    existingAddress.addressline =
      updatedAddress.addressline || existingAddress.addressline;
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

    res
      .status(200)
      .json({ message: "Address updated successfully.", userAddress });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

module.exports.AddressEditGet = async (req, res) => {
  const { id: addressId } = req.params;
  const userId = req.user;

  try {
    if (!userId || !addressId) {
      return res
        .status(400)
        .json({ error: "User ID and Address ID are required." });
    }

    const userAddress = await Address.findOne({ userId });

    if (!userAddress) {
      return res
        .status(404)
        .json({ error: "Address document not found for this user." });
    }

    const address = userAddress.addresses.find(
      (addr) => addr._id.toString() === addressId
    );

    if (!address) {
      return res
        .status(404)
        .json({ error: "Address with the given ID not found." });
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

module.exports.AddressDelete = async (req, res) => {
  try {
    const user = req.user;
    const addressId = req.params.id;

    const userAddress = await Address.findOne({ userId: user });

    if (!userAddress) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressIndex = userAddress.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );

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
};

//checkout

module.exports.checkOut = async (req, res) => {
  try {
    const userId = req.user;

    const address = await Address.findOne({ userId });

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    const coupons = await CouponModel.find({ status: "active" });

    res.render("user/checkOut", { address, cart, coupons });
  } catch (error) {
    console.error("Error fetching checkout data:", error);
    res.status(500).send("An error occurred while fetching the checkout data.");
  }
};

module.exports.checkOutFetch = async (req, res) => {
  try {
    const user = req.user;
    const cart = await Cart.findOne({ userId: user }).populate(
      "items.productId"
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }

    res.status(200).json({ message: "Cart retrieved successfully", cart });
  } catch (error) {
    console.error("Error in checkout process:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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
      coupponId,
    } = req.body;

    if (!totalAmount || !paymentMethod || !userInfo || !addressId) {
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
        userId: req.user,
        walletId: wallet._id,
        transactionId: `txn-${Date.now()}`,
        type: "DEBIT",
        description: "purchase",
        date: new Date(),
        amount: totalAmount,
      });
      await newWalletTransaction.save();
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
      totalRegularprice: userCart.items.reduce(
        (acc, item) => acc + item.regularprice * item.quantity,
        0
      ),
    });

    if (coupponCode && coupponDiscount && coupponId) {
      newOrder.coupponCode = coupponCode;
      newOrder.coupponDiscount = coupponDiscount;
      newOrder.coupponId = coupponId;
      newOrder.coupponUsed = true;
      const coupon = await CouponModel.findById(coupponId);

      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
      if (!coupon.noUsageLimit && coupon.usageLimit > 0) {
        coupon.usageLimit -= 1;
      }
      coupon.usedBy.push(req.user);
      await coupon.save();
    }

    for (const item of userCart.items) {
      const product = await ProductModel.findById(item.productId);

      if (!product) {
        await newOrder.delete();
        return res.status(404).json({
          error: `Product not found: ${item.productname || "Unknown Product"}`,
        });
      }

      if (product.stock < item.quantity) {
        await newOrder.delete();
        return res.status(400).json({
          error: `Insufficient stock for product: ${product.productname}`,
        });
      }

      product.stock -= item.quantity;
      product.sales += item.quantity;
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

//referal
module.exports.inviteaFriend = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user });
    const category = await categoiesFind();
    const token = generateReferralToken(req.user);

    if (!user) {
      return res.status(404).render("error", {
        message: "User not found",
        status: 404,
      });
    }

    const route = {
      home: "home",
      mainroute: "inviteafriend",
      accountsettings: "accountsettings",
      title: "Invite a friend",
      side: "Invite a friend",
    };

    res.render("user/referral", { user, route, category, token });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).render("error", {
      message: "An error occurred while fetching user details",
      status: 500,
    });
  }
};
