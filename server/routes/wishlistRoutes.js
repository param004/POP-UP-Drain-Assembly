import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.route("/").get(getWishlist);
router.route("/:productId").post(addToWishlist).delete(removeFromWishlist);

export default router;
