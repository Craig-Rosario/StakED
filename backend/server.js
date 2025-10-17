import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import classRoutes from "./src/routes/classRoutes.js";
import stakeRoutes from "./src/routes/stakeRoutes.js";
import verifierRoutes from "./src/routes/verifierRoutes.js";

dotenv.config();
const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/stakes", stakeRoutes);
app.use("/api/verifier", verifierRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
