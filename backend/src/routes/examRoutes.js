import express from "express";
import { 
  createExam, 
  stakeOnStudent, 
  getExamInfo, 
  submitGrades, 
  getUserStakes, 
  claimReward,
  getStudentStakeStatus,
  markStakesClaimed
} from "../controllers/examController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Exam Management Routes
router.post("/create", verifyToken, createExam);
router.get("/:examId", verifyToken, getExamInfo);

// Staking Routes  
router.post("/stake", verifyToken, stakeOnStudent);
router.get("/stakes/user", verifyToken, getUserStakes);
router.get("/:examId/stake-status", verifyToken, getStudentStakeStatus);

// Grading Routes (Verifier only)
router.post("/submit-grades", verifyToken, submitGrades);

// Claiming Routes
router.post("/claim", verifyToken, claimReward);
router.post("/mark-claimed", verifyToken, markStakesClaimed);

export default router;