import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  getProductFilters,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// `filters` must be declared before `/:slug`, otherwise "filters" is swallowed
// as a slug and the request 404s.
router.get("/filters", getProductFilters);

router.route("/").get(getProducts).post(requireAuth, requireAdmin, createProduct);

router
  .route("/:slug")
  .get(getProductBySlug)
  .put(requireAuth, requireAdmin, updateProduct)
  .delete(requireAuth, requireAdmin, deleteProduct);

export default router;
