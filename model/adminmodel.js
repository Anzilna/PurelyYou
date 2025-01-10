const mongoose=require('mongoose')
const {isEmail}=require('validator')
const bcrypt=require('bcrypt')
const adminSchema=new mongoose.Schema({

   username:{
    type:String,
    required:[true,"please enter a username"]
   },email:{
    type:String,
    unique:true,
    lowercase:true,
    required:[true,"please enter a email"],
    validate:[isEmail,'please enter a valid email']
   },
   password:{
    type:String,
    required:[true,'please enter a password'],
    minlength:[6,"Minimum password length is 6 characters"]
   }
},{
    timestamps:true
})

//password hashing
adminSchema.pre('save',async function(next){
    if(this.isModified('password')){
        console.log("hasing preee");
        
        try {
            const salt=await bcrypt.genSalt()
            this.password= await bcrypt.hash(this.password,salt)
           
        } catch (error) {
            
        }
    }
        next()
    

})

const categorySchema=new mongoose.Schema({
    categoryname:{
        type:String,
        required:[true,"please enter a category name"],
        unique:true,
        minlength: [3, "Category name must be at least 3 characters long"],
    },
    description:{
        type:String,
        required:[true,"please enter a description name"],
        minlength: [10, "Description must be at least 10 characters long"],

    },
    image:{
        type:String,
        required:[true,"please select a image"],
        validate:{
        validator:function(value){
                return value!==null&&value.trim()!=='';
        }}
    },
    isActive:{
        type:Boolean,
        default:true
    }

},{
    timestamps:true
})
const ProductSchema=new mongoose.Schema({

   productname:{
    type:String,
    required:true,

   },
   productcode:{
    type:String,
    required:true,
   },
   category:{
    type:mongoose.Schema.ObjectId,
    ref:'categories',
    required:true
   },
   categoryname:{
    type:String,
    required:true
   },
   regularprice:{
    type:Number,
    required:true

   }, description: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
  },
  images:{
   type: [String],
  required:true,
  default:[]
  },
  mlQuantity:{
 type:String,
 required:true
  },
  discountpercentage:{
    type:Number,
    required:false,
    default:0,
  },
  saleprice:{
     type:Number,
     required:true
  },
  ingredients:{
     type:[String],
     default:[]
  },
  stockstatus:{
    type:String,
    enum:["Out Of Stock","Low Quantity","Available"],
    required:true
  },
  isListed:{
    type:Boolean,
    default:true
  },
  discountedprice:{
    type:Number,
    default:0
  }

},{
    timestamps:true
})

const offerSchema = new mongoose.Schema({
  offername: {
    type: String,
    required: [true, 'Offer name is required.'],
    trim: true,
    minlength: [3, 'Offer name must be at least 3 characters long.'],
    maxlength: [100, 'Offer name must not exceed 100 characters.'],
  },
  discountPercentage: {
    type: Number,
    required: [true, 'Discount percentage is required.'],
    min: [1, 'Discount percentage must be at least 1.'],
    max: [100, 'Discount percentage cannot exceed 100.'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required.'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required.'],
    validate: {
      validator: function (value) {
        return value > this.startDate;
      },
      message: 'End date must be later than the start date.',
    },
  },
  eligibilityCriteria: {
    type: String,
    required: [true, 'Eligibility criteria are required.'],
    trim: true,
    minlength: [10, 'Eligibility criteria must be at least 10 characters long.'],
  },
  description: {
    type: String,
    required: [true, 'Description is required.'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long.'],
  },
});

offerSchema.pre('save', function(next) {
  if (this.startDate) {
    this.startDate = new Date(this.startDate);
  }

  if (this.endDate) {
    this.endDate = new Date(this.endDate);
  }

  next();  
});


ProductSchema.pre('save', function (next) {
  if (this.stock > 10) {
    this.stockstatus = 'Available';
  } else if (this.stock <= 10 && this.stock > 0) {
    this.stockstatus = 'Low Quantity';
  } else {
    this.stockstatus = 'Out Of Stock';
  }
  
  next(); 
});

const couponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: true,
      unique: true, 
      uppercase: true, 
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    minAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    eligibilityCriteria: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    usageLimit: {
      type: Number,
      required: function () {
        return !this.noUsageLimit; 
      },
    },
    noUsageLimit: {
      type: Boolean,
      default: false, 
    },
    usedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
    }],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true, 
  }
);

module.exports={
    AdminModel:mongoose.model('admin',adminSchema),
    CategoryModel:mongoose.model('categories',categorySchema),
    ProductModel:mongoose.model('products',ProductSchema),
    CouponModel : mongoose.model('Coupon', couponSchema)
}