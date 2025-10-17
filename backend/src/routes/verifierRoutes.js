import express from "express";
import Stake from "../models/Stake.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/update", verifyToken, checkRole(["verifier"]), async (req, res) => {
  try {
    const { stakeId, isWinner, actualScore, rewardAmount } = req.body;

    const stake = await Stake.findOne({ stakeId });
    if (!stake) return res.status(404).json({ message: "Stake not found" });

    stake.isWinner = isWinner;
    stake.actualScore = actualScore;
    stake.rewardAmount = rewardAmount;
    stake.status = "verified";
    await stake.save();

    res.json({ success: true, stake });
  } catch (err) {
    res.status(500).json({ message: "Error updating stake", error: err.message });
  }
});

export default router;
