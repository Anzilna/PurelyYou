const nodemailer = require("nodemailer");
const crypto = require("crypto");
const session = require("express-session");
const { Otp } = require("../../model/usermodel");

//for generating otp
const genarateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// email sending
const sendEmailAndStore = async (email, otp, type) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const maildetails = {
    from: process.env.EMAIL,
    to: email,
    subject: "OTP for Email Verification",
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  try {
    const result = await transporter.sendMail(maildetails);

    const otpexpire = Date.now() + 300000;

    const otpuser = new Otp({
      otp: otp,
      otptype: type.toString(),
      otpexpire: otpexpire,
    });
    await otpuser.save();

    return result;
  } catch (error) {
    console.error("Failed to send email and store:", error.message);
    throw new Error("Failed to send OTP email and store");
  }
};

const errorHandling = (err) => {
  const error = {
    email: "",
    password: "",
    username: "",
  };

  //for duplicate error
  if (err.message.includes("E11000")) {
    error.email = "email is already registered";
    return error;
  }

  //for normal errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      error[properties.path] = properties.message;
    });
  }

  return error;
};

//error handling in schema
const errorHandlingCategory = (err) => {
  const error = {
    categoryname: "",
    image: "",
    description: "",
  };

  //for duplicate error
  if (err.message.includes("E11000")) {
    error.categoryname = "category is already registered";
    return error;
  }

  //for normal errors
  if (err.message.includes("categories validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      error[properties.path] = properties.message;
    });
  }
  if (err.message.includes("image")) {
    error.image = "please add image";
    return error;
  }

  return error;
};

module.exports = {
  genarateOtp,
  sendEmailAndStore,
  errorHandling,
  errorHandlingCategory,
};
