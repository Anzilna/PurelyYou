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
  }

},{
    timestamps:true
})
module.exports={
    AdminModel:mongoose.model('admin',adminSchema),
    CategoryModel:mongoose.model('categories',categorySchema),
    ProductModel:mongoose.model('products',ProductSchema)
}