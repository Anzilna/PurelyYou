


module.exports.generateReferralToken = function (userId) {
    return Buffer.from(userId.toString()).toString('base64');

}