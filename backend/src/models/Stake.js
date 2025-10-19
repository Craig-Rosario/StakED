import mongoose from "mongoose";

const stakeSchema = new mongoose.Schema(
  {
    stakeId: {
      type: Number,
      required: true,
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    candidateAddress: {
      type: String,
      required: true,
    },
    stakeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    predictedMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isSelfStake: {
      type: Boolean,
      required: true,
      default: true,
    },
    targetThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    actualScore: {
      type: Number,
      default: null,
    },
    isWinner: {
      type: Boolean,
      default: null,
    },
    rewardAmount: {
      type: Number,
      default: 0,
    },
    isClaimed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "failed", "paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Stake = mongoose.model("Stake", stakeSchema);
export default Stake;
