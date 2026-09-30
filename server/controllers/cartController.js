import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/** Guests identify their cart with a client-generated id sent in a header. */
function sessionIdFrom(req) {
  return req.get("x-session-id") || req.body?.sessionId || null;
}

/** Finds (or lazily creates) the cart for the current identity. */
async function resolveCart(req) {
  if (req.user) {
    const existing = await Cart.findOne({ user: req.user._id });
    if (existing) return existing;
    return Cart.create({ user: req.user._id, items: [] });
  }

  const sessionId = sessionIdFrom(req);
  if (!sessionId) {
    const err = new Error("Missing x-session-id header for guest cart.");
    err.status = 400;
    throw err;
  }

  const existing = await Cart.findOne({ sessionId });
  if (existing) return existing;
  return Cart.create({ sessionId, items: [] });
}

/**
 * Returns the cart with products populated, plus a computed subtotal.
 * Also flags items whose product has since been deactivated or gone out of stock,
 * so the cart page can explain itself instead of silently showing a dead item.
 */
async function presentCart(cart) {
  await cart.populate({
    path: "items.product",
    // `variants` must be selected too, otherwise variant names can never resolve.
    select: "name slug price images stock isActive variants",
  });

  let subtotal = 0;
  const items = cart.items
    .filter((item) => item.product)
    .map((item) => {
      const product = item.product;
      const unit = product.price ?? 0;
      const line = unit * item.qty;
      subtotal += line;

      const variant = item.variantId
        ? product.variants?.id(item.variantId) || null
        : null;

      return {
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.images?.[0] ?? null,
        },
        variantId: item.variantId ?? null,
        variantName: variant?.name ?? null,
        qty: item.qty,
        unitPrice: unit,
        lineTotal: line,
        available: product.isActive !== false && product.stock >= item.qty,
        maxQty: Math.max(1, product.stock ?? 1),
      };
    });

  return { _id: cart._id, items, subtotal: Number(subtotal.toFixed(2)) };
}

/** GET /api/cart */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req);
  res.json(await presentCart(cart));
});

/** POST /api/cart — body: { productId, variantId?, qty?, sessionId? } */
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId = null, qty = 1 } = req.body;
  const quantity = Math.max(1, Math.min(99, Number(qty) || 1));

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ message: "Product not found." });
  }
  if (product.stock < 1) {
    return res.status(409).json({ message: "This product is out of stock." });
  }
  if (variantId && !product.variants?.id(variantId)) {
    return res.status(400).json({ message: "That variant does not exist for this product." });
  }

  const cart = await resolveCart(req);
  const existing = cart.items.find(
    (i) => String(i.product) === String(productId) && String(i.variantId) === String(variantId)
  );

  if (existing) {
    existing.qty = Math.min(99, existing.qty + quantity);
  } else {
    cart.items.push({ product: productId, variantId, qty: quantity });
  }

  await cart.save();
  return res.status(201).json(await presentCart(cart));
});

/** PUT /api/cart/:itemId — body: { qty } */
export const updateCartItem = asyncHandler(async (req, res) => {
  const qty = Number(req.body.qty);
  if (!Number.isFinite(qty) || qty < 1) {
    return res.status(400).json({ message: "Quantity must be at least 1." });
  }

  const cart = await resolveCart(req);
  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "That item is not in your cart." });

  const product = await Product.findById(item.product).select("stock");
  if (product && product.stock < qty) {
    return res
      .status(409)
      .json({ message: `Only ${product.stock} left in stock.`, maxQty: product.stock });
  }

  item.qty = Math.min(99, qty);
  await cart.save();
  return res.json(await presentCart(cart));
});

/** DELETE /api/cart/:itemId */
export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req);
  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "That item is not in your cart." });

  item.deleteOne();
  await cart.save();
  return res.json(await presentCart(cart));
});

/** DELETE /api/cart — empty the cart. */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req);
  cart.items = [];
  await cart.save();
  res.json(await presentCart(cart));
});
