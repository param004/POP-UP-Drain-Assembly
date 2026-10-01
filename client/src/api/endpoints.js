import PRODUCTS from "../data/products.json";

/*
 * Static product access.
 *
 * These replace the API calls the site used to make. The catalogue is baked into the
 * bundle at build time by `scripts/generate-products.mjs`, so reads are synchronous
 * array lookups: there is no request, no loading state, and no way for it to fail.
 *
 * The exported names match the old endpoint functions so call sites read the same,
 * but note they are no longer async — anything that used `await` on them still works,
 * though a component that renders a loading or error branch can no longer reach one.
 */

const ALL = PRODUCTS;

/** Every active product, newest catalogue order (alphabetical by name). */
export const fetchProducts = () => ALL;

/** A single product by slug, or `null` when there is no match. */
export const fetchProduct = (slug) => ALL.find((p) => p.slug === slug) ?? null;

/**
 * Products other than `excludeSlug`, for the "also consider" grid.
 * Sorted by rating then review count, matching how the API ordered them.
 */
export const fetchRelated = (excludeSlug, limit = 3) =>
  ALL.filter((p) => p.slug !== excludeSlug)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.numReviews ?? 0) - (a.numReviews ?? 0))
    .slice(0, limit);

/** Distinct categories, for anything that groups or filters the catalogue. */
export const fetchProductFilters = () => ({
  categories: [...new Set(ALL.map((p) => p.category).filter(Boolean))].sort(),
  materials: [...new Set(ALL.map((p) => p.material).filter(Boolean))].sort(),
});
