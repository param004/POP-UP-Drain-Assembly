import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Carts work for guests and members alike, so auth is optional everywhere here.
// A guest identifies itself with the x-session-id header; a member with their JWT.
router.use(optionalAuth);

router.route("/").get(getCart).post(addToCart).delete(clearCart);
router.route("/:itemId").put(updateCartItem).delete(removeCartItem);

export default router;
