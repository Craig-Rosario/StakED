import express from "express";
import Class from "../models/Class.js";
import Exam from "../models/Exam.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/classes
 * @desc Create a new class
 * @access Private (verifier | teacher)
 */
router.post("/", verifyToken, checkRole(["verifier", "teacher"]), async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Name and code are required" });
    }

    const existing = await Class.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Class code already exists" });
    }

    const newClass = new Class({
      name: name.trim(),
      code: code.toUpperCase(),
      description: description || "",
      verifier: req.user.userId,
      teacher: req.user.userId,
    });

    await newClass.save();
    res.status(201).json({ success: true, message: "Class created successfully", class: newClass });
  } catch (err) {
    console.error("Error creating class:", err);
    res.status(500).json({ success: false, message: "Failed to create class", error: err.message });
  }
});

/**
 * @route GET /api/classes
 * @desc Get all classes for the logged-in verifier
 * @access Private (verifier | teacher)
 */
router.get("/", verifyToken, checkRole(["verifier", "teacher"]), async (req, res) => {
  try {
    const classes = await Class.find({ verifier: req.user.userId })
      .populate("verifier", "walletAddress username")
      .sort({ createdAt: -1 });

    res.json({ success: true, classes });
  } catch (err) {
    console.error("Error fetching classes:", err);
    res.status(500).json({ success: false, message: "Error fetching classes" });
  }
});

/**
 * @route GET /api/classes/:id
 * @desc Get full class details (students + exams)
 * @access Private (verifier | teacher)
 */
router.get("/:id", verifyToken, checkRole(["verifier", "teacher"]), async (req, res) => {
  try {
    const { id } = req.params;

    const cls = await Class.findById(id)
      .populate("verifier", "walletAddress username")
      .populate("students", "walletAddress username")
      .lean();

    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const exams = await Exam.find({ class: id }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      class: cls,
      students: cls.students || [],
      exams,
    });
  } catch (err) {
    console.error("Error fetching class details:", err);
    res.status(500).json({ success: false, message: "Error fetching class details" });
  }
});

/**
 * @route POST /api/classes/:id/exams
 * @desc Create an exam for a specific class
 * @access Private (verifier | teacher)
 */
router.post("/:id/exams", verifyToken, checkRole(["verifier", "teacher"]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      examDate,
      stakeDeadline,
      commitDeadline,
      revealDeadline,
      maxMarks,
    } = req.body;

    if (!name || !examDate || !stakeDeadline) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const baseDate = new Date(examDate);
    const commit = commitDeadline || new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    const reveal = revealDeadline || new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000);

    const newExam = new Exam({
      name,
      description,
      class: id, 
      maxMarks,
      examDate,
      stakeDeadline,
      commitDeadline: commit,
      revealDeadline: reveal,
    });

    await newExam.save();

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam: newExam,
    });
  } catch (err) {
    console.error("Error creating exam:", err);
    res.status(500).json({ success: false, message: "Failed to create exam", error: err.message });
  }
});

export default router;
