const express = require("express");
const router = express.Router();

const {
  depositController,
  disburseController,
} = require("../controllers/momoController");

// @route   POST /api/momo/deposit
// @desc    Collect payment (user deposit)
// @access  Public or Authenticated (depends on your app)
router.post("/deposit", depositController);

// @route   POST /api/momo/disburse
// @desc    Disburse payment (send to user)
// @access  Public or Authenticated
router.post("/disburse", disburseController);

module.exports = router;
