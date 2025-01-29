const { Router } = require("express");
const router = Router();
const adminController = require("../controlls/admincontroller");
const adminAuth = require("../../middleware/jwtAuthAdmin");
const multerStorage = require("../../helpers/multerConfig");
const fetchAdminConrtroller = require("../controlls/fetchAdminController");

router.get("/login", adminController.adminLoginGet);
router.post("/login", adminController.adminLoginPost);
router.get("/logout", adminController.adminLogoutGet);
router.post("/signup", adminController.adminSignupPost);
router.get("/dashboard", adminAuth, adminController.adminHomeGet);
router.get(
  "/dashboardfetch",
  adminAuth,
  fetchAdminConrtroller.adminDashboardFetch
);
router.get("/dashboardchart", adminAuth, fetchAdminConrtroller.dashBoardChart);

router.get("/products", adminAuth, adminController.adminProducts);
router.get("/products/stockfilter", adminAuth, adminController.filter);
router.put(
  "/products/listproduct/:id",
  adminAuth,
  adminController.adminListProducts
);
router.get(
  "/products/editproduct/:id",
  adminAuth,
  adminController.adminProductsEdit
);
router.get("/products/addproduct", adminAuth, adminController.adminProductsAdd);
router.post(
  "/products/addproduct",
  multerStorage.array("images"),
  adminAuth,
  adminController.adminProductsAddPost
);
router.post(
  "/products/editproduct",
  multerStorage.array("images"),
  adminAuth,
  adminController.adminProductsEditPost
);
router.delete(
  "/products/editproduct/removeimage",
  adminAuth,
  adminController.adminProductsRemoveImage
);
router.get("/customers", adminAuth, adminController.adminCustomers);
router.get("/coupons", adminAuth, adminController.adminCoupons);
router.get("/coupons/addcoupon", adminAuth, adminController.adminAddCoupon);
router.post(
  "/coupons/addcoupon/fetch",
  adminAuth,
  fetchAdminConrtroller.adminAddCouponFetch
);
router.put(
  "/coupons/editcoupon/:id",
  adminAuth,
  fetchAdminConrtroller.adminEditCoupon
);
router.get(
  "/coupons/coupondetails/:id",
  adminAuth,
  adminController.couponDetailsGet
);
router.get("/coupons/fetch", adminAuth, fetchAdminConrtroller.adminCouponFetch);
router.get("/offers", adminAuth, adminController.adminOffers);
router.get(
  "/offers/editoffer/:id",
  adminAuth,
  adminController.adminEditOfferGet
);
router.put("/offers/editoffer", adminAuth, adminController.adminEditOfferPut);

router.get("/offers/addoffers", adminAuth, adminController.adminAddOffersGet);
router.post("/offers/addoffers", adminAuth, adminController.adminAddOffersPost);
router.put(
  "/offers/editoffer/:id",
  adminAuth,
  fetchAdminConrtroller.updateOfferStatus
);

router.get("/orders", adminAuth, adminController.adminOrders);
router.get(
  "/orders/fetch",
  adminAuth,
  fetchAdminConrtroller.adminOrdersFetchGet
);
router.put("/orders/editoder/", adminAuth, adminController.adminOrdersPut);
router.get(
  "/orders/orderdetails/:id",
  adminAuth,
  adminController.adminOrdersDetailsGet
);
router.put(
  "/orders/updatestatus/:id",
  adminAuth,
  fetchAdminConrtroller.updateOrderStatus
);
router.delete(
  "/customers/deleteustomer/:id",
  adminAuth,
  adminController.adminUserDelete
);
router.get(
  "/customers/addcustomers",
  adminAuth,
  adminController.adminCustomersAdd
);
router.post(
  "/customers/addcustomers",
  adminAuth,
  adminController.adminCustomersAddPost
);
router.get(
  "/customers/editcustomers/:id",
  adminAuth,
  adminController.adminCustomersEdit
);
router.put(
  "/customers/editcustomers",
  adminAuth,
  adminController.adminCustomersEditPut
);
router.get("/categories", adminAuth, adminController.adminCategories);
router.get(
  "/categories/addcategories",
  adminAuth,
  adminController.adminCategoriesAdd
);
router.get(
  "/categories/editcategories/:id",
  adminAuth,
  adminController.adminCategoriesEdit
);
router.put(
  "/categories/editcategories",
  multerStorage.single("categoryIcon"),
  adminAuth,
  adminController.adminCategoriesEditPut
);
router.post(
  "/categories/addcategories",
  multerStorage.single("categoryIcon"),
  adminAuth,
  adminController.adminCategoriesAddPost
);
router.delete(
  "/categories/deletecategories/:id",
  adminAuth,
  adminController.adminCategoriesDelete
);
router.get("/returns", adminAuth, adminController.adminReturns);
router.get("/returnsfetch", adminAuth, fetchAdminConrtroller.adminReturnsFetch);
router.get(
  "/returns/details/:id",
  adminAuth,
  adminController.adminReturnDetailsGet
);
router.put(
  "/returns/updatestatus",
  adminAuth,
  fetchAdminConrtroller.updateReturnStatus
);
router.get("/sales", adminAuth, adminController.adminSales);
router.get("/salesfetch", adminAuth, fetchAdminConrtroller.adminSalesFetch);
router.get(
  "/generateexcelreport",
  adminAuth,
  fetchAdminConrtroller.generateExcelReport
);
router.get(
  "/generatepdfreport",
  adminAuth,
  fetchAdminConrtroller.generatePDFReport
);

module.exports = router;
