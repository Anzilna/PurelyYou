const multer=require('multer')



const storage=multer.diskStorage({
    destination:(req,res,cb)=>{
      cb(null,'public/uploads');
    },
    filename:(req,file,cb)=>{
        const uniqueName=`${Date.now()}-${file.originalname}`
    cb(null,uniqueName);
    }
})

const upload=multer({
    storage,
    limits:{
        fileSize: 2 * 1024 * 1024
    }
})

module.exports=upload;