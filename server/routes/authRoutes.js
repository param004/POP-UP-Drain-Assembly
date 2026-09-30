import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, me, logout, updateProfile } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Credential endpoints are rate limited per IP to blunt password guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfile);

export default router;
