/*
 * Where the site's shop links point.
 *
 * There is no product listing page — the catalogue grid was removed, so the drain
 * assembly is reached directly. Every primary call to action (navbar, footer,
 * "browse products" on an empty basket) funnels through SHOP_PATH so there is one
 * place to change if that ever moves.
 *
 * The other five seeded products are still addressable at /products/<slug> and are
 * linked from their own detail pages, the admin, and the wishlist.
 */
export const FEATURED_SLUG = "pop-up-drain-assembly";

/** The product page a visitor should land on when they go shopping. */
export const SHOP_PATH = `/products/${FEATURED_SLUG}`;

/**
 * Legacy catalogue URLs, e.g. /products or /products?category=Strainers.
 *
 * The listing page is gone, so these are redirected to SHOP_PATH rather than
 * 404ing — old bookmarks, shared links and the footer used to send people here.
 */
export const RETIRED_LISTING_PATH = "/products";
