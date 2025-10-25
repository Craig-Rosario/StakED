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

// Connect to MongoDB **inside a lazy function**, not top-level
let isConnected = false;
async function ensureDBConnection() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "https://your-frontend.vercel.app"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/verifier", verifierRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stakes", stakeRoutes);
app.use("/api/exams", examRoutes);

// Health check
app.get("/", async (req, res) => {
  await ensureDBConnection();
  res.json({ message: "✅ StakED Backend API is running on Vercel!" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ❌ Remove this line — Vercel doesn’t support custom ports
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Instead, export the app for Vercel
export default app;
