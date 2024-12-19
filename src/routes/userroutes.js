const {Router}=require('express')
const userController=require('../controlls/usercontroller')
const passport=require('passport')
const jwtAuthentication=require('../../middleware/jwtauth')
const {checklogin}=require('../../middleware/checkLogedin')
const checkUser=require('../../middleware/checkUser')
const router=Router()

router.get('/login',checklogin,userController.userloginget)
router.post('/login',userController.userloginpost)
router.get('/logout',userController.userLogoutGet)
router.get('/signup',userController.usersignupget)
router.post('/signup',userController.usersignuppost)
router.get('/emailotp',userController.useremailotpget)
router.post('/emailotp',userController.useremailotppost)
router.post('/newemailotp',userController.newuseremailotppost)
router.get("/google/auth",userController.googleLoginRoute);
router.get("/auth/google/callback",userController.googleAuthCallback);
router.get('/home',checkUser,userController.userhomeget)
router.get('/home/productdetails/:id',checkUser,jwtAuthentication,userController.ProductDetails)
router.get('/home/products/viewallproducts',checkUser,jwtAuthentication,userController.viewallproducts)




module.exports=router;