const express = require("express");
const router = express.Router();
const { createTransaction } = require("../controllers/walletController");

// Route to create a transaction (deposit or withdrawal)
router.post("/transaction", createTransaction);

module.exports = router;
