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
      default: "",
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
      required: false,
    },
    revealDeadline: {
      type: Date,
      required: false,
    },
    totalStakePool: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["upcoming", "staking", "grading", "graded", "revealed", "completed"],
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
    gradedAt: {
      type: Date,
      default: null,
    },
    // Blockchain integration fields
    blockchainExamId: {
      type: String,
      default: null,
    },
    blockchainCreated: {
      type: Boolean,
      default: false,
    },
    blockchainError: {
      type: String,
      default: null,
    },
    ExamStakingAddress: {
      type: String,
      default: process.env.EXAM_STAKING_ADDRESS || "0x1E4731390cce9955BC21985BB45068A1858703C2",
    },
    feeBps: {
      type: Number,
      default: 250, // 2.5% protocol fee
    },
    // passingScore removed - winners determined by prediction accuracy
    // Each student wins if: actual_score >= predicted_score
    rewardsDistributed: {
      type: Boolean,
      default: false,
    },
    distributedAt: {
      type: Date,
      default: null,
    },
    stakes: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        predictedGrade: {
          type: Number,
          min: 0,
          max: 100,
        },
        commitHash: String,
        actualGrade: {
          type: Number,
          min: 0,
        },
        reward: {
          type: Number,
          default: 0,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Add indexes for better performance
examSchema.index({ classId: 1, examDate: 1 });
examSchema.index({ verifier: 1 });
examSchema.index({ status: 1 });

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
