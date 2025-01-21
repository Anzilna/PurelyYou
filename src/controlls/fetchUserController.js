const { date } = require("zod");
const PDFDocument = require('pdfkit'); 
const generateInvoicePdf = require('../functions/invoicePdf')
const walletFunction = require('../functions/walletTransaction')
const {
  CategoryModel,
  ProductModel,
  CouponModel,
} = require("../../model/adminmodel");
const {
  User,
  Otp,
  Order,
  Favourite,
  walletTransaction,
  Wallet,
  Cart,
  Address,
  Return,
  PendingOrders
} = require("../../model/usermodel");
const {
  walletTransactionValidation,
  walletValidation,
} = require("../functions/zodUserValidation");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

async function categoiesFind() {
  try {
    const category = await CategoryModel.find({ isActive: true });
    return category;
  } catch (error) {
    console.log(error);
  }
}

module.exports.favouritesFetchGet = async (req, res) => {
  console.log("working 2");

  try {
    const userId = req.user;

    const userFavourites = await Favourite.findOne({ userId }).populate(
      "items.productId"
    );

    if (!userFavourites) {
      return res
        .status(404)
        .json({ message: "No favourites found for this user." });
    }
    console.log("working", userFavourites);

    return res.status(200).json({ favourites: userFavourites });
  } catch (error) {
    console.error("Error fetching favourites:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to fetch favourites. Please try again later." });
  }
};

module.exports.favouritesRemoveFetch = async (req, res) => {
  const { productId } = req.body;

  try {
    const userId = req.user;

    const userFavourites = await Favourite.findOne({ userId });

    if (!userFavourites) {
      return res
        .status(404)
        .json({ message: "No favorites found for this user." });
    }

    const productIndex = userFavourites.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in favorites." });
    }

    userFavourites.items.splice(productIndex, 1);

    await userFavourites.save();

    return res
      .status(200)
      .json({
        message: "Product removed from favorites.",
        favourites: userFavourites,
      });
  } catch (error) {
    console.error("Error removing product from favorites:", error.message);
    return res
      .status(500)
      .json({
        error:
          "Failed to remove product from favorites. Please try again later.",
      });
  }
};

module.exports.viewallproductsFilter = async (req, res) => {
  const { sortBy, categories, search, page = 1, limit  } = req.body; 

  try {
    const category = await categoiesFind(); // Fetch all categories

    // Initialize the query
    let query = { isListed: true };

    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }

    if (search && search.trim()) {
      query.productname = { $regex: search.trim(), $options: "i" };
    }

    console.log("Query Object:", query,limit);

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Base query to fetch products
    let productsQuery = ProductModel.find(query)
      .populate({ path: "category", match: { isActive: true } }) // Only include active categories
      .skip(skip) // Skip documents for pagination
      .limit(limit) // Limit the number of results per page
      .lean();

    // Apply sorting
    if (sortBy === "low-to-high") {
      productsQuery = productsQuery.sort({ saleprice: 1 });
    } else if (sortBy === "high-to-low") {
      productsQuery = productsQuery.sort({ saleprice: -1 });
    }

    // Execute query
    const products = await productsQuery;
    const totalProducts = await ProductModel.countDocuments(query); // Count total products matching the query
    const Pages = Math.ceil(totalProducts / limit);

    console.log(`Total Products: ${totalProducts} Total Pages: ${Pages} Fetched Products Count: ${products.length}`);

    res.json({ categories: category, products, totalProducts, Pages });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products." });
  }
};


module.exports.walletAddMoneyFetchGet = async (req, res) => {
  try {
    console.log("Incoming Request Body:", req.body);

    const user = req.user;
    const { amount, description, type } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
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
      userId: user,
      description,
      date: new Date(),
    };

    const newTransaction = new walletTransaction(transaction);
    await newTransaction.save();

    return res.status(200).json({
      message: "Money added successfully",
      wallet,
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("Error adding money to wallet:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports.walletFetchGet = async (req, res) => {
  try {
    const category = await CategoryModel.find({isActive:true});

    const route = {
      home: "home",
      mainroute: "wallet",
      accountsettings: "accountsettings",
      title: "Wallet",
      side: "Wallet",
    };

    res.render("user/walletDetails", {
      category,
      route,
    });
  } catch (error) {
    console.error("Error in ordersViewDetails:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.walletDetailsFetchGet = async (req, res) => {
  try {
    console.log("Fetching wallet details...");

    let wallet = await Wallet.findOne({ userId: req.user });

    if (!wallet) {
      console.log("Wallet not found, creating a new one...");
      wallet = new Wallet({
        userId: req.user,
        balance: 0,
      });
      await wallet.save();
    }

    // Get page and limit from the query parameters, default to page 1 and 10 items per page
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the skip value (for pagination)
    const skip = (page - 1) * limit;

    // Get the transactions for the specific page and limit
    const transactions = await walletTransaction
      .find({ walletId: wallet._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Get the total count of transactions to calculate total pages
    const totalTransactions = await walletTransaction.countDocuments({
      walletId: wallet._id,
    });

    // Calculate total number of pages
    const totalPages = Math.ceil(totalTransactions / limit);
    console.log(totalPages, page);

    return res.status(200).json({
      balance: wallet.balance,
      transactions: transactions,
      totalPages: totalPages, 
      currentPage: page,     
    });
  } catch (error) {
    console.error("Error fetching wallet details:", error);
    return res.status(500).json({ message: "Internal server error" });
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
      status: "active",
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive coupon code.",
      });
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired or is not valid yet.",
      });
    }

    const userAlreadyUsed = coupon.usedBy.includes(userId);
    if (userAlreadyUsed) {
      return res.status(400).json({
        success: false,
        message: "You have already used this coupon.",
      });
    }

    if (!coupon.noUsageLimit && coupon.usedBy.length >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit.",
      });
    }

    let discountAmount = (finalAmount * coupon.discountPercentage) / 100;
    console.log("Calculated Discount Amount:", discountAmount);

    if (discountAmount > coupon.maxAmount) {
      console.log(
        "Discount amount exceeds max amount. Adjusting to max amount."
      );
      discountAmount = coupon.maxAmount;
    }

    console.log("2 nd discountvalue", discountAmount);

    let discountedAmount = finalAmount - discountAmount;

    console.log("Discounted Amount:", discountedAmount);

    if (finalAmount < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Cart total after discount must be at least ${coupon.minAmount}.`,
      });
    }

    const reductionAmount = finalAmount - discountedAmount;

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully!",
      originalAmount: finalAmount,
      discountedAmount: Math.round(discountedAmount),
      reductionAmount: Math.round(reductionAmount),
      couponCode: coupon.couponCode,
      couponId: coupon._id,
      discountPercentage: coupon.discountPercentage,
      description: coupon.description,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
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
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.razorpayCreateOrder = async (req, res) => {
  console.log("Creating Razorpay order...");
    const { amount, currency, orderData } = req.body;
    const type = req.query.type;   


    try {


      if (type && type.includes("pending")) {

        const pendingId = `PND${Date.now()}`;


        const razorpayOrder = await razorpay.orders.create({
          amount: amount * 100, 
          currency: currency || "INR",
          receipt: `receipt_${pendingId}`,
        });

        console.log(type, "type","doene",razorpayOrder);

        return res.status(200).json({
          message: "Razorpay order created successfully",
          razorpayOrder,
          key_id: process.env.RAZORPAY_KEY_ID, 
        });
      }


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
      } = orderData;

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
      const pendingId = `PND${Date.now()}`;


      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100, 
        currency: currency || "INR",
        receipt: `receipt_${pendingId}`,
      });

      console.log("Razorpay Order Created:", razorpayOrder);


      const newOrder = new PendingOrders({
        userId: req.user,
        totalAmount,
        totalDiscount,
        deliveryCharge,
        username: userInfo.username,
        email: userInfo.email,
        code: pendingId,
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
        razorPayOrderId:razorpayOrder.id
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
        await product.save();
      }

      await newOrder.save();

      // Create Razorpay order
      

      return res.status(200).json({
        message: "Razorpay order created successfully",
        razorpayOrder,
        pendingOrder: newOrder,
        key_id: process.env.RAZORPAY_KEY_ID, 
      });
    } catch (error) {
      console.error("Error saving order or creating Razorpay order:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
 
};

module.exports.razorpayPaymentVerify = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pendingOrderId } = req.body;
  // const {
  //   totalAmount,
  //   totalDiscount,
  //   deliveryCharge,
  //   paymentMethod,
  //   userInfo,
  //   addressId,
  //   coupponCode,
  //   coupponDiscount,
  //   coupponId,
  // } = orderData;

  
  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      console.log("Payment verified successfully:", req.body);

      const pendingOrder = await PendingOrders.findById(pendingOrderId);
      console.log("lll");

      if (!pendingOrder) {
        return res.status(404).json({ error: "Pending order not found" });
      }
      console.log("lll");


      const { username , email , selectedAddress , totalAmount, totalDiscount, deliveryCharge, items , coupponCode , coupponDiscount , coupponId } = pendingOrder;

    
      if (!selectedAddress) {
        return res.status(404).json({ error: "Selected address not found" });
      }

      const orderCode = `ORD${Date.now()}`;
      const newOrder = new Order({
        userId: req.user,
        totalAmount,
        totalDiscount,
        deliveryCharge,
        username: username,
        email: email,
        code: orderCode,
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
        paymentMethod: "Razorpay",
        paymentStatus: "Paid",
        walletUsedAmount: 0,
        items,
        totalRegularprice: items.reduce(
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


      for (const item of newOrder.items) {
        const product = await ProductModel.findById(item.productId);
  
        if (!product) {
          await newOrder.delete();
          return res
            .status(404)
            .json({
              error: `Product not found: ${
                item.productname || "Unknown Product"
              }`,
            });
        }
  
        if (product.stock < item.quantity) {
          await newOrder.delete();
          return res
            .status(400)
            .json({
              error: `Insufficient stock for product: ${product.productname}`,
            });
        }
  
        product.stock -= item.quantity;
        product.sales += item.quantity;
        await product.save();
      }


      await PendingOrders.findByIdAndDelete(pendingOrderId);
      console.log("lll");

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


      
      console.log("Order saved as Paid:", newOrder);

      return res.status(200).json({
        success: true,
        message: "Payment verified and order created successfully!",
        order: newOrder,
      });
    } else {
      console.error("Payment verification failed: Invalid signature");
      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};



module.exports.ordersReturnPost = async (req, res) => {
  console.log(req.body);

  const {
    returnReason,
    name,
    phone,
    address,
    quantity,
    city,
    pincode,
    amount,
    state,
    email,
    productId,
    orderId,
  } = req.body;

  if (
    !returnReason ||
    !name ||
    !phone ||
    !address ||
    !quantity ||
    !amount ||
    !city ||
    !pincode ||
    !state ||
    !email ||
    !productId ||
    !orderId
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  console.log(productId, "is iddddd");

  try {
    const order = await Order.findById(orderId).populate("items.productId");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    console.log(productId, "is iddddd");

    const item = order.items.find(
      (item) => item.productId._id.toString() === productId
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    item.returnRequest = true;
    item.returnStatus = "Pending";
    console.log(productId, "is iddddd");

    await order.save();
    console.log(productId, "is iddddd");

    const returnRequest = new Return({
      reason: returnReason,
      userId: req.user,
      orderId: orderId,
      productId: productId,
      amount: amount,
      quantity: quantity,
      pickupAddress: {
        name: name,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        phone: phone,
      },
    });

    const savedReturnRequest = await returnRequest.save();
    console.log(productId, "is iddddd");

    return res
      .status(200)
      .json({
        done: true,
        message: "Return request submitted successfully",
        return: savedReturnRequest,
        order,
      });
  } catch (error) {
    console.error("Error submitting return request:", error);
    res
      .status(500)
      .json({
        message: "An error occurred while submitting your return request.",
      });
  }
};
module.exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { paymentMethod } = req.body;

    const order = await Order.findById(orderId).populate("items.productId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.orderstatus === "Cancelled") {
      return res.status(400).json({ error: "Order has already been cancelled" });
    }

    if (paymentMethod.includes("Razorpay") || paymentMethod.includes("Wallet") ) {
      const refundResult = await walletFunction.walletTransaction(
        order.totalAmount,
        "CREDIT",
        `Refund for cancelled order ${order.code}`,
        req.user
      );

      if (!refundResult.success) {
        return res.status(400).json({ error: refundResult.message });
      }
    }

    order.orderstatus = "Cancelled";
    await order.save();

    return res.json({
      message: "Order cancelled successfully",
      order: order,
    });
  } catch (error) {
    console.error("Error canceling order:", error);
    return res.status(500).json({ error: "Failed to cancel the order" });
  }
};

module.exports.orderInvoice = async (req, res) => {
  const orderId = req.params.id;
console.log("here");

  try {
    const order = await Order.findById(orderId).populate('items.productId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const invoicePdf = await generateInvoicePdf(order);
console.log(invoicePdf);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.code}.pdf`);

    res.send(invoicePdf);
    
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
};



module.exports.pendingOrders = async (req, res) => {
  try {
    const userId = req.user; // Assuming `req.user` contains the authenticated user's ID

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const pendingOrders = await PendingOrders.find({ userId, paymentStatus: "Pending" });

    if (!pendingOrders || pendingOrders.length === 0) {
      return res.status(404).json({ message: "No pending orders found" });
    }

    return res.status(200).json({ orders: pendingOrders });
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};