import express from "express";
import Stake from "../models/Stake.js";
import Class from "../models/Class.js";
import Exam from "../models/Exam.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new stake
router.post("/", verifyToken, checkRole(["student"]), async (req, res) => {
  try {
    const { examId, candidateAddress, stakeAmount, confidence, isSelfStake } = req.body;

    // Validate required fields
    if (!examId || !stakeAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "examId and stakeAmount are required" 
      });
    }

    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: "Exam not found" 
      });
    }

    // Check if staking is still allowed
    if (new Date() > new Date(exam.stakeDeadline)) {
      return res.status(400).json({ 
        success: false, 
        message: "Staking deadline has passed" 
      });
    }

    const stake = new Stake({
      stakeId: Math.floor(Math.random() * 1000000),
      student: req.user.userId,
      exam: examId,
      candidateAddress: candidateAddress || "self",
      stakeAmount: parseFloat(stakeAmount),
      confidence: confidence || 50,
      isSelfStake: isSelfStake || false,
      status: "pending",
    });

    await stake.save();
    res.status(201).json({ success: true, stake });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Error creating stake", 
      error: err.message 
    });
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
