import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchProduct } from "../api/endpoints.js";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import ProductViewer from "../components/three/ProductViewer.jsx";
import ScrollStory from "../components/home/ScrollStory.jsx";
import ProductCard, { Stars } from "../components/product/ProductCard.jsx";
import Button from "../components/ui/Button.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { ErrorState, Skeleton } from "../components/ui/Feedback.jsx";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, pendingItem } = useCart();
  const { ids, toggle } = useWishlist();

  const [variantId, setVariantId] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(null);

  const { data: product, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
  });

  // Reset the picker whenever the product changes, so state never leaks across
  // a navigation from one product page to a related one.
  useEffect(() => {
    setVariantId(product?.variants?.[0]?._id ?? null);
    setQty(1);
    setError(null);
  }, [product?._id, product]);

  // Keep the tab title in step with the product for shareable links.
  useEffect(() => {
    if (!product) return;
    const prev = document.title;
    document.title = `${product.name} — Premier Products®`;
    return () => {
      document.title = prev;
    };
  }, [product]);

  if (isLoading) {
    return (
      <div className="pt-16 sm:pt-[4.5rem]">
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-14 w-64 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="grid min-h-[80svh] place-items-center px-5 pt-24">
        <ErrorState message={loadError.message} onRetry={refetch} />
      </div>
    );
  }

  if (!product) return null;

  const wished = ids.has(String(product._id));
  const busy = pendingItem === "new";
  const inStock = product.stock > 0;
  const maxQty = Math.max(1, product.stock);

  const onAdd = async () => {
    setError(null);
    try {
      await addItem(product._id, variantId, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      setError(err.message);
    }
  };

  const onWish = async () => {
    const result = await toggle(product._id);
    if (result?.requiresAuth) navigate("/login", { state: { from: `/products/${slug}` } });
  };

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-ink-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="hover:text-ink-900">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            {/*
              The catalogue page was removed, so there is no intermediate step to
              breadcrumb through — "Home / <product>" is the whole trail.
            */}
            <li className="text-ink-900">{product.name}</li>
          </ol>
        </nav>

        {/*
          A product with no 3D model gets no visual block at all, and the grid
          collapses to a single column so the buy panel is never sitting beside an
          empty rectangle.
        */}
        <div
          className={`grid gap-10 ${
            product.modelUrl
              ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14"
              : ""
          }`}
        >
          {/* ------------------------- 3D viewer (reused) ------------------------- */}
          {product.modelUrl && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ProductViewer product={product} showSidebar={false} showSteps compact />
            </div>
          )}

          {/* ------------------------------ buy panel ------------------------------ */}
          <div>
            <p className="eyebrow">{product.category}</p>
            <h1 className="display mt-3 text-[clamp(1.75rem,4.5vw,3rem)]">{product.name}</h1>
            {product.tagline && (
              <p className="mt-3 text-base text-ink-500">{product.tagline}</p>
            )}

            {product.rating > 0 && (
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-500">
                <Stars rating={product.rating} />
                <span className="tabular-nums">{product.rating.toFixed(1)}</span>
                <span className="text-ink-400">({product.numReviews} reviews)</span>
              </p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">${product.price}</span>
              {product.compareAtPrice > product.price && (
                <>
                  <span className="text-base tabular-nums text-ink-400 line-through">
                    ${product.compareAtPrice}
                  </span>
                  <span className="rounded-full bg-brass-500/10 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-brass-500">
                    Save ${product.compareAtPrice - product.price}
                  </span>
                </>
              )}
            </div>

            {/* Variants */}
            {product.variants?.length > 1 && (
              <fieldset className="mt-8">
                <legend className="eyebrow">Variant</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v._id}
                      type="button"
                      onClick={() => setVariantId(v._id)}
                      aria-pressed={variantId === v._id}
                      className={`rounded-full border px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                        variantId === v._id
                          ? "border-ink-900 bg-ink-900 text-shell-100"
                          : "border-shell-300 text-ink-500 hover:border-ink-900 hover:text-ink-900"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Quantity + add */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex h-12 items-center rounded-full border border-shell-300">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                  className="grid h-full w-11 place-items-center text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  aria-label="Increase quantity"
                  className="grid h-full w-11 place-items-center text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <Button
                type="button"
                variant="solid"
                size="lg"
                onClick={onAdd}
                disabled={!inStock || busy}
                className="flex-1 sm:flex-none sm:min-w-[13rem]"
              >
                {!inStock ? "Sold out" : added ? "Added to cart" : "Add to Cart"}
              </Button>

              <button
                type="button"
                onClick={onWish}
                aria-pressed={wished}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                className="grid h-12 w-12 place-items-center rounded-full border border-shell-300 text-ink-700 transition-colors hover:border-ink-900"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill={wished ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20s-7-4.4-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20z" />
                </svg>
              </button>
            </div>

            <p className="mt-3 text-xs text-ink-400" aria-live="polite">
              {error ? (
                <span className="text-brass-500">{error}</span>
              ) : inStock ? (
                `${product.stock} in stock · ships in 1–2 business days`
              ) : (
                "Currently unavailable"
              )}
            </p>

            {/* Description */}
            {product.description && (
              <div className="mt-9 border-t border-shell-300 pt-8">
                {product.description.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-ink-500">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {/* Features */}
            {product.features?.length > 0 && (
              <ul className="mt-8 space-y-2.5">
                {product.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm text-ink-700">
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0 text-brass-500"
                      aria-hidden="true"
                    >
                      <path d="M3 8.5l3.5 3.5L13 5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mt-9">
                <h2 className="eyebrow">Specifications</h2>
                <dl className="mt-4 divide-y divide-shell-300 border-y border-shell-300">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-6 py-3">
                      <dt className="text-sm text-ink-500">{k}</dt>
                      <dd className="text-right text-sm font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Part breakdown, for products that have hotspots */}
            {product.hotspots?.length > 0 && (
              <div className="mt-9">
                <h2 className="eyebrow">What&apos;s in the assembly</h2>
                <ul className="mt-4 divide-y divide-shell-300 border-y border-shell-300">
                  {product.hotspots.map((h) => (
                    <li key={h.index} className="flex items-start gap-4 py-3.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-shell-300 text-[0.625rem] font-semibold tabular-nums">
                        {h.index}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{h.label}</p>
                        {h.summary && (
                          <p className="mt-1 text-xs leading-relaxed text-ink-500">{h.summary}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/*
          The same scroll narrative as the homepage and the About page.

          The compact viewer at the top of this page stays interactive on purpose:
          beside a price and an Add to Cart button, dragging the explode slider is
          the most direct way to understand what you are buying. This section is the
          guided version of the same product, for visitors who would rather scroll
          than drag.
        */}
        {product.modelUrl && product.hotspots?.length > 0 && (
          <section className="mt-24 border-t border-shell-300 sm:mt-32">
            <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-16 sm:px-8 sm:pt-20">
              <p className="eyebrow">see it come apart</p>
              <h2 className="display mt-3 max-w-2xl text-[clamp(1.75rem,4vw,3rem)]">
                Every part, in order.
              </h2>
            </div>
            <ScrollStory
              product={product}
              introLabel="From the top down"
              introCaption="Scroll through the assembly, one part at a time."
              showCta={false}
            />
          </section>
        )}

        {/* ------------------------------ related ------------------------------ */}
        {product.related?.length > 0 && (
          <Reveal className="mt-24">
            <h2 className="display text-xl sm:text-2xl">You might also need</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {product.related.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
