const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    totalBalance: {
      type: Number,
      default: 100000, // Initial balance is 100000FCFA
    },
    pendingMoney: {
      type: Number,
      default: 0, // Money in pending state
    },
    withdrawn: {
      type: Number,
      default: 0, // Money already withdrawn
    },
    transactions: [
      {
        transactionId: {
          type: String,
          required: true,
          unique: true, // Ensures each transaction has a unique ID
        },
        date: {
          type: Date,
          default: Date.now, // Default to current date
        },
        type: {
          type: String,
          enum: ["withdraw", "deposit"], // Can only be withdraw or deposit
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0, // Prevents negative values
        },
        status: {
          type: String,
          enum: ["completed", "pending"], // Status of the transaction
          default: "pending",
        },
        paymentGateway: {
          type: String,
          enum: ["orange", "mtn"], // Payment options
          required: true,
        },
      },
    ],
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const Wallet = mongoose.model("Wallet", WalletSchema);

module.exports = Wallet;
