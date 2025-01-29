const { Wallet, walletTransaction } = require("../../model/usermodel");

module.exports.walletTransaction = async (amount, type, description, user) => {
  try {
    if (!amount || !type || !description || !user) {
      throw new Error(
        "All fields are required: amount, type, description, and user."
      );
    }

    let wallet = await Wallet.findOne({ userId: user });
    if (!wallet) {
      wallet = new Wallet({
        userId: user,
        balance: 0,
      });
      await wallet.save();
    }

    if (type === "DEBIT") {
      if (wallet.balance < amount) {
        throw new Error("Insufficient wallet balance.");
      }
      wallet.balance -= amount;
    } else if (type === "CREDIT") {
      wallet.balance += amount;
    } else {
      throw new Error("Invalid transaction type. Use 'DEBIT' or 'CREDIT'.");
    }

    const transaction = new walletTransaction({
      userId: user,
      walletId: wallet._id,
      transactionId: `txn-${Date.now()}`,
      type,
      description,
      date: new Date(),
      amount,
    });

    await transaction.save();
    await wallet.save();

    return {
      success: true,
      message: "Transaction completed successfully.",
      transaction,
    };
  } catch (error) {
    console.error("Error in walletTransaction:", error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};
