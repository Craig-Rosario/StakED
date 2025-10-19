import express from "express";
import { 
  createExam, 
  stakeOnStudent, 
  getExamInfo, 
  submitGrades, 
  getUserStakes, 
  claimReward 
} from "../controllers/examController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Exam Management Routes
router.post("/create", verifyToken, createExam);
router.get("/:examId", verifyToken, getExamInfo);

// Staking Routes  
router.post("/stake", verifyToken, stakeOnStudent);
router.get("/stakes/user", verifyToken, getUserStakes);

// Grading Routes (Verifier only)
router.post("/submit-grades", verifyToken, submitGrades);

// Claiming Routes
router.post("/claim", verifyToken, claimReward);

export default router;