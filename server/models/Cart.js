import mongoose from "mongoose";

/**
 * One cart per user. Guest carts are keyed by a `sessionId` the client generates
 * and persists in localStorage, so guests keep a cart without ever registering.
 */
const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    qty: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    sessionId: { type: String, default: null },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

// A cart is owned by exactly one identity: either a user or a guest session.
cartSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } }
);
cartSchema.index(
  { sessionId: 1 },
  { unique: true, partialFilterExpression: { sessionId: { $type: "string" } } }
);

export const Cart = mongoose.model("Cart", cartSchema);
