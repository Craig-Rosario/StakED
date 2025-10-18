import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      // Removed index: true to avoid duplicate index warning
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    verifier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    rewardPool: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create indexes
classSchema.index({ code: 1 }, { unique: true });
classSchema.index({ verifier: 1 });

const Class = mongoose.model("Class", classSchema);
export default Class;
