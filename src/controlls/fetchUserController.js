const { date } = require("zod");
const { CategoryModel, CouponModel } = require("../../model/adminmodel");
const { User,Otp,Order,Favourite,walletTransaction,Wallet,Cart,Address} = require("../../model/usermodel");
const {walletTransactionValidation,walletValidation} = require('../functions/zodUserValidation')
const razorpay = require('../config/razorpay')
const crypto = require('crypto');

module.exports.favouritesFetchGet = async (req, res) => {
    console.log("working 2");

    try {
      const userId = req.user;
  
      const userFavourites = await Favourite.findOne({ userId }).populate('items.productId')
  
      if (!userFavourites) {
        return res.status(404).json({ message: "No favourites found for this user." });
      }
  console.log("working",userFavourites);
  
      return res.status(200).json({ favourites: userFavourites });
  
    } catch (error) {
      console.error("Error fetching favourites:", error.message);
      return res.status(500).json({ error: "Failed to fetch favourites. Please try again later." });
    }
  };

module.exports.favouritesRemoveFetch = async (req, res) => {
  const { productId } = req.body;

  try {
    const userId = req.user;

    const userFavourites = await Favourite.findOne({ userId });

    if (!userFavourites) {
      return res.status(404).json({ message: "No favorites found for this user." });
    }

    const productIndex = userFavourites.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in favorites." });
    }

    userFavourites.items.splice(productIndex, 1);

    await userFavourites.save();

    return res.status(200).json({ message: "Product removed from favorites.", favourites: userFavourites });
  } catch (error) {
    console.error("Error removing product from favorites:", error.message);
    return res.status(500).json({ error: "Failed to remove product from favorites. Please try again later." });
  }
};



module.exports.walletAddMoneyFetchGet = async (req, res) => {
  try {
    console.log("Incoming Request Body:", req.body);

    const user = req.user;
    const { amount, description, type } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    let wallet = await Wallet.findOne({ userId: user });

    if (!wallet) {
      wallet = new Wallet({
        userId: user,
        balance: amount,
      });
      console.log("Created new wallet for user:", user);
    } else {
      wallet.balance += amount;
      console.log("Added money to existing wallet for user:", user);
    }

    await wallet.save();

    const transaction = {
      transactionId: `txn-${Date.now()}`,
      walletId: wallet._id, 
      type,
      amount,
      userId:user,
      description,
      date: new Date(),
    };

    const newTransaction = new walletTransaction(transaction);
    await newTransaction.save();

    return res.status(200).json({
      message: 'Money added successfully',
      wallet,
      transaction: newTransaction,
    });
  } catch (error) {
    console.error('Error adding money to wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

    

 module.exports.walletFetchGet = async (req, res) => {
  try {
    const category = await CategoryModel.find(); 

    const route = {
      home: "home",
      mainroute: "wallet",
      accountsettings: "accountsettings",
      title: "Wallet",
      side: "Wallet"
    };

    res.render('user/walletDetails', { 
      category, 
      route 
    });

  } catch (error) {
    console.error("Error in ordersViewDetails:", error);
    res.status(500).send("Internal Server Error"); 
  }
    };
    
    
    module.exports.walletDetailsFetchGet = async (req, res) => {
      try {
        console.log("Fetching wallet details...");
    
        const wallet = await Wallet.findOne({ userId: req.user });
    
        if (!wallet) {
          return res.status(404).json({ message: 'Wallet not found' });
        }
    
        const transactions = await walletTransaction.find({ walletId: wallet._id }).sort({date:-1});
    
        return res.status(200).json({
          balance: wallet.balance,
          transactions: transactions,
        });
      } catch (error) {
        console.error('Error fetching wallet details:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    };
    
//couppon apply
    module.exports.CoupponApply = async (req, res) => {
      const { couponCode, finalAmount } = req.body;
      const userId = req.user;
    
      console.log(req.body);
    
      try {
        const coupon = await CouponModel.findOne({
          couponCode: couponCode.toUpperCase(),
          status: 'active',
        });
    
        if (!coupon) {
          return res.status(404).json({
            success: false,
            message: 'Invalid or inactive coupon code.',
          });
        }
    
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
          return res.status(400).json({
            success: false,
            message: 'Coupon has expired or is not valid yet.',
          });
        }
    
        const userAlreadyUsed = coupon.usedBy.includes(userId);
        if (userAlreadyUsed) {
          return res.status(400).json({
            success: false,
            message: 'You have already used this coupon.',
          });
        }
    
        if (!coupon.noUsageLimit && coupon.usedBy.length >= coupon.usageLimit) {
          return res.status(400).json({
            success: false,
            message: 'This coupon has reached its usage limit.',
          });
        }
    
        let discountAmount = (finalAmount * coupon.discountPercentage) / 100;
        console.log('Calculated Discount Amount:', discountAmount);
    
        if (discountAmount > coupon.maxAmount) {
          console.log('Discount amount exceeds max amount. Adjusting to max amount.');
          discountAmount = coupon.maxAmount;
        }
    
        console.log("2 nd discountvalue",discountAmount);
        
        let discountedAmount = finalAmount - discountAmount;
    
        console.log('Discounted Amount:', discountedAmount);
    
        if (finalAmount < coupon.minAmount) {
          return res.status(400).json({
            success: false,
            message: `Cart total after discount must be at least ${coupon.minAmount}.`,
          });
        }
    
        const reductionAmount = finalAmount - discountedAmount;
    
        return res.status(200).json({
          success: true,
          message: 'Coupon applied successfully!',
          originalAmount: finalAmount,
          discountedAmount: Math.round(discountedAmount), 
          reductionAmount: Math.round(reductionAmount),
          couponCode: coupon.couponCode,
          couponId:coupon._id,
          discountPercentage: coupon.discountPercentage,
          description: coupon.description,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: 'Server error. Please try again later.',
        });
      }
    };
    


    module.exports.orderPlacedSuccessDetails = async (req, res) => {
      try {
        const orderId = req.params.id;
    console.log("orderPlacedSuccessDetails working");
    
        const order = await Order.findById(orderId);
    console.log(order);
    
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }
    
        res.json({order});
      } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Server error' });
      }

    };




    
    module.exports.razorpayCreateOrder = async (req, res) => {
     console.log("order create razorpay");
     
      try {
        const { amount, currency } = req.body;

        const order = await razorpay.orders.create({
            amount: amount * 100, 
            currency: currency || 'INR',
            receipt: `receipt_${Date.now()}`,
        });

        console.log('Razorpay Order Created:', order);
        res.status(200).json({order,     
         key_id: process.env.RAZORPAY_KEY_ID, 
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Failed to create Razorpay order' });
    }

    };



    module.exports.razorpayPaymentVerify = async (req, res) => {
     
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      try {
          const generatedSignature = crypto
              .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
              .update(`${razorpay_order_id}|${razorpay_payment_id}`)
              .digest('hex');
  
          if (generatedSignature === razorpay_signature) {
            console.log("verified");
            
              console.log('Payment verified successfully:', req.body);
              res.status(200).json({ success: true, message: 'Payment verified successfully!' });
          } else {
              console.error('Payment verification failed: Invalid signature');
              res.status(400).json({ success: false, message: 'Invalid signature!' });
          }
      } catch (error) {
          console.error('Error verifying payment:', error);
          res.status(500).json({ success: false, message: 'Something went wrong!' });
      }
     };
 
