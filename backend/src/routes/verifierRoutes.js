import express from "express";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";
import Class from "../models/Class.js";
import Exam from "../models/Exam.js"; 

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

export default router;
