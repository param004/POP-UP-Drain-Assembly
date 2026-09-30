import mongoose from "mongoose";

/**
 * A hotspot is a numbered marker pinned to one part of the 3D model.
 *
 * `node` is the name of the glTF node the marker is parented to (e.g. "Pivot_Collar").
 * Parenting to the real node — rather than to a fixed world position — is what lets a
 * marker stay glued to its part while the explode slider moves that part around.
 *
 * `position` is the marker's LOCAL offset inside that node's space, which doubles as a
 * fallback for renderers that place markers in world space.
 */
const hotspotSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    label: { type: String, required: true, trim: true },
    node: { type: String, required: true, trim: true },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    side: { type: String, enum: ["left", "right"], default: "right" },
    summary: { type: String, default: "" },
    specs: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    modelUrl: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    description: { type: String, default: "" },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tagline: { type: String, default: "", trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: null },
    category: { type: String, required: true, trim: true, index: true },
    material: { type: String, trim: true, index: true },
    images: { type: [String], default: [] },
    modelUrl: { type: String, trim: true },
    variants: { type: [variantSchema], default: [] },
    hotspots: { type: [hotspotSchema], default: [] },
    specs: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
    features: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    badge: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // Maps serialise to plain objects rather than Map instances.
      transform: (_doc, ret) => {
        if (ret.specs instanceof Map) ret.specs = Object.fromEntries(ret.specs);
        if (Array.isArray(ret.hotspots)) {
          ret.hotspots = ret.hotspots.map((h) => ({
            ...h,
            specs: h.specs instanceof Map ? Object.fromEntries(h.specs) : h.specs,
          }));
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound text index for the search box in the navbar.
productSchema.index({ name: "text", description: "text", tagline: "text" });

productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

/** Keeps `specs` as a plain object on plain JS documents (e.g. after lean()). */
productSchema.set("toObject", { virtuals: true });

export const Product = mongoose.model("Product", productSchema);
