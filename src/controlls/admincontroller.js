const {
  AdminModel,
  CategoryModel,
  ProductModel,
  CouponModel,
  OfferModel,
} = require("../../model/adminmodel");
const functions = require("../functions/functions");
const { User, Order, Return } = require("../../model/usermodel");
const bcrypt = require("bcrypt");
const jwtTokenCreation = require("../functions/jwttoken");
const passport = require("passport");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

module.exports.adminLoginGet = (req, res) => {
  res.render("admin/adminLogin");
};
module.exports.adminLoginPost = async (req, res) => {
  const { password, email } = req.body;
  const path = req.originalUrl;
  try {
    const admin = await AdminModel.findOne({ email });
    if (admin) {
      const comparePassword = await bcrypt.compare(password, admin.password);
      if (comparePassword) {
        const token = await jwtTokenCreation(admin._id);
        res.cookie("jwtadmin", token, {
          httpOnly: true,
        });

        res.json({ verified: "admin verified" });
      } else {
        res.json({ invalid: "invalid password" });
      }
    } else {
      res.json({ incorect: "invalid email" });
    }
  } catch (error) {}
};
module.exports.adminLogoutGet = (req, res) => {
  res.cookie("jwtadmin", "", { maxAge: 1 });
  res.redirect("/admin/login");
};
module.exports.adminSignupPost = async (req, res) => {
  const { password, email, name } = req.body;
  try {
    const newAdmin = new AdminModel({
      username: name,
      password,
      email,
    });
    const adminSave = await newAdmin.save();
    res.status(200).json({ success: "new admin saved" });
  } catch (error) {
    const err = await functions.errorHandling(error);
    res.status(400).json({ err });
  }
};

module.exports.adminHomeGet = (req, res) => {
  res.render("admin/adminHome", {
    title: "Dashboard",
    route: "dashboard",
    side: "Dashboard",
  });
};

/// categoies session
module.exports.adminCategories = async (req, res) => {
  const allcategories = await CategoryModel.find().sort({ updatedAt: -1 });
  res.render("admin/category", {
    allcategories,
    route: "categories",
    title: "Categories",
    side: "Categories",
  });
};
module.exports.adminCategoriesAdd = (req, res) => {
  res.render("admin/addCategory", {
    subroute: "categories",
    mainroute: "addcategories",
    title: "Addcategories",
    side: "Categories",
  });
};
module.exports.adminCategoriesAddPost = async (req, res) => {
  const { categoryName, description } = req.body;
  const image = req.file ? req.file.filename : null;

  try {
    const category = new CategoryModel({
      categoryname: categoryName,
      image: image,
      description: description,
    });

    await category.save();
    res.status(200).json({ saved: "category saved" });
  } catch (error) {
    const err = functions.errorHandlingCategory(error);
    res.status(400).json({ err });
  }
};
module.exports.adminCategoriesEditPut = async (req, res) => {
  try {
    const { categoryId, categoryName, isActive, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const updatedCategory = await CategoryModel.findById(categoryId);

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }
    const status = isActive === "true" ? true : false;
    if (categoryName) updatedCategory.categoryname = categoryName;
    if (description) updatedCategory.description = description;
    if (isActive) updatedCategory.isActive = status;
    if (image) updatedCategory.image = image;

    await updatedCategory.validate();
    await updatedCategory.save();

    res
      .status(200)
      .json({ saved: "Category updated successfully", updatedCategory });
  } catch (error) {
    console.error(error);
    const err = functions.errorHandlingCategory(error);
    res.status(400).json({ err });
  }
};
module.exports.adminCategoriesEdit = async (req, res) => {
  const id = req.params.id;
  try {
    const category = await CategoryModel.findById(id);
    res.render("admin/editCategory", {
      category,
      subroute: "categories",
      mainroute: "editcategories",
      title: "editcategories",
      side: "Categories",
    });
  } catch (error) {
    console.log("error in category id fetching");
  }
};
module.exports.adminCategoriesDelete = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await CategoryModel.findByIdAndDelete(id);
    res.json({ deleted: "user deleted" });
  } catch (error) {
    console.log("err in finding delete user", error);
  }
};

//products sessiion
module.exports.adminProductsEdit = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await ProductModel.findById(id);
    const category = await CategoryModel.find();

    res.render("admin/editProduct", {
      product,
      category,
      subroute: "products",
      mainroute: "editproducts",
      title: "Editproducts",
      side: "Products",
    });
  } catch (error) {
    console.log("error in category id fetching");
  }
};

module.exports.filter = async (req, res) => {
  const filterBasedOn = req.query.stockstatus;
  try {
    const products = await ProductModel.find({ stockstatus: filterBasedOn });

    res.render("admin/editProduct", {
      products,
      subroute: "products",
      mainroute: "editproducts",
      title: "Editproducts",
      side: "Products",
    });
  } catch (error) {
    console.log("error in category id fetching");
  }
};

module.exports.adminProductsRemoveImage = async (req, res) => {
  const { image, id } = req.body;

  try {
    if (!id || !image) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request data" });
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      { $pull: { images: image } },
      { new: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    fs.unlink(path.join(__dirname, "../uploads", image), (err) => {
      if (err) console.error("Error deleting file:", err);
    });
    res.json({
      success: true,
      message: "Image removed successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error while removing image:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports.adminProductsEditPost = async (req, res) => {
  const files = req.files;

  let images = [];
  const {
    productname,
    id,
    regularprice,
    stock,
    category,
    categoryname,
    mlQuantity,
    productcode,
    ingredients,
    description,
    discountpercentage,
  } = req.body;

  files.forEach(({ filename }) => {
    images.push(`${/uploads/}${filename}`);
  });

  try {
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.productname = productname;
    product.regularprice = regularprice;
    product.ingredients = ingredients;
    product.productcode = productcode;
    product.mlQuantity = mlQuantity;
    product.stock = stock;
    product.category = category;
    product.description = description;
    product.categoryname = categoryname;
    product.productDiscountPercentage = discountpercentage;
    if (images.length > 0) {
      product.images = [...product.images, ...images];
    }

    await product.save();
    res.status(200).json({ saved: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

module.exports.adminListProducts = async (req, res) => {
  const id = req.params.id;
  const { isListed } = req.body;

  try {
    const user = await ProductModel.findByIdAndUpdate(
      id,
      { isListed },
      { new: true }
    );
    if (user) {
      res.status(200).json({ updated: true });
    } else {
      res.status(200).json({ updated: false });
    }
  } catch (error) {
    console.error("Error updating product listing status:", error);
    res.status(500).json({ updated: false, error: "Internal server error" });
  }
};

module.exports.adminProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const totalProducts = await ProductModel.countDocuments();
    const allproducts = await ProductModel.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalProducts / limit);

    res.render("admin/products", {
      allproducts,
      currentPage: page,
      totalPages,
      route: "products",
      title: "Products",
      side: "Products",
    });
  } catch (error) {
    console.log("Error in adminProducts: ", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.adminProductsAdd = async (req, res) => {
  try {
    const category = await CategoryModel.find();

    res.render("admin/addProducts", {
      category,
      subroute: "products",
      mainroute: "addproducts",
      title: "Addproducts",
      side: "Products",
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.adminProductsAddPost = async (req, res) => {
  const files = req.files;

  let images = [];
  const {
    productname,
    regularprice,
    stock,
    category,
    categoryname,
    mlQuantity,
    productcode,
    ingredients,
    description,
    discountpercentage,
  } = req.body;
  files.forEach(({ filename }) => {
    images.push(`${/uploads/}${filename}`);
  });

  const newProduct = new ProductModel({
    productname,
    regularprice,
    images,
    ingredients,
    productcode,
    mlQuantity,
    stock,
    category,
    description,
    categoryname,
    productDiscountPercentage: discountpercentage,
  });
  try {
    await newProduct.save();
    res.status(200).json({ saved: "product saved sucessfully" });
  } catch (error) {
    console.log(error);
  }
};

module.exports.adminUserDelete = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findByIdAndDelete(id);
    res.json({ deleted: "user deleted" });
  } catch (error) {
    console.log("err in finding delete user", error);
  }
};
module.exports.adminCustomers = async (req, res) => {
  try {
    const allUsers = await User.find().sort({ updatedAt: -1 });

    res.render("admin/customers", {
      allUsers,
      route: "customers",
      title: "Customers",
      side: "Customers",
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.adminOffers = async (req, res) => {
  try {
    const offers = await OfferModel.find().sort({ updatedAt: -1 });

    const manipulatedOffers = offers.map((offer) => {
      const startDateFormatted = new Date(offer.startDate).toLocaleDateString();
      const endDateFormatted = new Date(offer.endDate).toLocaleDateString();

      const status = offer.status ? "Active" : "Inactive";

      return {
        ...offer.toObject(),
        startDateFormatted,
        endDateFormatted,
        status,
      };
    });

    res.render("admin/offers", {
      route: "offers",
      mainroute: "addoffers",
      title: "Offers",
      side: "Offers",
      offers: manipulatedOffers,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).send("Internal Server Error");
  }
};
module.exports.adminAddOffersPost = async (req, res) => {
  try {
    const {
      offername,
      discountPercentage,
      startDate,
      endDate,
      eligibilityCriteria,
      description,
      categoryId,
      categoryName,
    } = req.body;

    const offer = await OfferModel.findOne({
      offerName: { $regex: new RegExp(`^${offername}$`, "i") },
    });
    if (offer) {
      return res.status(409).json({
        message: "Offer already exists",
      });
    }

    const category = await CategoryModel.findById(categoryId);
    if (!category || category.categoryname !== categoryName) {
      return res.status(400).json({
        message: "Invalid category selected.",
      });
    }

    const products = await ProductModel.find({ category: categoryId });

    if (products.length === 0) {
      return res.status(404).json({
        message: "No products found for the selected category.",
      });
    }

    for (let product of products) {
      product.isSpecialOffer = true;
      product.specialOfferDiscount = discountPercentage;
      await product.save();
    }

    const newOffer = new OfferModel({
      offerName: offername,
      discountPercentage,
      startDate,
      endDate,
      eligibilityCriteria,
      description,
      category: { id: categoryId, name: categoryName },
    });

    await newOffer.save();

    res.status(201).json({ saved: true, message: "Offer added successfully!" });
  } catch (error) {
    console.error("Error while saving the offer:", error);
    res.status(500).json({
      saved: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

module.exports.adminEditOfferGet = async (req, res) => {
  const offerId = req.params.id;

  try {
    const offer = await OfferModel.findById(offerId);

    if (!offer) {
      return res.status(404).send("Offer not found");
    }

    const formattedStartDate = new Date(offer.startDate)
      .toISOString()
      .split("T")[0];
    const formattedEndDate = new Date(offer.endDate)
      .toISOString()
      .split("T")[0];

    const categories = await CategoryModel.find();

    res.render("admin/editOffer", {
      subroute: "offers",
      mainroute: "editoffer",
      title: "Edit Offer",
      side: "Offers",
      categories,
      offer,
      startDateFormatted: formattedStartDate,
      endDateFormatted: formattedEndDate,
    });
  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.adminAddOffersGet = async (req, res) => {
  try {
    const categories = await CategoryModel.find();

    res.render("admin/addOffers", {
      subroute: "offers",
      mainroute: "addoffers",
      title: "Offers",
      side: "Offers",
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.adminOrders = async (req, res) => {
  try {
    const Orders = await Order.find().sort({ updatedAt: -1 });

    res.render("admin/orders", {
      Orders,
      route: "orders",
      title: "Orders",
      side: "Orders",
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.adminOrdersPut = async (req, res) => {};

module.exports.adminCustomersAdd = (req, res) => {
  res.render("admin/addCustomers", {
    subroute: "customers",
    mainroute: "addcustomers",
    title: "AddCustomers",
    side: "Customers",
  });
};
module.exports.adminCustomersAddPost = async (req, res) => {
  const { email, password, status, username } = req.body;
  try {
    const newUser = new User({
      email,
      password,
      status,
      email,
      username,
    });
    const result = await newUser.save();
    res.status(200).json({ saved: "data saved" });
  } catch (error) {
    console.log("error in add user post ", error);
  }
};
module.exports.adminCustomersEdit = async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id);
  res.status(200).render("admin/editCustomers", {
    user,
    subroute: "customers",
    mainroute: "editcustomers",
    title: "EditCustomers",
    side: "Customers",
  });
};
module.exports.adminCustomersEditPut = async (req, res) => {
  const { email, status, username, id, password = null } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (password && password.trim() !== "") {
      user.password = password;
    }
    if (email) user.email = email;
    if (status) user.status = status;
    if (username) user.username = username;

    await user.save();
    res.status(200).json({ updated: "User updated successfully" });
  } catch (error) {
    console.error(error);

    const afterErrorHandling = functions.errorHandling(error);
    res.status(500).json({ err: afterErrorHandling });
  }
};

module.exports.adminOrdersDetailsGet = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate("items.productId");

    res.render("admin/orderDetails", {
      order,
      subroute: "orders",
      mainroute: "orderdetails",
      title: "Orderdetails",
      side: "Orders",
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.adminCoupons = async (req, res) => {
  try {
    res.render("admin/Coupons", {
      route: "coupons",
      title: "Coupons",
      side: "Coupons",
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.adminAddCoupon = async (req, res) => {
  try {
    res.render("admin/addCoupon", {
      subroute: "coupons",
      mainroute: "addcoupons",
      title: "Addcoupons",
      side: "Coupons",
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.couponDetailsGet = async (req, res) => {
  try {
    const coupon = await CouponModel.findById(req.params.id);

    if (!coupon) {
      return res.status(404).send("Coupon not found");
    }

    res.render("admin/editCoupon", {
      subroute: "coupons",
      mainroute: "editcoupons",
      title: "Edit Coupons",
      side: "Coupons",
      coupon: coupon,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.adminReturns = async (req, res) => {
  res.render("admin/returns", {
    route: "returns",
    title: "Returns",
    side: "Returns",
  });
};

module.exports.adminReturnDetailsGet = async (req, res) => {
  try {
    const returnId = req.params.id;

    const returnDetails = await Return.findById(returnId).populate("productId");

    res.render("admin/ReturnDetails", {
      returnDetails,
      subroute: "returns",
      mainroute: "details",
      title: "Returndetails",
      side: "Returns",
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.adminSales = async (req, res) => {
  res.render("admin/sales", {
    route: "sales",
    title: "Sales",
    side: "Sales",
  });
};

module.exports.adminEditOfferPut = async (req, res) => {
  try {
    const {
      offername,
      discountPercentage,
      startDate,
      endDate,
      eligibilityCriteria,
      description,
      categoryId,
      categoryName,
      offerId,
      status,
    } = req.body;

    const existingOffer = await OfferModel.findById(offerId);
    if (!existingOffer) {
      return res.status(404).json({ message: "Offer not found." });
    }

    if (
      existingOffer.category.id === categoryId &&
      existingOffer.status === status
    ) {
      existingOffer.offerName = offername;
      existingOffer.discountPercentage = discountPercentage;
      existingOffer.startDate = startDate;
      existingOffer.endDate = endDate;
      existingOffer.eligibilityCriteria = eligibilityCriteria;
      existingOffer.description = description;
      existingOffer.status = status;

      await existingOffer.save();
      return res.status(200).json({ message: "Offer updated successfully." });
    }

    const oldCategoryProducts = await ProductModel.find({
      category: existingOffer.category.id,
    });
    for (let product of oldCategoryProducts) {
      product.isSpecialOffer = false;
      product.specialOfferDiscount = 0;
      await product.save();
    }

    if (status !== "Active") {
      existingOffer.offerName = offername;
      existingOffer.discountPercentage = discountPercentage;
      existingOffer.startDate = startDate;
      existingOffer.endDate = endDate;
      existingOffer.eligibilityCriteria = eligibilityCriteria;
      existingOffer.description = description;
      existingOffer.category.id = categoryId;
      existingOffer.category.name = categoryName;
      existingOffer.status = status;

      await existingOffer.save();

      return res.status(200).json({
        updated: true,
        message:
          "Offer updated successfully, but not applied as it's not active.",
      });
    }

    const newCategoryProducts = await ProductModel.find({
      category: categoryId,
    });
    if (newCategoryProducts.length === 0) {
      return res.status(404).json({
        message: "No products found for the selected category.",
      });
    }

    existingOffer.offerName = offername;
    existingOffer.discountPercentage = discountPercentage;
    existingOffer.startDate = startDate;
    existingOffer.endDate = endDate;
    existingOffer.eligibilityCriteria = eligibilityCriteria;
    existingOffer.description = description;
    existingOffer.category.id = categoryId;
    existingOffer.category.name = categoryName;
    existingOffer.status = status;

    await existingOffer.save();

    for (let product of newCategoryProducts) {
      product.isSpecialOffer = true;
      product.specialOfferDiscount = discountPercentage;
      await product.save();
    }

    res.status(200).json({
      updated: true,
      message: "Offer updated and applied to the new category successfully.",
    });
  } catch (error) {
    console.error("Error updating offer:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the offer." });
  }
};
