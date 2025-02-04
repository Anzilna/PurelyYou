const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "please enter a username"],
    },
    email: {
      type: String,
      required: [true, "please enter an email"],
      unique: true,
      lowercase: true,
      validate: [isEmail, "please enter a valid email"],
    },
    password: {
      type: String,
      required: false,
      default: null,
      minlength: [6, "Minimum password length is 6 characters"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },
    dob: {
      type: Date,
      sparse: true,
    },
    phone: {
      type: String,
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error); 
    }
  }
  next();
});

// for hashing password
const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: Number,
    },
    email: {
      type: String,
      lowercase: true,
    },
    otptype: {
      type: String,
    },
    otpexpire: {
      type: Date,
    },
  },
  { timestamps: true }
);
otpSchema.index({ otpexpire: 1 }, { expireAfterSeconds: 300 });

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        productname: {
          type: String,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        saleprice: {
          type: Number,
          required: true,
        },
        regularprice: {
          type: Number,
          required: true,
        },
        discountprice: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalamount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalregularamount: {
      type: Number,
      required: true,
      default: 0,
    },
    totaldiscountamount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate totals
cartSchema.pre("save", function (next) {
  let totalSalePrice = 0;
  let totalRegularPrice = 0;
  let totalDiscountPrice = 0;

  this.items.forEach((item) => {
    totalSalePrice += item.saleprice * item.quantity;
    totalRegularPrice += item.regularprice * item.quantity;
    totalDiscountPrice += item.discountprice * item.quantity;
  });

  this.totalamount = totalSalePrice;
  this.totalregularamount = totalRegularPrice;
  this.totaldiscountamount = Math.round(totalDiscountPrice);
  next();
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    orderstatus: {
      type: String,
      enum: ["Processing", "Cancelled", "Delivered", "Dispatched"],
      default: "Processing",
    },
    coupponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    coupponUsed: {
      type: Boolean,
      default: false,
    },
    coupponCode: {
      type: String,
    },
    coupponDiscount: {
      type: Number,
    },
    code: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    GrandtotalAmount: {
      type: Number,
      required: true,
      default: function () {
        return this.totalAmount; 
      },
    },
    totalDiscount: {
      type: Number,
      required: true,
    },
    totalRegularprice:{
      type:Number,
      required: true
    },
    deliveryCharge: {
      type: Number,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [
        /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
        "Please fill a valid email address",
      ],
    },
    selectedAddress: {
      name: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      createdAt: {
        type: Date,
        required: true,
      },
    },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Wallet", "Razorpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending"],
      default: "Pending",
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        productname: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        saleprice: {
          type: Number,
          required: true,
        },
        regularprice: {
          type: Number,
          required: true,
        },
        discountprice: {
          type: Number,
          default: 0,
        },
        returnRequest: {
          type: Boolean,
          default: false,
        },
        returnApproved: {
          type: Boolean,
          default: false,
        },
        returnStatus: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const NewsletterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, 
      lowercase: true,
      trim: true,
      validate: {
        validator: (email) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 
        message: "Invalid email format",
      },
    },
    subscribedAt: {
      type: Date,
      default: Date.now, 
    },
  },
  {
    timestamps: true, 
  }
);

const pendingOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    orderstatus: {
      type: String,
      default: "Payment Pending",
    },
    razorPayOrderId:{
      type: String,
      required:true
    },
    coupponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    coupponUsed: {
      type: Boolean,
      default: false,
    },
    coupponCode: {
      type: String,
    },
    coupponDiscount: {
      type: Number,
    },
    code: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    totalDiscount: {
      type: Number,
      required: true,
    },
    totalRegularprice:{
      type:Number,
      required: true
    },
    deliveryCharge: {
      type: Number,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [
        /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
        "Please fill a valid email address",
      ],
    },
    selectedAddress: {
      name: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      createdAt: {
        type: Date,
        required: true,
      },
    },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Wallet", "Razorpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending"],
      default: "Pending",
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        productname: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        saleprice: {
          type: Number,
          required: true,
        },
        regularprice: {
          type: Number,
          required: true,
        },
        discountprice: {
          type: Number,
          default: 0,
        },
        returnRequest: {
          type: Boolean,
          default: false,
        },
        returnStatus: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);


const favouritesSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        productname: {
          type: String,
          required: true,
        },
        productimage: {
          type: String,
          require: true,
        },
        productsaleprice: {
          type: Number,
          require: true,
        },
        productregularprice: {
          type: Number,
          required: true,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

const AddressSchema = new mongoose.Schema(
  {
    addresses: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        address: {
          type: String,
          required: true,
          trim: true,
        },
        addressline: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          required: true,
          trim: true,
        },
        state: {
          type: String,
          required: true,
          trim: true,
        },
        pincode: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          required: true,
          match: /^[0-9]{10}$/,
        },
        email: {
          type: String,
          required: true,
          match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          lowercase: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

//wallet
const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "wallet",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const returnSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 0,
      maxlength: 500,
    },
    amount: {
      type: Number,
      required: true,
      set: (value) => Number(value),
    },
    quantity: {
      type: Number,
      required: true,
      set: (value) => Number(value),
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    pickupAddress: {
      name: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      phone: {
        type: String,
        required: true,
        match: /^[1-9][0-9]{9}$/,
      },
    },
  },
  { timestamps: true }
);


const cancelledOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productname: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        saleprice: {
          type: Number,
          required: true,
        },
      },
    ],
    cancellationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  Otp: mongoose.model("otp", otpSchema),
  User: mongoose.model("user", userSchema),
  Cart: mongoose.model("cart", cartSchema),
  Address: mongoose.model("address", AddressSchema),
  Order: mongoose.model("order", orderSchema),
  Favourite: mongoose.model("favourites", favouritesSchema),
  Wallet: mongoose.model("wallet", walletSchema),
  walletTransaction: mongoose.model(
    "wallettransaction",
    walletTransactionSchema
  ),
  Return: mongoose.model("return", returnSchema),
  PendingOrders:mongoose.model("pendingorders", pendingOrderSchema),
  NewsletterSchema:mongoose.model('newsletter',NewsletterSchema),
  CancelledOrder: mongoose.model("CancelledOrder", cancelledOrderSchema)
};
