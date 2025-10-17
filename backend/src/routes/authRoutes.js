import express from "express";
import { authController } from "../controllers/authController.js";

const router = express.Router();

router.post("/nonce", authController.getNonce);
router.post("/verify", authController.verifySignature);

export default router;
