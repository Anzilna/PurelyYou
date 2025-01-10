const { User,Otp,Order,Favourite,walletTransaction,Wallet,Cart,Address} = require("../../model/usermodel");
const { AdminModel,CategoryModel,ProductModel ,CouponModel} = require("../../model/adminmodel");


module.exports.adminOrdersFetchGet = async (req, res) => {
  console.log("Fetching orders with pagination...");

  const page = parseInt(req.query.page) || 1; 
  const limit = parseInt(req.query.limit) || 6; 
  const skip = (page - 1) * limit; 

  try {
      const orders = await Order.find()
          .sort({ updatedAt: -1 }) 
          .skip(skip) 
          .limit(limit);

      const totalOrders = await Order.countDocuments();

      const totalPages = Math.ceil(totalOrders / limit);
      const hasNextPage = page < totalPages;

      res.status(200).json({
          orders,
          totalOrders,
          currentPage: page,
          totalPages,
          hasNextPage,
      });
  } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders." });
  }
};


 
module.exports.adminCouponFetch = async (req, res) => {
  try {
    const coupons = await CouponModel.find();

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({ message: 'No coupons found' });
    }

    return res.status(200).json({ coupons });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};


  module.exports.adminAddCouponFetch = async (req, res) => {
    try {
      const {
        couponCode,
        discountPercentage,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        eligibilityCriteria,
        description,
        usageLimit,
        noUsageLimit
      } = req.body;
  
      const formattedCouponCode = couponCode.toUpperCase();
  
      const parsedDiscountPercentage = Number(discountPercentage);
      const parsedMinAmount = Number(minAmount);
      const parsedMaxAmount = Number(maxAmount);
      const parsedUsageLimit = usageLimit ? Number(usageLimit) : null;
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
  
      if (parsedStartDate >= parsedEndDate) {
        return res.status(400).json({ error: 'End date must be later than start date.' });
      }
  
      const couponData = {
        couponCode: formattedCouponCode,
        discountPercentage: parsedDiscountPercentage,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        minAmount: parsedMinAmount,
        maxAmount: parsedMaxAmount,
        eligibilityCriteria,
        description,
        usageLimit: noUsageLimit ? null : parsedUsageLimit, 
        noUsageLimit: noUsageLimit,
      };
  
      const newCoupon = new CouponModel(couponData);
      await newCoupon.save();
      res.json({ saved: true, coupon: newCoupon });
    } catch (error) {
      console.error('Error while creating coupon:', error);
      res.status(500).json({ error: 'An error occurred while creating the coupon.' });
    }  
  };


  module.exports.adminEditCoupon  = async (req, res) => {
  console.log(req.body);

  try {
    const  couponId  = req.params.id;  
    const {
      couponCode,
      discountPercentage,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      eligibilityCriteria,
      description,
      usageLimit,
      noUsageLimit,
    } = req.body;

    const coupon = await CouponModel.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    if (discountPercentage < 1 || discountPercentage > 100) {
      return res.status(400).json({ error: 'Discount percentage must be between 1 and 100' });
    }
    const parsedUsageLimit = usageLimit ? Number(usageLimit) : null;

    coupon.couponCode = couponCode || coupon.couponCode;
    coupon.discountPercentage = discountPercentage || coupon.discountPercentage;
    coupon.startDate = new Date(startDate) || coupon.startDate;
    coupon.endDate = new Date(endDate) || coupon.endDate;
    coupon.minAmount = minAmount || coupon.minAmount;
    coupon.maxAmount = maxAmount || coupon.maxAmount;
    coupon.eligibilityCriteria = eligibilityCriteria || coupon.eligibilityCriteria;
    coupon.description = description || coupon.description;
    coupon.usageLimit = noUsageLimit ? null : parsedUsageLimit, 
    coupon.noUsageLimit = noUsageLimit;

    await coupon.save();

    return res.status(200).json({ success: true, message: 'Coupon updated successfully', coupon });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  
  };



  module.exports.updateOrderStatus = async (req, res) => {
    console.log("aff",req.params.id,req.body);
    
    try {
      const orderId = req.params.id;  
      const { status } = req.body;
      const validStatuses = ['Processing', 'Dispatched', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
  
      const order = await Order.findById(orderId).populate('items.productId');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      order.orderstatus = status;
      await order.save(); 
  
      return res.status(200).json({
        message: 'Order status updated successfully',
        order, 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };