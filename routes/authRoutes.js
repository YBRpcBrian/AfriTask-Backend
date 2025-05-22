const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController"); // Import the controller functions

// Route to register a new user
router.post("/register", registerUser);

// Route to login a user and generate JWT token
router.post("/login", loginUser);

module.exports = router;
