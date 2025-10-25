import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import classRoutes from "./src/routes/classRoutes.js";
import verifierRoutes from "./src/routes/verifierRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import stakeRoutes from "./src/routes/stakeRoutes.js";
import examRoutes from "./src/routes/examRoutes.js";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/verifier", verifierRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stakes", stakeRoutes);
app.use("/api/exams", examRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "StakED Backend API is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
