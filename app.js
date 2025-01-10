const express=require('express');
const app=express();
const userRoutes=require('./src/routes/userroutes')
const session =require('express-session');
const mongoose=require('mongoose')
const passport=require('./src/config/passport')
const cookieParser=require('cookie-parser')
const adminRoutes=require('./src/routes/adminroutes')
require('dotenv').config()


app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');  
    res.setHeader('Pragma', 'no-cache');  
    res.setHeader('Expires', '0');  
    next();
  });  
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(session({
    secret:process.env.SECRET_KEY,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        maxAge:60000*5
    }
}))

app.use(passport.initialize());
app.use(express.static('public'))
app.set('view engine','ejs')




const url=process.env.MONGODBURL
const Port=process.env.PORT;
mongoose.connect(url).then(()=>{
    console.log("mongodb Connected");
    app.listen(Port,()=>{
        console.log("port connected");
        
    })
})


app.use('/',userRoutes)
app.use('/admin',adminRoutes)
