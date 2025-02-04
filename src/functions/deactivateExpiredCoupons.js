const {CouponModel} = require("../../model/adminmodel");

const deactivateExpiredCoupons = async () => {
    try {
      const now = new Date();
  
      await CouponModel.updateMany(
        {
          $or: [
            { endDate: { $lte: now } }, // Coupon expired
            { $and: [{ usageLimit: 0 }, { noUsageLimit: false }] }, // Usage limit reached and no unlimited use
          ],
        },
        { $set: { status: "inactive" } }
      );
  
      console.log("Coupons status updated successfully.");
    } catch (error) {
      console.error("Error updating coupon status:", error);
    }
  };
  

module.exports = { deactivateExpiredCoupons };
