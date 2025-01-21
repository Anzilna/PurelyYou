module.exports.decodeReferralToken = function (token) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      return decoded; 
    } catch (error) {
      console.error("Error decoding referral token:", error);
      throw new Error("Invalid referral token.");
    }
  } 