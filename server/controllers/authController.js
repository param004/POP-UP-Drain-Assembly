import { User } from "../models/User.js";
import { Cart } from "../models/Cart.js";
import { signToken } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are all required." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  const user = await User.create({ name, email, passwordHash: password });

  // Claim any guest cart created before signing up.
  const { sessionId } = req.body;
  if (sessionId) {
    const guestCart = await Cart.findOneAndUpdate(
      { sessionId },
      { $set: { user: user._id }, $unset: { sessionId: 1 } },
      { new: true }
    );
    if (guestCart) await Cart.deleteOne({ user: user._id, _id: { $ne: guestCart._id } });
  }

  const token = signToken(user._id);
  res.cookie("token", token, cookieOptions());
  return res.status(201).json({ token, user: user.toJSON() });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  // passwordHash is `select: false`, so ask for it explicitly.
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }

  // Fold this guest's cart into the account on sign-in.
  const { sessionId } = req.body;
  if (sessionId) {
    const guestCart = await Cart.findOne({ sessionId });
    if (guestCart) {
      const userCart = await Cart.findOne({ user: user._id });
      if (userCart) {
        // Merge item lists, summing quantities for the same product+variant.
        for (const item of guestCart.items) {
          const match = userCart.items.find(
            (i) =>
              String(i.product) === String(item.product) &&
              String(i.variantId) === String(item.variantId)
          );
          if (match) match.qty += item.qty;
          else userCart.items.push(item);
        }
        await userCart.save();
        await guestCart.deleteOne();
      } else {
        guestCart.user = user._id;
        guestCart.sessionId = undefined;
        await guestCart.save();
      }
    }
  }

  const token = signToken(user._id);
  res.cookie("token", token, cookieOptions());
  return res.json({ token, user: user.toJSON() });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toJSON() });
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("token", { ...cookieOptions(), maxAge: undefined });
  res.json({ message: "Signed out." });
});

/** PUT /api/auth/me — update profile details. */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, addresses } = req.body;
  if (name) req.user.name = name;
  if (Array.isArray(addresses)) req.user.addresses = addresses;
  await req.user.save();
  res.json({ user: req.user.toJSON() });
});
