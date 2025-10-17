const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ethers } = require('ethers');
const User = require('../models/User');

const authController = {
  // Get nonce for wallet signing
  getNonce: async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address required' });
      }

      const nonce = crypto.randomBytes(32).toString('hex');
      
      let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      
      if (!user) {
        // Return nonce for new user registration
        return res.json({ 
          nonce,
          isNewUser: true 
        });
      }

      // Update existing user's nonce
      user.nonce = nonce;
      await user.save();

      res.json({ 
        nonce,
        isNewUser: false 
      });
    } catch (error) {
      res.status(500).json({ message: 'Error generating nonce', error: error.message });
    }
  },

  // Verify signature and authenticate
  verifySignature: async (req, res) => {
    try {
      const { walletAddress, signature, nonce, username, role } = req.body;

      if (!walletAddress || !signature || !nonce) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Verify signature
      const message = `StakED Login Nonce: ${nonce}`;
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ message: 'Invalid signature' });
      }

      let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

      if (!user) {
        // Create new user
        if (!username || !role) {
          return res.status(400).json({ message: 'Username and role required for new user' });
        }

        user = new User({
          walletAddress: walletAddress.toLowerCase(),
          username,
          role,
          nonce: crypto.randomBytes(32).toString('hex')
        });

        await user.save();
      } else {
        // Verify nonce matches
        if (user.nonce !== nonce) {
          return res.status(401).json({ message: 'Invalid nonce' });
        }
        
        // Update nonce for security
        user.nonce = crypto.randomBytes(32).toString('hex');
        await user.save();
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          walletAddress: user.walletAddress,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Authentication failed', error: error.message });
    }
  }
};

module.exports = authController;
