import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("username walletAddress role createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { username: username.trim() },
      { new: true } 
    ).select("username walletAddress role createdAt"); 

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
});

/**
 * @route PUT /api/users/update-wallet
 * @desc Update user wallet address
 * @access Private
 */
router.put("/update-wallet", verifyToken, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !walletAddress.trim()) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    // Validate Ethereum address format
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(walletAddress.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid Ethereum address format",
      });
    }

    // Check if wallet address is already in use by another user
    const existingUser = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase(),
      _id: { $ne: req.user.userId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This wallet address is already registered to another user",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true } 
    ).select("username walletAddress role createdAt"); 

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Wallet address updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating wallet address:", err);
    res.status(500).json({
      success: false,
      message: "Error updating wallet address",
    });
  }
});

export default router;
