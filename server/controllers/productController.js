import { Product } from "../models/Product.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Builds a Mongo filter from the query string.
 * Supported: category, material, minPrice, maxPrice, search, featured, sort, page, limit
 */
function buildFilter(query) {
  const filter = { isActive: true };

  if (query.category) {
    filter.category = { $in: String(query.category).split(",").map((c) => c.trim()) };
  }
  if (query.material) {
    filter.material = { $in: String(query.material).split(",").map((m) => m.trim()) };
  }

  const price = {};
  if (query.minPrice != null && query.minPrice !== "") price.$gte = Number(query.minPrice);
  if (query.maxPrice != null && query.maxPrice !== "") price.$lte = Number(query.maxPrice);
  if (Object.keys(price).length) filter.price = price;

  if (query.search) {
    const safe = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    filter.$or = [{ name: rx }, { tagline: rx }, { description: rx }];
  }

  if (query.featured === "true") filter.badge = { $ne: "" };

  return filter;
}

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1 },
  name: { name: 1 },
};

/** GET /api/products — paginated list with filters. */
export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const sort = SORTS[req.query.sort] ?? SORTS.newest;

  const [items, total] = await Promise.all([
    Product.find(buildFilter(req.query))
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Product.countDocuments(buildFilter(req.query)),
  ]);

  res.json({
    items,
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

/** GET /api/products/filters — distinct categories/materials + price bounds for the filter UI. */
export const getProductFilters = asyncHandler(async (_req, res) => {
  const [categories, materials, bounds] = await Promise.all([
    Product.distinct("category", { isActive: true }),
    Product.distinct("material", { isActive: true }),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
    ]),
  ]);

  res.json({
    categories: categories.sort(),
    materials: materials.filter(Boolean).sort(),
    minPrice: bounds[0]?.min ?? 0,
    maxPrice: bounds[0]?.max ?? 0,
  });
});

/** GET /api/products/:slug — accepts a slug or an ObjectId. */
export const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const byId = /^[a-f\d]{24}$/i.test(slug);
  const product = await Product.findOne(
    byId ? { _id: slug } : { slug: String(slug).toLowerCase() }
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .limit(3)
    .lean({ virtuals: true });

  return res.json({ ...product.toJSON(), related });
});

/** POST /api/products (admin) */
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

/** PUT /api/products/:id (admin) */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: "Product not found." });
  return res.json(product);
});

/** DELETE /api/products/:id (admin) — soft delete so orders keep their history. */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) return res.status(404).json({ message: "Product not found." });
  return res.json({ message: "Product removed.", product });
});
