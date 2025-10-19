import express from "express";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";
import Class from "../models/Class.js";
import Exam from "../models/Exam.js";
import Stake from "../models/Stake.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/stats", verifyToken, checkRole(["verifier"]), async (req, res) => {
  try {
    const verifierId = req.user.userId;

    const totalClasses = await Class.countDocuments({ verifier: verifierId });

    let totalExams = 0;
    try {
      totalExams = await Exam.countDocuments({ verifier: verifierId });
    } catch {
      console.log("Exam model not found — skipping exam count");
    }

    res.json({
      success: true,
      totalClasses,
      totalExams,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching stats",
      error: err.message,
    });
  }
});

// Submit grades for an exam
router.post("/submit-grades", verifyToken, checkRole(["verifier"]), async (req, res) => {
  try {
    const { examId, studentGrades } = req.body;
    const verifierId = req.user.userId;

    // Validate input
    if (!examId || !studentGrades || !Array.isArray(studentGrades)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request: examId and studentGrades array are required"
      });
    }

    // Verify the exam exists and belongs to this verifier
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found"
      });
    }

    if (exam.verifier.toString() !== verifierId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only grade your own exams"
      });
    }

    // Get all stakes for this exam
    const stakes = await Stake.find({ exam: examId }).populate('student');
    
    if (stakes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No stakes found for this exam"
      });
    }

    // Process each student grade
    const updates = [];
    const winners = [];
    const losers = [];
    let totalWinnerStake = 0;
    let totalLoserStake = 0;

    for (const grade of studentGrades) {
      const { studentId, mark } = grade;
      
      if (typeof mark !== 'number' || mark < 0 || mark > 100) {
        return res.status(400).json({
          success: false,
          message: `Invalid mark for student ${studentId}: must be between 0 and 100`
        });
      }

      // Find stakes for this student (both self-stakes and peer stakes on this student)
      const studentStakes = stakes.filter(stake => 
        stake.candidateAddress === studentId || 
        (stake.student._id.toString() === studentId && stake.isSelfStake)
      );

      for (const stake of studentStakes) {
        const isWinner = mark >= stake.targetThreshold;
        
        updates.push({
          stakeId: stake._id,
          actualScore: mark,
          isWinner: isWinner,
          status: 'verified'
        });

        if (isWinner) {
          winners.push(stake);
          totalWinnerStake += stake.stakeAmount;
        } else {
          losers.push(stake);
          totalLoserStake += stake.stakeAmount;
        }
      }
    }

    // Calculate rewards for winners
    if (totalWinnerStake > 0 && totalLoserStake > 0) {
      for (const winner of winners) {
        const rewardShare = (winner.stakeAmount / totalWinnerStake) * totalLoserStake;
        const totalReward = winner.stakeAmount + rewardShare;
        
        await Stake.findByIdAndUpdate(winner._id, {
          actualScore: winner.actualScore,
          isWinner: true,
          rewardAmount: totalReward,
          status: 'verified'
        });
      }
    }

    // Update losers
    for (const loser of losers) {
      await Stake.findByIdAndUpdate(loser._id, {
        actualScore: loser.actualScore,
        isWinner: false,
        rewardAmount: 0,
        status: 'verified'
      });
    }

    // Update exam status
    await Exam.findByIdAndUpdate(examId, {
      status: 'graded',
      gradedAt: new Date()
    });

    res.json({
      success: true,
      message: "Grades submitted successfully",
      data: {
        totalStakes: stakes.length,
        winners: winners.length,
        losers: losers.length,
        totalWinnerStake,
        totalLoserStake
      }
    });

  } catch (err) {
    console.error("Error submitting grades:", err);
    res.status(500).json({
      success: false,
      message: "Error submitting grades",
      error: err.message,
    });
  }
});

export default router;
