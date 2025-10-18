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
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (err) {
    console.error("Error creating class:", err);
    res.status(500).json({ success: false, message: "Error creating class" });
  }
});

/**
 * @route GET /api/classes
 * @desc Get all classes for the current verifier
 * @access Private (verifier | teacher)
 */
router.get("/", verifyToken, checkRole(["verifier", "teacher"]), async (req, res) => {
  try {
    const classes = await Class.find({ verifier: req.user.userId })
      .populate("students", "walletAddress username")
      .sort({ createdAt: -1 });

    // Get exam count for each class
    const classesWithExamCount = await Promise.all(
      classes.map(async (cls) => {
        const examCount = await Exam.countDocuments({ classId: cls._id });  // Updated to use classId
        return {
          ...cls.toObject(),
          exams: examCount,
        };
      })
    );

    res.json({
      success: true,
      classes: classesWithExamCount,
    });
  } catch (err) {
    console.error("Error fetching classes:", err);
    res.status(500).json({ success: false, message: "Error fetching classes" });
  }
});

/**
 * @route GET /api/classes/:id
 * @desc Get full class details (students + exams)
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

    if (cls.verifier._id.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const exams = await Exam.find({ classId: id })  // Updated to use classId
      .populate("verifier", "username")
      .sort({ createdAt: -1 })
      .lean();

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

    // Validate required fields
    if (!name || !examDate || !stakeDeadline) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: name, examDate, and stakeDeadline are required" 
      });
    }

    // Verify the class exists and belongs to the verifier
    const cls = await Class.findById(id);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (cls.verifier.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Parse dates and set defaults
    const examDateParsed = new Date(examDate);
    const stakeDeadlineParsed = new Date(stakeDeadline);
    
    const commitDeadlineParsed = commitDeadline 
      ? new Date(commitDeadline)
      : new Date(examDateParsed.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days after exam
    
    const revealDeadlineParsed = revealDeadline
      ? new Date(revealDeadline)
      : new Date(examDateParsed.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days after exam

    // Validate date logic
    const now = new Date();
    if (stakeDeadlineParsed <= now) {
      return res.status(400).json({ 
        success: false, 
        message: "Stake deadline must be in the future" 
      });
    }

    if (examDateParsed <= stakeDeadlineParsed) {
      return res.status(400).json({ 
        success: false, 
        message: "Exam date must be after stake deadline" 
      });
    }

    const newExam = new Exam({
      name: name.trim(),
      description: description?.trim() || "",
      classId: id,  // Updated to use classId
      verifier: req.user.userId,
      maxMarks: Number(maxMarks) || 100,
      examDate: examDateParsed,
      stakeDeadline: stakeDeadlineParsed,
      commitDeadline: commitDeadlineParsed,
      revealDeadline: revealDeadlineParsed,
      status: "upcoming",
    });

    await newExam.save();

    const populatedExam = await Exam.findById(newExam._id)
      .populate("verifier", "username")
      .populate("classId", "name code");  // Updated to use classId

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam: populatedExam,
    });
  } catch (err) {
    console.error("Error creating exam:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create exam", 
      error: err.message 
    });
  }
});

/**
 * @route GET /api/classes/:id/exams
 * @desc Get all exams for a specific class
 */
router.get("/:id/exams", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify class exists
    const cls = await Class.findById(id);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Check if user has access to this class
    const isVerifier = cls.verifier.toString() === req.user.userId;
    const isStudent = cls.students.includes(req.user.userId);

    if (!isVerifier && !isStudent) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const exams = await Exam.find({ classId: id })  // Updated to use classId
      .populate("verifier", "username")
      .sort({ examDate: 1 })
      .lean();

    res.json({
      success: true,
      exams,
    });
  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).json({ success: false, message: "Error fetching exams" });
  }
});

export default router;
