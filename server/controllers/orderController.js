import { Order } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const SHIPPING_FLAT_RATE = 12;
const TAX_RATE = 0.08;

function sessionIdFrom(req) {
  return req.get("x-session-id") || req.body?.sessionId || null;
}

/**
 * POST /api/orders — turns the caller's cart into an order.
 *
 * Prices are always recomputed from the database here, never taken from the
 * request body, so a tampered client cannot dictate what an order costs.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingInfo, paymentMethod = "mock", simulateFailure = false } = req.body;

  const required = ["fullName", "email", "line1", "city", "state", "postalCode", "country"];
  const missing = required.filter((f) => !shippingInfo?.[f]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing shipping fields: ${missing.join(", ")}` });
  }

  const cartFilter = req.user
    ? { user: req.user._id }
    : { sessionId: sessionIdFrom(req) };

  if (!req.user && !cartFilter.sessionId) {
    return res.status(400).json({ message: "Missing x-session-id header." });
  }

  const cart = await Cart.findOne(cartFilter).populate("items.product");
  if (!cart?.items?.length) {
    return res.status(400).json({ message: "Your cart is empty." });
  }

  // Re-verify stock and price at the moment of purchase.
  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      return res.status(409).json({ message: "An item in your cart is no longer available." });
    }
    if (product.stock < item.qty) {
      return res
        .status(409)
        .json({ message: `Only ${product.stock} of "${product.name}" left in stock.` });
    }
  }

  const items = cart.items.map((item) => {
    const variant = item.variantId
      ? item.product.variants?.id(item.variantId)
      : null;
    return {
      product: item.product._id,
      name: item.product.name,
      slug: item.product.slug,
      variantName: variant?.name ?? "",
      image: item.product.images?.[0] ?? null,
      price: item.product.price,
      qty: item.qty,
    };
  });

  const subtotal = Number(items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2));
  const shipping = subtotal > 150 ? 0 : SHIPPING_FLAT_RATE;
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));

  // Mock payment: succeeds unless the client asks for a failure (used to demo the
  // declined-payment state in the UI without needing real Stripe keys).
  const paid = paymentMethod === "mock" && !simulateFailure;

  const order = await Order.create({
    user: req.user?._id ?? null,
    items,
    shippingInfo,
    paymentMethod,
    paymentStatus: paid ? "paid" : "failed",
    paidAt: paid ? new Date() : null,
    subtotal,
    shipping,
    tax,
    total,
  });

  if (paid) {
    // Decrement stock and empty the cart only after a successful payment.
    for (const item of cart.items) {
      await item.product.constructor
        .findByIdAndUpdate(item.product._id, { $inc: { stock: -item.qty } })
        .catch(() => {});
    }
    cart.items = [];
    await cart.save();
  }

  return res.status(201).json(order);
});

/** GET /api/orders/:idOrNumber — a signed-in user sees only their own orders. */
export const getOrder = asyncHandler(async (req, res) => {
  const { idOrNumber } = req.params;
  const byId = /^[a-f\d]{24}$/i.test(idOrNumber);
  const filter = byId ? { _id: idOrNumber } : { orderNumber: idOrNumber };

  const order = await Order.findOne(filter);
  if (!order) return res.status(404).json({ message: "Order not found." });

  if (order.user && String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only view your own orders." });
  }

  return res.json(order);
});

/** GET /api/orders — the caller's order history. */
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ items: orders });
});

/** GET /api/orders (admin) — every order, newest first. */
export const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter = req.query.status ? { paymentStatus: req.query.status } : {};

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name email"),
    Order.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
});

/** PUT /api/orders/:id/payment-status (admin) */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus, paidAt: paymentStatus === "paid" ? new Date() : null },
    { new: true, runValidators: true }
  );
  if (!order) return res.status(404).json({ message: "Order not found." });
  return res.json(order);
});
