import express from "express";
import Stake from "../models/Stake.js";
import Class from "../models/Class.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, checkRole(["student"]), async (req, res) => {
  try {
    const { classId, stakeAmount, targetThreshold } = req.body;

    const stake = new Stake({
      stakeId: Math.floor(Math.random() * 1000000),
      student: req.user.userId,
      class: classId,
      stakeAmount,
      targetThreshold,
      status: "pending",
    });

    await stake.save();
    res.status(201).json({ success: true, stake });
  } catch (err) {
    res.status(500).json({ message: "Error creating stake", error: err.message });
  }
});

router.get("/my-stakes", verifyToken, checkRole(["student"]), async (req, res) => {
  try {
    const stakes = await Stake.find({ student: req.user.userId }).populate("class");
    res.json({ success: true, stakes });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stakes", error: err.message });
  }
});

export default router;
