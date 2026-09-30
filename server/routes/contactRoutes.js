import { Router } from "express";
import rateLimit from "express-rate-limit";
import { submitContact, listContactMessages } from "../controllers/contactController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "You've sent a few messages already. Please try again later." },
});

router.post("/", contactLimiter, submitContact);
router.get("/", requireAuth, requireAdmin, listContactMessages);

export default router;
