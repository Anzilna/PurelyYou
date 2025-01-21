const {Router}=require('express')
const userController=require('../controlls/usercontroller')
const fetchController=require('../controlls/fetchUserController')
const passport=require('passport')
const jwtAuthentication=require('../../middleware/jwtauth')
const {checklogin}=require('../../middleware/checkLogedin')
const checkUser=require('../../middleware/checkUser')
const router=Router()

router.get('/login',userController.userloginget)
router.post('/login',userController.userloginpost)
router.get('/logout',userController.userLogoutGet)
router.get('/signup',userController.usersignupget)
router.post('/signup',userController.usersignuppost)
router.get('/emailotp',userController.useremailotpget)
router.post('/emailotp',userController.useremailotppost)
router.post('/newemailotp',userController.resendEmailOtpPost)
router.get('/forgotpassword',checklogin,userController.forgotPassword)
router.get('/newpassword',checklogin,userController.newPassword)
router.post('/newpassword',userController.newPasswordPost)
router.post('/forgotpassword',checkUser,userController.forgotPasswordPost)
router.get("/google/auth",userController.googleLoginRoute);
router.get("/user/auth/google/callback",userController.googleAuthCallback);
router.get('/',checkUser,userController.userhomeget)
router.get('/productdetails/:id',checkUser,userController.ProductDetails)
router.get('/products/viewallproducts',checkUser,userController.viewallproducts)
router.post('/products/viewallproducts/filter',checkUser,fetchController.viewallproductsFilter)
router.post('/productdetails/addfavourites',jwtAuthentication,checkUser,userController.addFavourites)
router.post('/productdetails/addtocart',jwtAuthentication,checkUser,userController.addToCart)


router.get('/accountsettings',jwtAuthentication,checkUser,userController.myAccountSettings)
router.get('/accountsettings/inviteafriend',jwtAuthentication,checkUser,userController.inviteaFriend)
router.get('/accountsettings/orders',jwtAuthentication,checkUser,userController.ordersView)
router.get('/accountsettings/pendingorders',jwtAuthentication,checkUser,fetchController.pendingOrders)
router.put('/accountsettings/cancelorders/:id',jwtAuthentication,checkUser,fetchController.cancelOrder )
router.get('/accountsettings/orderdetails/:id',jwtAuthentication,checkUser,userController.ordersViewDetails)
router.post('/accountsettings/orderdetails/return',jwtAuthentication,checkUser,fetchController.ordersReturnPost)
router.get('/accountsettings/orderinvoice/:id',jwtAuthentication,checkUser,fetchController.orderInvoice)

router.get('/accountsettings/mydetailsedit/:id',jwtAuthentication,checkUser,userController.myDetailsedit)
router.post('/accountsettings/mydetailsedit/',jwtAuthentication,checkUser,userController.myDetailseditPost)
router.get('/accountsettings/address',jwtAuthentication,checkUser,userController.AddressGet)
router.get('/accountsettings/address/editaddress/:id',jwtAuthentication,checkUser,userController.AddressEditGet)
router.post('/accountsettings/address/editaddress/:id',jwtAuthentication,checkUser,userController.AddressEditPost)
router.delete('/accountsettings/address/removeaddress/:id',jwtAuthentication,checkUser,userController.AddressDelete)
router.get('/accountsettings/address/addaddress',jwtAuthentication,checkUser,userController.AddAddressGet)
router.post('/accountsettings/address/addaddress',jwtAuthentication,checkUser,userController.AddAddressGetPost)
router.get('/accountsettings/wallet',jwtAuthentication,checkUser,fetchController.walletFetchGet)
router.get('/accountsettings/walletdetails',jwtAuthentication,checkUser,fetchController.walletDetailsFetchGet)
router.post('/accountsettings/wallet/addmoney',jwtAuthentication,checkUser,fetchController.walletAddMoneyFetchGet)
router.get('/favouritesfetch',jwtAuthentication,checkUser,fetchController.favouritesFetchGet)
router.get('/favourites',jwtAuthentication,checkUser,userController.favouritesGet)
router.delete('/favourites/remove',jwtAuthentication,checkUser,fetchController.favouritesRemoveFetch)
router.get('/shoppingcart',jwtAuthentication,checkUser,userController.shoppingCart)
router.get('/shoppingcartfetch',jwtAuthentication,checkUser,userController.shoppingCartFetch)
router.delete('/cart/remove',jwtAuthentication,checkUser,userController.CartRemove)
router.post('/cart/quantityedit',jwtAuthentication,checkUser,userController.quantityEdit)
router.get('/shoppingcart/checkout',jwtAuthentication,checkUser,userController.checkOut)
router.get('/shoppingcart/checkoutfetch',jwtAuthentication,checkUser,userController.checkOutFetch)
router.post('/shoppingcart/checkout/couponapply',jwtAuthentication,checkUser,fetchController.CoupponApply)
router.post('/shoppingcart/checkout/order',jwtAuthentication,checkUser,userController.orderSave)
router.post('/razorpay/createorder',jwtAuthentication,checkUser,fetchController.razorpayCreateOrder)
router.post('/razorpay/verifypayment',jwtAuthentication,checkUser,fetchController.razorpayPaymentVerify)

router.get('/shoppingcart/checkout/orderplaced/:id',jwtAuthentication,checkUser,userController.orderPlacedSuccess)
router.get('/shoppingcart/checkout/orderplaced/orderdetails/:id',jwtAuthentication,checkUser,fetchController.orderPlacedSuccessDetails)








module.exports=router;