const jwt = require("jsonwebtoken");
require("dotenv").config();

const logInNotification = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      if(!decodedToken){
        req.userforlogin = "";
      next();
    }

      req.userforlogin = decodedToken.id;
      next();
    } catch (error) {
      req.userforlogin = "";
      next();
    }
  } else {
    req.userforlogin = "";
    next();
  }
};

module.exports = {
    logInNotification,
};
