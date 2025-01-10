const { AdminModel,CategoryModel,ProductModel, CouponModel } = require("../../model/adminmodel");
const functions = require("../functions/functions");
const {User,Order}=require('../../model/usermodel')
const bcrypt=require('bcrypt')
const jwtTokenCreation = require("../functions/jwttoken");
const passport = require("passport");
const fs=require('fs')
const path=require('path')
require('dotenv').config()



module.exports.adminLoginGet = (req, res) => {
  res.render("admin/adminlogin");
};
module.exports.adminLoginPost = async (req, res) => {
  const { password, email } = req.body;
  const path=req.originalUrl
  try {
    const admin=await AdminModel.findOne({email})
     if(admin){
      const comparePassword=await bcrypt.compare(password,admin.password)
      if(comparePassword){
         const token=await jwtTokenCreation(admin._id)
         res.cookie('jwtadmin',token,{
          httpOnly:true
         })
         
        res.json({verified:"admin verified"})
      }else{
        res.json({invalid:"invalid password"})

      }
     }else{
      res.json({incorect:"invalid email"})
     }
  } catch (error) {
    
  }
  
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
  res.render("admin/adminHome",{title:'Dashboard',route:'dashboard',side:"Dashboard"});
};

/// categoies session 
module.exports.adminCategories = async(req, res) => {
 const allcategories=await CategoryModel.find().sort({updatedAt:-1})
  res.render("admin/category",{allcategories,route:"categories",title:"Categories",side:"Categories"});
};
module.exports.adminCategoriesAdd = (req, res) => {
  res.render("admin/addCategory",{subroute:"categories",mainroute:'addcategories',title:"Addcategories",side:"Categories"});
};
module.exports.adminCategoriesAddPost = async(req, res) => {
  const { categoryName, description } = req.body;
  const image = req.file ? req.file.filename :  null;

  console.log(image);
  
  try {
    const category=new CategoryModel({
      categoryname:categoryName,
      image:image,
      description:description
    })
    
    await category.save()
     res.status(200).json({saved:"category saved"})
     
  } catch (error) {
    const err=functions.errorHandlingCategory(error)
    res.status(400).json({err})
  }
  
};
module.exports.adminCategoriesEditPut = async (req, res) => {
  try {
    const { categoryId,categoryName,isActive,description } = req.body;
    const image = req.file ? req.file.filename : null;

    const updatedCategory = await CategoryModel.findById(categoryId);

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }
     const status=isActive==='true'?true:false
    if (categoryName) updatedCategory.categoryname = categoryName;
    if (description) updatedCategory.description = description;
    if (isActive) updatedCategory.isActive = status;
    if (image) updatedCategory.image = image; 

    await updatedCategory.validate();
    await updatedCategory.save(); 

    res.status(200).json({ saved: "Category updated successfully", updatedCategory });
  } catch (error) {
    console.error(error);
    const err=functions.errorHandlingCategory(error)
    res.status(400).json({err}) }
};
module.exports.adminCategoriesEdit = async(req, res) => {
  const id = req.params.id
  console.log(id);
  try {
    const category =await CategoryModel.findById(id) 
    res.render("admin/editCategory",{category,subroute:"categories",mainroute:'editcategories',title:"editcategories",side:"Categories"});
  } catch (error) {
    console.log("error in category id fetching");
    
  }
 
};
module.exports.adminCategoriesDelete = async(req, res) => {
  const id = req.params.id
  console.log(id);
  
  try {
    
    const user=await CategoryModel.findByIdAndDelete(id)
    res.json({deleted:"user deleted"})
    
  } catch (error) {
    console.log("err in finding delete user",error);
    
  }
  
  };


//products sessiion 
module.exports.adminProductsEdit = async(req, res) => {
  const id = req.params.id
  console.log(id);
  try {
    const product =await ProductModel.findById(id) 
    const category=await CategoryModel.find()
    console.log("goisss",product.discountpercentage);
    
    
    res.render("admin/editProduct",{product,category,subroute:"products",mainroute:'editproducts',title:"Editproducts",side:"Products"});
  } catch (error) {
    console.log("error in category id fetching");
    
  }
 
};


module.exports.filter= async(req, res) => {
  const filterBasedOn = req.query.stockstatus
  console.log(id);
  try {
    const products =await ProductModel.find({stockstatus:filterBasedOn}) 
    
    
    res.render("admin/editProduct",{products,subroute:"products",mainroute:'editproducts',title:"Editproducts",side:"Products"});
  } catch (error) {
    console.log("error in category id fetching");
  }
 
};

module.exports.adminProductsRemoveImage= async(req, res) => {
  const {image,id} = req.body

  try {

    if (!id || !image) {
      return res.status(400).json({ success: false, message: 'Invalid request data' });
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      { $pull: { images: image } }, 
      { new: true } 
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    fs.unlink(path.join(__dirname, "../uploads", image), (err) => {
      if (err) console.error("Error deleting file:", err);
      console.log("File deleted successfully");
        });
    res.json({ success: true, message: 'Image removed successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error while removing image:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }

};

module.exports.adminProductsEditPost = async (req, res) => {
  const files = req.files;
  console.log("Edited product:", req.body, "and new added files:", files);

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

    const stockstatus = stock <= 0 ? "Out Of Stock" : stock <= 10 ? "Low Quantity" : "Available";
    const discountedprice = (regularprice * discountpercentage) / 100;
    const saleprice = Math.round(regularprice - discountedprice); 

    product.productname = productname;
    product.regularprice = regularprice;
    product.ingredients = ingredients;
    product.productcode = productcode;
    product.mlQuantity = mlQuantity;
    product.stock = stock;
    product.category = category;
    product.description = description;
    product.categoryname = categoryname;
    product.discountpercentage = discountpercentage;
    product.saleprice = saleprice;
    product.stockstatus = stockstatus;
    product.discountedprice=discountedprice;
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

module.exports.adminListProducts = async(req, res) => {
  const id = req.params.id
  const { isListed } = req.body;
  
  try {
    
    const user=await ProductModel.findByIdAndUpdate(id,
      {isListed},
      {new:true}
    )
    if(user){
      res.status(200).json({updated:true})
    }else{
      res.status(200).json({updated:false})

    }
    
  } catch (error) {
    console.error('Error updating product listing status:', error);
    res.status(500).json({ updated: false, error: 'Internal server error' });
    
  }
  
  };
module.exports.adminProducts=async (req, res) => {

  try {
    const allproducts=await ProductModel.find().sort({updatedAt:-1})
    res.render("admin/products",{allproducts,route:"products",title:"Products",side:"Products"});

  } catch (error) {
    console.log("error in products get ");
    
  }
};
module.exports.adminProductsAdd =async (req, res) => {
  try {
    const category=await CategoryModel.find()
    console.log(category);
    
    res.render("admin/addProducts",{category,subroute:"products",mainroute:'addproducts',title:"Addproducts",side:"Products"});
  } catch (error) {
    console.log(error);
    
  }
};
module.exports.adminProductsAddPost = async(req, res) => {
const files = req.files
console.log("new product",req.body);

let images=[]
const{productname,regularprice,stock,category,categoryname,mlQuantity,productcode,ingredients,description,discountpercentage} = req.body
files.forEach(({filename})=> {
  images.push(`${/uploads/}${filename}`)
});

const stockstatus = stock <= 0 ? 'Out Of Stock' : stock <= 10 ? 'Low Quantity' : 'Available';
const discountedprice=regularprice*discountpercentage/100
const saleprice = Math.round(regularprice - discountedprice);
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
  discountpercentage,
  saleprice,
  stockstatus,
  discountedprice
})
try {
  await newProduct.save()
  res.status(200).json({saved:"product saved sucessfully"})

} catch (error) {
  console.log(error);
  
}

};



module.exports.adminUserDelete = async(req, res) => {
const id = req.params.id
console.log(id);

try {
  console.log("before userrrrrr");
  
  const user=await User.findByIdAndDelete(id)
  res.json({deleted:"user deleted"})
  
} catch (error) {
  console.log("err in finding delete user",error);
  
}

};
module.exports.adminCustomers = async(req, res) => {

try {
    const allUsers=await User.find().sort({updatedAt:-1})
    
    res.render("admin/customers",{allUsers,route:"customers",title:"Customers",side:"Customers"});
} catch (error) {
    console.log(error);
    
}
};


module.exports.adminOffers= async(req, res) => {

  try {
      
      res.render("admin/offers",{route:"offers",mainroute:'addoffers',title:"Offers",side:"Offers"});
  } catch (error) {
      console.log(error);
      
  }
  };

  module.exports.adminAddOffersPost = async(req, res) => {

   console.log(req.body);
   
    };
  module.exports.  adminAddOffersGet  = async(req, res) => {

    try {
        
        res.render("admin/addoffers",{subroute:'offers',mainroute:"addoffers",title:"Offers",side:"Offers"});
    } catch (error) {
        console.log(error);
        
    }
    };
  
module.exports.adminOrders= async(req, res) => {

  try {
      const Orders=await Order.find().sort({updatedAt:-1})
      
      res.render("admin/orders",{Orders,route:"orders",title:"Orders",side:"Orders"});
  } catch (error) {
      console.log(error);
      
  }
  };
  module.exports.adminOrdersPut= async(req, res) => {

    console.log(req.body);
    
    };
  
module.exports.adminCustomersAdd = (req, res) => {
  res.render("admin/addCustomers",{subroute:"customers",mainroute:'addcustomers',title:"AddCustomers",side:"Customers"});
};
module.exports.adminCustomersAddPost =async (req, res) => {
  const {email,password,status,username}=req.body
  try {
    const newUser= new User({
      email,password
      ,status,email,username
     })
     const result=await newUser.save()
res.status(200).json({saved:"data saved"})     
  } catch (error) {
    console.log("error in add user post ",error);
    
  }
 
  
};
module.exports.adminCustomersEdit =async (req, res) => {
  const id=req.params.id;
  const user = await User.findById(id)
  res.status(200).render("admin/editCustomers",{user,subroute:"customers",mainroute:'editcustomers',title:"EditCustomers",side:"Customers"});
  
};
module.exports.adminCustomersEditPut = async (req, res) => {
  const { email, status, username, id, password = null } = req.body;

  try {
      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }

      if (password && password.trim() !== '') {
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
    const orderId = req.params.id
    const order = await Order.findById(orderId).populate('items.productId')
    console.log(orderId);
    
    res.render("admin/orderDetails",{order,subroute:"orders",mainroute:'orderdetails',title:"Orderdetails",side:"Orders"});
  } catch (error) {
    console.log(error);
    
  }

};

module.exports.adminCoupons = async (req, res) => {
  try {
    // const orderId = req.params.id
    // const order = await Order.findById(orderId).populate('items.productId')
    // console.log(orderId);
    
    res.render("admin/Coupons",{route:'coupons',title:"Coupons",side:"Coupons"});
  } catch (error) {
    console.log(error);
    
  }

};



module.exports.adminAddCoupon = async (req, res) => {
  try {
    res.render("admin/addCoupon",{subroute:"coupons",mainroute:'addcoupons',title:"Addcoupons",side:"Coupons"});
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
      coupon: coupon 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


