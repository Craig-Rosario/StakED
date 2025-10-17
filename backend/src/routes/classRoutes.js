import express from "express";
import Class from "../models/Class.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, checkRole(["verifier", "teacher"]), async (req, res) => {
  try {
    const { name, code } = req.body;

    const existing = await Class.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: "Class code already exists" });
    }

    const newClass = new Class({
      name,
      code,
      teacher: req.user.userId,
      verifier: req.user.userId,
    });

    await newClass.save();
    res.status(201).json({ success: true, class: newClass });
  } catch (err) {
    res.status(500).json({ message: "Failed to create class", error: err.message });
  }
});

router.get("/", verifyToken, checkRole(["verifier", "teacher"]), async (req, res) => {
  try {
    const classes = await Class.find({ verifier: req.user.userId });
    res.json({ success: true, classes });
  } catch (err) {
    res.status(500).json({ message: "Error fetching classes" });
  }
});

export default router;
