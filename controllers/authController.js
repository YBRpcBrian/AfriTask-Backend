const User = require("../models/User"); // Import the User model
const jwt = require("jsonwebtoken");
const Wallet = require("../models/Wallet");
const upload = require("../config/multerConfig"); // Import the multer config
const fs = require("fs");
const path = require("path");

// Register new user with image upload
exports.registerUser = [
    upload.single("profileImage"), // Multer middleware for handling image upload
    async (req, res) => {
      try {
        console.log("Request received at /register");
  
        const { fullName, email, phone, password, userType } = req.body;
        console.log("Received data:", { fullName, email, phone, userType });
  
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          console.log("User already exists:", email);
          return res.status(400).json({ message: "User already exists!" });
        }
  
        let profileImagePath = "";
        if (req.file) {
          profileImagePath = `/uploads/profileImages/${req.file.filename}`;
  
          // Check if the uploads folder exists
          const uploadDir = path.join(__dirname, "..", "uploads", "profileImages");
          if (!fs.existsSync(uploadDir)) {
            console.error("Upload directory does not exist:", uploadDir);
            return res.status(500).json({ message: "Upload directory missing" });
          }
  
          console.log("Profile image uploaded successfully:", profileImagePath);
        }
  
        // Create new user (storing password as plain text)
        const newUser = new User({
          fullName,
          email,
          phone,
          password, // Plain text password
          userType,
          profileImage: profileImagePath,
        });
  
        // Save the user to the database
        await newUser.save();
        console.log("User registered successfully:", newUser.email);
  
        // Create a Wallet for the user with an initial balance of 100,000 FCFA
        const newWallet = new Wallet({
          userId: newUser._id,
          totalBalance: 100000, // Initial balance
          pendingMoney: 0,
          withdrawn: 0,
          transactions: [], // Empty transactions initially
        });
  
        // Save the wallet to the database
        await newWallet.save();
        console.log("Wallet created for user:", newUser.email);
  
        // Send success response
        res.status(201).json({
          message: "User registered successfully",
          user: {
            fullName: newUser.fullName,
            email: newUser.email,
            phone: newUser.phone,
            userType: newUser.userType,
            profileImage: newUser.profileImage,
          },
          wallet: {
            totalBalance: newWallet.totalBalance,
            pendingMoney: newWallet.pendingMoney,
            withdrawn: newWallet.withdrawn,
            transactions: newWallet.transactions,
          },
        });
      } catch (error) {
        console.error("Error in registerUser:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
      }
    },
  ];

// Login user and generate JWT token
exports.loginUser = async (req, res) => {
  try {
    console.log("Request received at /login");

    const { email, password } = req.body;
    console.log("Received login attempt for:", email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare passwords (plain text)
    if (password !== user.password) {
      console.log("Incorrect password for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" } // Token expiration time
    );

    console.log("Login successful:", email);

    // Send response with token and user data
    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
