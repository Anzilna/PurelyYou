const jwt = require('jsonwebtoken');
const { User, Cart, Favourite } = require('../model/usermodel');
require('dotenv').config();

const checkUser = async (req, res, next) => {
    const token = req.cookies.jwt;
    console.log('Token from user check:', token);

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                console.log('Error in check user');
                console.error('JWT verification error:', err.message);
                res.locals.localsUser = null;
                next();
            } else {
                try {
                    const userObj = await User.findById(decodedToken.id);
                    const user = userObj.toObject()

                    const cart = await Cart.findOne({ userId: user._id });
                    const favourites = await Favourite.findOne({ userId: user._id });
console.log(cart,favourites);

                    user.cartCount = cart.items.length || 0;
                    user.favouritesCount = favourites.items.length || 0;

                    res.locals.localsUser = user;
                    req.userdata = user;

                    console.log('User with cart and favourites count:', res.locals.localsUser);

                    next();
                } catch (error) {
                    console.log('Error:', error);
                    next();
                }
            }
        });
    } else {
        res.locals.localsUser = null;
        next();
    }
};

module.exports = checkUser;
