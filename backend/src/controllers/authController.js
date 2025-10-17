import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ethers } from "ethers";
import User from "../models/User.js";

const generateNonce = () => crypto.randomBytes(16).toString("hex");

export const authController = {
  getNonce: async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) return res.status(400).json({ success: false, message: "Wallet address is required." });

      const lowerWallet = walletAddress.toLowerCase();
      let user = await User.findOne({ walletAddress: lowerWallet });
      const nonce = generateNonce();

      if (!user) {
        return res.status(200).json({
          success: true,
          isNewUser: true,
          nonce,
          message: "New user. Proceed with signup after signature verification.",
        });
      }

      user.nonce = nonce;
      await user.save();

      res.status(200).json({
        success: true,
        isNewUser: false,
        nonce,
        message: "Nonce generated successfully.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error while generating nonce." });
    }
  },

  verifySignature: async (req, res) => {
    try {
      const { walletAddress, signature, nonce, username, role } = req.body;
      if (!walletAddress || !signature || !nonce)
        return res.status(400).json({ success: false, message: "Missing required fields." });

      const message = `StakED Login Nonce: ${nonce}`;
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase())
        return res.status(401).json({ success: false, message: "Invalid signature." });

      const lowerWallet = walletAddress.toLowerCase();
      let user = await User.findOne({ walletAddress: lowerWallet });

      if (!user) {
        if (!username || !role)
          return res.status(400).json({ success: false, message: "Username and role required for new user." });

        user = new User({
          walletAddress: lowerWallet,
          username,
          role,
          nonce: generateNonce(),
        });

        await user.save();
      } else {
        if (user.nonce !== nonce)
          return res.status(401).json({ success: false, message: "Invalid or expired nonce." });

        user.nonce = generateNonce();
        await user.save();
      }

      if (!process.env.JWT_SECRET)
        return res.status(500).json({ success: false, message: "Server misconfiguration." });

      const token = jwt.sign(
        {
          userId: user._id,
          walletAddress: user.walletAddress,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          username: user.username,
          role: user.role,
        },
        message: "Authentication successful.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Authentication failed.", error: error.message });
    }
  },
};
