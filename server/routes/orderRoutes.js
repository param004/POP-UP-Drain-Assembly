import { Router } from "express";
import {
  createOrder,
  getOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { optionalAuth, requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Guests may check out, so the collection route is optional-auth.
router.get("/", requireAuth, getMyOrders);
router.post("/", optionalAuth, createOrder);

// Admins get the full order book; members get their own by id/number.
router.get("/all", requireAuth, requireAdmin, getAllOrders);
router.get("/:idOrNumber", optionalAuth, getOrder);
router.put("/:id/payment-status", requireAuth, requireAdmin, updateOrderStatus);

export default router;
