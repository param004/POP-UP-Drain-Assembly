import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function readToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  // Cookie fallback keeps the API usable from a browser without a JS token store.
  return req.cookies?.token || null;
}

/**
 * Verifies the JWT and attaches the user document to `req.user`.
 * Responds 401 when the token is missing, malformed or expired.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) {
      return res.status(401).json({ message: "Please sign in to continue." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "This account no longer exists." });
    }

    req.user = user;
    return next();
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    return res.status(401).json({
      message: expired ? "Your session expired. Please sign in again." : "Invalid session.",
    });
  }
}

/** Same as requireAuth but never blocks: used by routes that personalise for guests too. */
export async function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.sub);
  } catch {
    req.user = null;
  }
  return next();
}

/** Route guard for admin-only endpoints. Must run after requireAuth. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Administrator access required." });
  }
  return next();
}
