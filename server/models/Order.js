import mongoose from "mongoose";

/** Line items are snapshotted at checkout so later product edits never rewrite history. */
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String },
    variantName: { type: String, default: "" },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    orderNumber: { type: String, unique: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingInfo: { type: shippingSchema, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: { type: String, default: "mock" },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.pre("validate", function assignOrderNumber(next) {
  if (!this.orderNumber) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    this.orderNumber = `PP-${stamp}-${rand}`;
  }
  next();
});

export const Order = mongoose.model("Order", orderSchema);
