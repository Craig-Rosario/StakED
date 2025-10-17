import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "verifier"],
      default: "student",
    },
    nonce: {
      type: String,
      default: () => Math.floor(Math.random() * 1000000).toString(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
