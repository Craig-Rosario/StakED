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

export default router;
