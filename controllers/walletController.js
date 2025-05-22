const Wallet = require("../models/Wallet");
const { v4: uuidv4 } = require("uuid");
const fapshi = require("../config/fapshi"); // Import Fapshi API integration

exports.createTransaction = async (req, res) => {
  try {
    console.log("Incoming transaction request:", req.body);

    const { userId, fullName, email, type, paymentMethod, momoName, momoNumber, amount } = req.body;

    // Validate required fields
    if (!userId || !fullName || !email || !type || !paymentMethod || !momoName || !momoNumber || !amount) {
      console.error("Validation error: Missing required fields");
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Ensure amount is positive
    if (amount <= 0) {
      console.error("Validation error: Amount must be greater than zero.");
      return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    // Validate mobile number format (for Fapshi API)
    if (!/^6[\d]{8}$/.test(momoNumber)) {
      console.error("Validation error: Invalid mobile number format.");
      return res.status(400).json({ message: "Invalid mobile number format." });
    }

    // Find user's wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      console.error("Wallet not found for userId:", userId);
      return res.status(404).json({ message: "Wallet not found!" });
    }

    let newTransaction = {
      transactionId: uuidv4(), // Unique transaction ID
      date: new Date(),
      type,
      amount: Number(amount),
      status: "pending", // Set status to pending until payment is completed
      paymentGateway: paymentMethod,
    };

    if (type === "deposit") {
      console.log("Processing deposit:", { userId, amount });

      // Initiate payment through Fapshi API
      const fapshiData = {
        amount: Number(amount),
        email: email,
        userId: userId,
        externalId: uuidv4(),
        redirectUrl: "http://localhost:5173/success",
        message: `Deposit of ${amount} XAF`,
      };

      const fapshiResponse = await fapshi.initiatePay(fapshiData);

      if (!fapshiResponse || fapshiResponse.statusCode !== 200) {
        console.error("Fapshi API Error:", fapshiResponse?.message || "No response received.");
        return res.status(400).json({ message: "Payment initiation failed!" });
      }

      // Save the transaction but do NOT update the balance yet
      wallet.transactions.push(newTransaction);
      await wallet.save();

      return res.status(201).json({
        message: "Deposit initiated. Please complete the payment.",
        transaction: newTransaction,
        paymentLink: fapshiResponse.link || "", // Ensure the link exists
      });
    } 
    else if (type === "withdraw") {
      console.log("Processing withdrawal:", { userId, amount });

      if (wallet.totalBalance < amount) {
        console.error("Insufficient balance:", { totalBalance: wallet.totalBalance, withdrawalAmount: amount });
        return res.status(400).json({ message: "Insufficient balance!" });
      }

      // Initiate Payout via Fapshi
      const payoutData = {
        amount: Number(amount),
        phone: momoNumber,
        medium: paymentMethod,
        name: momoName,
        email: email,
        userId: userId,
        externalId: uuidv4(),
        message: `Withdrawal of ${amount} XAF`,
      };

      const payoutResponse = await fapshi.payout(payoutData);

      if (!payoutResponse || payoutResponse.statusCode !== 200) {
        console.error("Fapshi Payout Error:", payoutResponse?.message || "No response received.");
        return res.status(400).json({ message: "Payout failed!" });
      }

      // Deduct balance and mark as withdrawn
      wallet.totalBalance -= Number(amount);
      wallet.withdrawn += Number(amount);
      wallet.transactions.push(newTransaction);
      await wallet.save();

      return res.status(201).json({
        message: "Withdrawal successful",
        transaction: newTransaction,
        wallet,
      });
    }

    return res.status(400).json({ message: "Invalid transaction type!" });

  } catch (error) {
    console.error("Error processing transaction:", error.message, error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
