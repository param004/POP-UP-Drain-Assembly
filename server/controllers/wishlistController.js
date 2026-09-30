import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/** GET /api/wishlist */
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
    select: "name slug price images rating stock isActive badge",
  });
  res.json({ items: user.wishlist });
});

/** POST /api/wishlist/:productId — idempotent. */
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user.wishlist.some((id) => String(id) === productId)) {
    user.wishlist.push(productId);
    await user.save();
  }
  res.json({ wishlist: user.wishlist, count: user.wishlist.length });
});

/** DELETE /api/wishlist/:productId */
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter((id) => String(id) !== productId);
  await user.save();
  res.json({ wishlist: user.wishlist, count: user.wishlist.length });
});
