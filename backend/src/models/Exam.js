import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    verifier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    maxMarks: {
      type: Number,
      default: 100,
      min: 0,
    },
    examDate: {
      type: Date,
      required: true,
    },
    stakeDeadline: {
      type: Date,
      required: true,
    },
    commitDeadline: {
      type: Date,
      required: true,
    },
    revealDeadline: {
      type: Date,
      required: true,
    },
    totalStakePool: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["upcoming", "staking", "grading", "revealed", "completed"],
      default: "upcoming",
    },
    commitHash: {
      type: String,
      default: null,
    },
    gradesRevealed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
