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
} = require("../../model/usermodel");
const {
  AdminModel,
  CategoryModel,
  ProductModel,
  CouponModel,
  OfferModel,
} = require("../../model/adminmodel");
const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");
const fs = require("fs");

module.exports.adminOrdersFetchGet = async (req, res) => {
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
    const coupons = await CouponModel.find().sort({ updatedAt: -1 });

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({ message: "No coupons found" });
    }

    return res.status(200).json({ coupons });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
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
      noUsageLimit,
    } = req.body;

    const formattedCouponCode = couponCode.toUpperCase();

    const existingCoupon = await CouponModel.findOne({
      couponCode: formattedCouponCode,
    });
    if (existingCoupon) {
      return res.status(400).json({
        error: "Coupon code must be unique. This coupon already exists.",
      });
    }

    const parsedDiscountPercentage = Number(discountPercentage);
    const parsedMinAmount = Number(minAmount);
    const parsedMaxAmount = Number(maxAmount);
    const parsedUsageLimit = usageLimit ? Number(usageLimit) : null;
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (parsedStartDate >= parsedEndDate) {
      return res
        .status(400)
        .json({ error: "End date must be later than start date." });
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
    console.error("Error while creating coupon:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the coupon." });
  }
};

module.exports.adminEditCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
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
      status,
    } = req.body;

    const coupon = await CouponModel.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    if (discountPercentage < 1 || discountPercentage > 100) {
      return res
        .status(400)
        .json({ error: "Discount percentage must be between 1 and 100" });
    }

    const validStatuses = ["active", "inactive"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status value. Allowed values: active, inactive",
      });
    }

    const parsedUsageLimit = usageLimit ? Number(usageLimit) : null;

    coupon.couponCode = couponCode || coupon.couponCode;
    coupon.discountPercentage = discountPercentage || coupon.discountPercentage;
    coupon.startDate = new Date(startDate) || coupon.startDate;
    coupon.endDate = new Date(endDate) || coupon.endDate;
    coupon.minAmount = minAmount || coupon.minAmount;
    coupon.maxAmount = maxAmount || coupon.maxAmount;
    coupon.eligibilityCriteria =
      eligibilityCriteria || coupon.eligibilityCriteria;
    coupon.description = description || coupon.description;
    coupon.usageLimit = noUsageLimit ? null : parsedUsageLimit;
    coupon.noUsageLimit = noUsageLimit;
    coupon.status = status;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const validStatuses = [
      "Processing",
      "Dispatched",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId).populate("items.productId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderstatus = status;
    await order.save();

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.adminReturnsFetch = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;

    const totalReturns = await Return.countDocuments();

    const returns = await Return.find()
      .populate("productId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    if (!returns || returns.length === 0) {
      return res.status(200).json({
        returns,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReturns / limit),
        hasNextPage: false,
      });
    }

    const hasNextPage = page * limit < totalReturns;

    return res.status(200).json({
      returns,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReturns / limit),
      hasNextPage,
    });
  } catch (error) {
    console.error("Error fetching return requests:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.updateReturnStatus = async (req, res) => {
  try {
    const { status, orderId, userId, returnId, amount, quantity } = req.body;

    const validStatuses = ["Pending", "Approved", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const returnRequest = await Return.findById(returnId).populate("productId");

    if (!returnRequest) {
      return res.status(404).json({ message: "Return request not found." });
    }

    if (returnRequest.status !== "Pending") {
      return res.status(400).json({
        message: "Cannot update status. The request is already processed.",
      });
    }

    if (status === "Approved") {
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        wallet = new Wallet({
          userId,
          balance: 0,
        });
        await wallet.save();
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found." });
      }

      // let couponShare = 0;

      // if (order.coupponUsed) {
      //   const totalItems = order.items.reduce(
      //     (sum, item) => sum + item.quantity,
      //     0
      //   );
      //   if (totalItems > 0) {
      //     couponShare = (order.coupponDiscount / totalItems) * quantity;
      //   }
      // }

      // const adjustedAmount = amount - couponShare;
      wallet.balance += Number(amount);
      await wallet.save();

      const newWalletTransaction = new walletTransaction({
        walletId: wallet._id,
        userId: userId,
        transactionId: `txn-${Date.now()}`,
        type: "CREDIT",
        amount: amount,
        description: "Return approved. Credit added.",
      });
      await newWalletTransaction.save();

      const product = await ProductModel.findById(returnRequest.productId._id);

      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }

      product.stock += Number(quantity);
      product.sales -= Number(quantity);
      await product.save();

      returnRequest.status = "Approved";

      await returnRequest.save();

      // Update the order total and item details
      const item = order.items.find(
        (item) =>
          item.productId.toString() === returnRequest.productId._id.toString()
      );

      if (item) {
      
        item.returnStatus = "Approved";
        item.returnApproved = true;
        order.GrandtotalAmount -= amount*quantity
        await order.save();
      }

      return res.status(200).json({
        message:
          "Return status updated successfully. Wallet credited and product stock updated.",
        returnRequest,
      });
    } else {
      returnRequest.status = status;
      await returnRequest.save();

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found." });
      }

      const item = order.items.find(
        (item) =>
          item.productId.toString() === returnRequest.productId._id.toString()
      );

      if (item) {
        item.returnStatus = status;

        await order.save();
      }

      res.status(200).json({
        message: "Return status updated successfully.",
        returnRequest,
      });
    }
  } catch (error) {
    console.error("Error updating return status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.adminSalesFetch = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const now = new Date();

    // Initialize Filters
    let dateFilter = { orderstatus: "Delivered" };
    let returnFilter = { orderstatus: "Delivered", "items.returnApproved": true };

    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { $gte: startOfDay, $lte: now };
      returnFilter.createdAt = { $gte: startOfDay, $lte: now };
    } else if (filter === "last7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { $gte: sevenDaysAgo, $lte: now };
      returnFilter.createdAt = { $gte: sevenDaysAgo, $lte: now };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { $gte: start, $lte: end };
      returnFilter.createdAt = { $gte: start, $lte: end };
    }

    // Fetch Orders
    const orders = await Order.find(dateFilter).sort({ createdAt: -1 });

    const filteredOrders = orders.filter(order => {
      return order.items.some(item => item.returnApproved === false);
    });
    
    
    const summary = await Order.aggregate([
      { $match: dateFilter }, // Apply the date filter
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $subtract: ["$GrandtotalAmount", "$deliveryCharge"] }, // Subtract deliveryCharge from GrandtotalAmount for revenue
          }, // Sum the GrandTotal field for revenue
          totalDiscount: { $sum: "$totalDiscount" }, // Sum the totalDiscount field
          totalCouponDiscount: {
            $sum: { $cond: [{ $eq: ["$coupponUsed", true] }, "$coupponDiscount", 0] }, // Sum the coupon discount if coupon is used
          },
          totalDeliveryCharge: { $sum: "$deliveryCharge" }, // Sum the delivery charge
        },
      },
    ]);
        

    
    const totalRegularPrice = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalRegularPrice: { $sum: "$items.regularprice" },
        },
      },
    ]);

    const totalReturnedAmountResult = await Order.aggregate([
      { $match: returnFilter },
      { $unwind: "$items" },
      { $match: { "items.returnApproved": true } },
      {
        $group: {
          _id: null,
          totalReturnedAmount: { $sum: "$items.saleprice" },
        },
      },
    ]);

    const totalReturnedAmount =
      totalReturnedAmountResult.length > 0 ? totalReturnedAmountResult[0].totalReturnedAmount : 0;

    // Final Summary Response
    const summaryData = {
      revenue: summary.length > 0 ? summary[0].totalRevenue : 0,
      totalDiscount: summary.length > 0 ? summary[0].totalDiscount : 0,
      totalCouponDiscount: summary.length > 0 ? summary[0].totalCouponDiscount : 0,
      totalDeliveryCharge: summary.length > 0 ? summary[0].totalDeliveryCharge : 0,
      totalRegularPrice: totalRegularPrice.length > 0 ? totalRegularPrice[0].totalRegularPrice : 0,
      totalReturnedAmount,
      orders:filteredOrders,
    };

    res.status(200).json({ summaryData });
  } catch (error) {
    console.error("Error fetching admin summary:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
};


module.exports.generateExcelReport = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    let dateFilter = { orderstatus: "Delivered" };
    const now = new Date();

    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { $gte: startOfDay, $lte: now };
    } else if (filter === "last7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { $gte: sevenDaysAgo, $lte: now };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { $gte: start, $lte: end };
    }

    const returnFilter = { ...dateFilter };

    let orders = await Order.find(dateFilter).sort({ createdAt: -1 });

    orders = orders.filter(order =>
      order.items.some(item => item.returnApproved !== true)
    );

    const summary = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $subtract: ["$GrandtotalAmount", "$deliveryCharge"] },
          },
          totalDiscounts: { $sum: "$totalDiscount" },
          totalCouponDiscount: {
            $sum: { $cond: [{ $eq: ["$coupponUsed", true] }, "$coupponDiscount", 0] },
          },
          totalDeliveryCharge: { $sum: "$deliveryCharge" },
          totalSales: { $sum: 1 },
        },
      },
    ]);

    // **Total Regular Price Calculation**
    const totalRegularPriceResult = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalRegularPrice: { $sum: "$items.regularprice" },
        },
      },
    ]);
    const totalRegularPrice = totalRegularPriceResult[0]?.totalRegularPrice || 0;

    // **Total Returned Amount Calculation**
    const totalReturnedAmountResult = await Order.aggregate([
      { $match: returnFilter },
      { $unwind: "$items" },
      { $match: { "items.returnApproved": true } },
      {
        $group: {
          _id: null,
          totalReturnedAmount: { $sum: "$items.saleprice" },
        },
      },
    ]);
    const totalReturnedAmount = totalReturnedAmountResult[0]?.totalReturnedAmount || 0;

    // **Unique Customer Count**
    const uniqueCustomers = await Order.distinct("userId", {
      ...dateFilter,
      items: { $elemMatch: { returnApproved: false } },
    });

    const summaryData = {
      sales: summary[0]?.totalSales || 0,
      revenue: summary[0]?.totalRevenue || 0,
      discounts: summary[0]?.totalDiscounts || 0,
      couponDiscounts: summary[0]?.totalCouponDiscount || 0,
      deliveryCharges: summary[0]?.totalDeliveryCharge || 0,
      regularPrice: totalRegularPrice,
      returnedAmount: totalReturnedAmount,
      customers: uniqueCustomers.length,
      orders,
    };

    // **Prepare Excel Data**
    const ws_data = [
      ["Sales Summary"],
      ["Total Sales", summaryData.sales],
      ["Total Revenue", summaryData.revenue.toFixed(2)],
      ["Total Discounts", summaryData.discounts.toFixed(2)],
      ["Total Coupon Discounts", summaryData.couponDiscounts.toFixed(2)],
      ["Total Delivery Charges", summaryData.deliveryCharges.toFixed(2)],
      ["Total Regular Price", summaryData.regularPrice.toFixed(2)],
      ["Total Returned Amount", summaryData.returnedAmount.toFixed(2)],
      ["Unique Customers", summaryData.customers],
      [], // Empty row for spacing
      [
        "Order ID",
        "Customer",
        "Email",
        "Total Amount",
        "Total Discount",
        "Coupon Code",
        "Coupon Discount",
        "Delivery Charge",
        "Order Date",
        "Order Status",
        "Payment Method",
        "Address",
      ],
      ...summaryData.orders.map((order) => [
        order.code || "N/A",
        order.username || "N/A",
        order.email || "N/A",
        order.totalAmount ? order.totalAmount.toFixed(2) : "0.00",
        order.totalDiscount ? order.totalDiscount.toFixed(2) : "0.00",
        order.coupponCode || "N/A",
        order.coupponDiscount ? order.coupponDiscount.toFixed(2) : "0.00",
        order.deliveryCharge ? order.deliveryCharge.toFixed(2) : "0.00",
        order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A",
        order.orderstatus || "N/A",
        order.paymentMethod || "N/A",
        order.selectedAddress
          ? `${order.selectedAddress.name}, ${order.selectedAddress.address}, ${order.selectedAddress.city}, ${order.selectedAddress.state}, ${order.selectedAddress.pincode}`
          : "N/A",
      ]),
    ];

    // **Create and Send Excel File**
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

    const fileName = "sales_report.xlsx";
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.end(XLSX.write(wb, { bookType: "xlsx", type: "buffer" }));
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
};


module.exports.generatePDFReport = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    let dateFilter = { orderstatus: "Delivered" };
    const now = new Date();

    // Handle Date Filters
    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { $gte: startOfDay, $lte: new Date() };
    } else if (filter === "last7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { $gte: sevenDaysAgo, $lte: new Date() };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(dateFilter).sort({ createdAt: -1 });

    const filteredOrders = orders.filter(order => {
      return order.items.some(item => item.returnApproved === false);
    });
    

    // Aggregate summary data
    const summary = await Order.aggregate([
      { $match: dateFilter }, // Apply the date filter
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $subtract: ["$GrandtotalAmount", "$deliveryCharge"] }, // Subtract deliveryCharge from GrandtotalAmount for revenue
          }, // Sum the GrandTotal field for revenue
          totalDiscount: { $sum: "$totalDiscount" }, // Sum the totalDiscount field
          totalCouponDiscount: {
            $sum: { $cond: [{ $eq: ["$coupponUsed", true] }, "$coupponDiscount", 0] }, // Sum the coupon discount if coupon is used
          },
          totalDeliveryCharge: { $sum: "$deliveryCharge" }, // Sum the delivery charge
          totalSales: { $sum: 1 }, // Track total sales count
        },
      },
    ]);

    const totalRegularPrice = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalRegularPrice: { $sum: "$items.regularprice" },
        },
      },
    ]);

    const totalReturnedAmountResult = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      { $match: { "items.returnApproved": true } },
      {
        $group: {
          _id: null,
          totalReturnedAmount: { $sum: "$items.saleprice" },
        },
      },
    ]);

    const totalReturnedAmount =
      totalReturnedAmountResult.length > 0 ? totalReturnedAmountResult[0].totalReturnedAmount : 0;

    // Get unique customers
    const uniqueCustomers = await Order.distinct("userId", dateFilter);

    // Prepare summary data
    const summaryData = {
      sales: summary.length > 0 ? summary[0].totalSales : 0,
      revenue: summary.length > 0 ? summary[0].totalRevenue : 0,
      totalDiscount: summary.length > 0 ? summary[0].totalDiscount : 0,
      totalCouponDiscount: summary.length > 0 ? summary[0].totalCouponDiscount : 0,
      totalDeliveryCharge: summary.length > 0 ? summary[0].totalDeliveryCharge : 0,
      orders:filteredOrders,
      totalReturnedAmount,
      totalRegularPrice: totalRegularPrice.length > 0 ? totalRegularPrice[0].totalRegularPrice : 0,
    };

    // Generate PDF Document
    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=purelyYou_sales_report.pdf"
    );

    doc.fontSize(18).text("Sales Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Total Sales: ${summaryData.sales}`);
    doc.text(`Total Regular Price: ${summaryData.totalRegularPrice.toFixed(2)}`);
    doc.text(`Total Revenue: ${summaryData.revenue.toFixed(2)}`);
    doc.text(`Total Discount: ${summaryData.totalDiscount.toFixed(2)}`);
    doc.text(`Total Coupon Discount: ${summaryData.totalCouponDiscount.toFixed(2)}`);
    doc.text(`Total Delivery Charge: ${summaryData.totalDeliveryCharge.toFixed(2)}`);
    doc.text(`Total Returned Amount: ${summaryData.totalReturnedAmount.toFixed(2)}`);
    doc.moveDown();

    doc.moveDown(3.5);
    const columnWidths = [80, 110, 80, 80, 100, 80, 100, 90];
    const startX = 40;
    let currentY = doc.y;

    doc.scale(0.85);

    const headers = [
      "Order ID",
      "Customer",
      "Amount",
      "Discount",
      "Date",
      "Status",
      "Coupon Code",
    ];
    doc.fontSize(12).font("Helvetica-Bold");
    headers.forEach((header, idx) => {
      doc.text(
        header,
        startX + columnWidths.slice(0, idx).reduce((a, b) => a + b, 0),
        currentY,
        { width: columnWidths[idx], align: "center" }
      );
    });
    currentY += 20;

    doc.font("Helvetica").fontSize(10);
    summaryData.orders.forEach((order) => {
      const orderDetails = [
        order.code,
        order.username,
        order.totalAmount.toFixed(2),
        (order.totalDiscount + (order.coupponDiscount || 0)).toFixed(2),
        new Date(order.createdAt).toLocaleString(),
        order.orderstatus,
        order.coupponCode || "N/A",
      ];

      orderDetails.forEach((detail, idx) => {
        doc.text(
          detail,
          startX + columnWidths.slice(0, idx).reduce((a, b) => a + b, 0),
          currentY,
          { width: columnWidths[idx], align: "center" }
        );
      });

      currentY += 21;
    });

    doc.end();
    return doc.pipe(res);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};


module.exports.updateOfferStatus = async (req, res) => {
  try {
    const offerId = req.params.id;
    const { status, categoryId } = req.body;

    const offer = await OfferModel.findById(offerId);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }

    if (status !== "Active" && status !== "Inactive") {
      return res
        .status(400)
        .json({ message: "Invalid status. Must be Active or Inactive." });
    }

    const products = await ProductModel.find({ category: categoryId });

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for the selected category." });
    }

    if (status === "Inactive") {
      for (let product of products) {
        product.isSpecialOffer = false;
        product.specialOfferDiscount = 0;
        await product.save();
      }
    } else if (status === "Active") {
      for (let product of products) {
        product.isSpecialOffer = true;
        product.specialOfferDiscount = offer.discountPercentage;
        await product.save();
      }
    }

    const statusBoolean = status === "Active" ? true : false;
    const updatedOffer = await OfferModel.findByIdAndUpdate(
      offerId,
      { status: statusBoolean },
      { new: true }
    );

    res.json({ updated: true, offer: updatedOffer });
  } catch (error) {
    console.error("Error updating offer status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.adminDashboardFetch = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { orderstatus: "Delivered" } }, // Match only "Delivered" orders
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $subtract: ["$GrandtotalAmount", "$deliveryCharge"] }, // Subtract deliveryCharge from totalAmount
          },
        },
      },
    ]);

    const totalCustomers = await User.countDocuments();

    const totalSales = await ProductModel.aggregate([
      { $group: { _id: null, totalSales: { $sum: "$sales" } } },
    ]);

    const topProducts = await ProductModel.find()
      .sort({ sales: -1 })
      .limit(5)
      .select("productname sales");

    const topCategories = await ProductModel.aggregate([
      {
        $group: {
          _id: "$category",
          totalSales: { $sum: "$sales" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $project: {
          categoryName: "$categoryDetails.categoryname",
          totalSales: 1,
        },
      },
    ]);

    res.status(200).json({
      totalRevenue: totalRevenue.length ? totalRevenue[0].totalRevenue : 0,
      totalCustomers,
      totalSales: totalSales.length ? totalSales[0].totalSales : 0,
      topProducts,
      topCategories,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

module.exports.dashBoardChart = async (req, res) => {
  const { interval, filter, startDate, endDate } = req.query;

  let groupBy;
  let formatLabel;
  let dateFilter = { orderstatus: "Delivered" };
  const now = new Date();

  switch (interval) {
    case "yearly":
      groupBy = { $year: "$createdAt" };
      formatLabel = (id) => `${id}`;
      break;
    case "monthly":
      groupBy = { $month: "$createdAt" };
      formatLabel = (id) =>
        new Date(0, id - 1).toLocaleString("default", { month: "long" });
      break;
    case "weekly":
      groupBy = { $week: "$createdAt" };
      formatLabel = (id) => `Week ${id}`;
      break;
    case "daily":
      groupBy = { $dayOfMonth: "$createdAt" };
      formatLabel = (id) => `Day ${id}`;
      break;
    default:
      return res.status(400).json({ error: "Invalid interval" });
  }

  if (filter === "today") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    dateFilter.createdAt = { $gte: startOfDay, $lte: now };
  } else if (filter === "last7days") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    dateFilter.createdAt = { $gte: sevenDaysAgo, $lte: now };
  } else if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.createdAt = { $gte: start, $lte: end };
  }

  try {
    const salesData = await Order.aggregate([
      { $match: dateFilter }, // Apply the date filter
      {
        $group: {
          _id: groupBy, 
          totalSales: {
            $sum: { $subtract: ["$GrandtotalAmount", "$deliveryCharge"] }, // Subtract deliveryCharge from totalAmount
          },
        },
      },
      { $sort: { _id: 1 } }, // Sort by the group identifier
    ]);
    

    const formattedSalesData = salesData.map((item) => ({
      label: formatLabel(item._id),
      totalSales: item.totalSales,
    }));

    res.status(200).json({ salesData: formattedSalesData });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
};
