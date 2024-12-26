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
router.post('/newemailotp',userController.resendEmailOtpPost)
router.get('/forgotpassword',userController.forgotPassword)
router.get('/newpassword',userController.newPassword)
router.post('/newpassword',userController.newPasswordPost)
router.post('/forgotpassword',checkUser,userController.forgotPasswordPost)
router.get("/google/auth",userController.googleLoginRoute);
router.get("/auth/google/callback",userController.googleAuthCallback);
router.get('/home',checkUser,userController.userhomeget)
router.get('/home/productdetails/:id',checkUser,userController.ProductDetails)
router.get('/home/products/viewallproducts/:id',checkUser,userController.viewallproducts)
router.get('/home/accountsettings',jwtAuthentication,checkUser,userController.myAccountSettings)
router.get('/home/shoppingcart',jwtAuthentication,checkUser,userController.shoppingCart)
router.get('/home/shoppingcartfetch',jwtAuthentication,checkUser,userController.shoppingCartFetch)
router.post('/home/productdetails/addtocart',jwtAuthentication,checkUser,userController.addToCart)
router.delete('/home/cart/remove',jwtAuthentication,checkUser,userController.CartRemove)
router.post('/home/cart/quantityedit',jwtAuthentication,checkUser,userController.quantityEdit)
router.get('/home/shoppingcart/checkout',jwtAuthentication,checkUser,userController.checkOut)







module.exports=router;