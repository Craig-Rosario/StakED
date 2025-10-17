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
    stakeAmount: {
      type: Number,
      required: true,
      min: 0,
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
