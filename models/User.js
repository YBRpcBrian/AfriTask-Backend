const mongoose = require("mongoose");
const crypto = require("crypto");

// User Schema
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // Password should be at least 6 characters
    },
    userType: {
      type: String,
      enum: ["freelancer", "job-owner"],
      default: "freelancer", // Default to freelancer
    },
    profileImage: {
      type: String, // URL or path to image
      default: "", // Can be empty initially
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
