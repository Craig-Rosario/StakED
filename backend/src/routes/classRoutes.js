import express from "express";
import Class from "../models/Class.js";
import Exam from "../models/Exam.js";
import User from "../models/User.js";
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
 * @route POST /api/classes/join
 * @desc Student joins a class using class code
 * @access Private (student)
 */
router.post("/join", verifyToken, checkRole(["student"]), async (req, res) => {
  try {
    const { classCode, studentName } = req.body;

    console.log("Join class request:", { classCode, studentName, userId: req.user.userId });

    if (!classCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Class code is required" 
      });
    }

    // Find the class by code
    const cls = await Class.findOne({ code: classCode.toUpperCase() });
    if (!cls) {
      return res.status(404).json({ 
        success: false, 
        message: "Class not found. Please check the class code." 
      });
    }

    // Check if student is already enrolled
    if (cls.students.includes(req.user.userId)) {
      return res.status(400).json({ 
        success: false, 
        message: "You are already enrolled in this class" 
      });
    }

    // Update user's name if provided
    if (studentName && studentName.trim()) {
      await User.findByIdAndUpdate(req.user.userId, { 
        username: studentName.trim() 
      });
    }

    // Add student to class
    cls.students.push(req.user.userId);
    await cls.save();

    // Get updated class details for response
    const updatedClass = await Class.findById(cls._id)
      .populate("verifier", "username")
      .lean();

    res.status(200).json({
      success: true,
      message: "Successfully joined the class!",
      class: {
        _id: updatedClass._id,
        name: updatedClass.name,
        code: updatedClass.code,
        description: updatedClass.description,
        verifier: updatedClass.verifier,
        studentsCount: updatedClass.students.length,
      },
    });
  } catch (err) {
    console.error("Error joining class:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to join class" 
    });
  }
});

/**
 * @route GET /api/classes/student
 * @desc Get all classes for the current student
 * @access Private (student)
 */
router.get("/student", verifyToken, checkRole(["student"]), async (req, res) => {
  try {
    const classes = await Class.find({ students: req.user.userId })
      .populate("verifier", "username")
      .select("name code description verifier students createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const classesWithDetails = classes.map(cls => ({
      ...cls,
      studentsCount: cls.students.length,
    }));

    res.json({
      success: true,
      classes: classesWithDetails,
    });
  } catch (err) {
    console.error("Error fetching student classes:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching classes" 
    });
  }
});

/**
 * @route GET /api/classes/student/exams
 * @desc Get all upcoming exams for student's classes
 * @access Private (student)
 */
router.get("/student/exams", verifyToken, checkRole(["student"]), async (req, res) => {
  try {
    // Find all classes the student is enrolled in
    const studentClasses = await Class.find({ students: req.user.userId })
      .select("_id");

    const classIds = studentClasses.map(cls => cls._id);

    // Find all exams for these classes
    const exams = await Exam.find({ 
      classId: { $in: classIds },
      stakeDeadline: { $gte: new Date() }, // Only upcoming exams
    })
      .populate("classId", "name code")
      .populate("verifier", "username")
      .sort({ examDate: 1 })
      .lean();

    // Add additional fields for frontend
    const examsWithDetails = exams.map(exam => ({
      ...exam,
      timeLeft: calculateTimeLeft(exam.stakeDeadline),
      canStake: new Date() < new Date(exam.stakeDeadline),
      status: getExamStatus(exam),
    }));

    res.json({
      success: true,
      exams: examsWithDetails,
    });
  } catch (err) {
    console.error("Error fetching student exams:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching exams" 
    });
  }
});

/**
 * @route GET /api/classes/:id/exams
 * @desc Get all exams for a specific class
 * @access Private (verifier | teacher | student)
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

    const exams = await Exam.find({ classId: id })
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
        const examCount = await Exam.countDocuments({ classId: cls._id });
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

    if (cls.verifier._id.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const exams = await Exam.find({ classId: id })
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
      : new Date(examDateParsed.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    const revealDeadlineParsed = revealDeadline
      ? new Date(revealDeadline)
      : new Date(examDateParsed.getTime() + 4 * 24 * 60 * 60 * 1000);

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
      classId: id,
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
      .populate("classId", "name code");

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

// Helper functions
function calculateTimeLeft(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const timeDiff = deadlineDate.getTime() - now.getTime();
  
  if (timeDiff <= 0) return "Deadline passed";
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h left to stake`;
  return `${hours}h left to stake`;
}

function getExamStatus(exam) {
  const now = new Date();
  const stakeDeadline = new Date(exam.stakeDeadline);
  const examDate = new Date(exam.examDate);
  const commitDeadline = new Date(exam.commitDeadline);
  const revealDeadline = new Date(exam.revealDeadline);
  
  if (now < stakeDeadline) return "staking";
  if (now < examDate) return "waiting";
  if (now < commitDeadline) return "grading";
  if (now < revealDeadline) return "revealing";
  return "completed";
}

export default router;
