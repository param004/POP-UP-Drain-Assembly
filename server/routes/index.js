import { Router } from "express";
import productRoutes from "./productRoutes.js";
import authRoutes from "./authRoutes.js";
import cartRoutes from "./cartRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";
import orderRoutes from "./orderRoutes.js";
import contactRoutes from "./contactRoutes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), env: process.env.NODE_ENV });
});

router.use("/products", productRoutes);
router.use("/auth", authRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/contact", contactRoutes);

export default router;
