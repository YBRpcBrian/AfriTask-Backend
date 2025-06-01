// Import necessary modules at the top
require("dotenv").config();
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes"); // Import authentication routes
const path = require("path");

// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

// Ensure JWT secret is loaded
console.log(process.env.JWT_SECRET_KEY); // Make sure this prints your JWT secret

const app = express();

// CORS setup to accept every request and from every header
const corsOptions = {
  origin: "*", // Allow requests from any origin
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allow common HTTP methods
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"], // Allow headers
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

// Middleware setup
app.use(express.json()); // For parsing JSON bodies
app.use(cors(corsOptions)); // Apply the CORS options

// Serve static files (uploads) for profile images, etc.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const walletRoutes = require("./routes/walletRoutes"); // Import wallet routes
const momoRoutes = require("./routes/momoRoutes"); // <-- Import the route

// Use the auth routes for authentication-related endpoints
app.use("/api/auth", authRoutes); // Prefix all auth routes with /api/auth
app.use("/api/wallet", walletRoutes);
app.use("/api/momo", momoRoutes); // <-- Use the route

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
