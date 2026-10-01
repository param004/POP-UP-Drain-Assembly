import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";

import DrainModel from "../three/DrainModel.jsx";
import CameraRig from "../three/CameraRig.jsx";
import StudioEnvironment from "../three/StudioEnvironment.jsx";

/**
 * Product card.
 *
 * Products that ship a model get a live 3D thumbnail; the rest get a generated
 * technical glyph. The brief's data set has no product photography, and a
 * hand-drawn silhouette is far more honest than a stock photo of a different
 * drain — the glyph is derived from the product's own category.
 *
 * The whole card is one link. It used to carry a wishlist heart and a quick-add
 * button, but both needed the cart and account APIs, so on a static build the card
 * is purely a way to reach the product page.
 */
export default function ProductCard({ product }) {
  return (
    <article className="group relative flex flex-col">
      <Link
        to={`/products/${product.slug}`}
        className="relative block overflow-hidden rounded-xl border border-shell-300 bg-[linear-gradient(160deg,#fbfbfa,#eceae6)]"
        style={{ aspectRatio: "1 / 1" }}
      >
        <ProductVisual product={product} />

        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-ink-900 px-2.5 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-shell-100">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight">
            <Link to={`/products/${product.slug}`} className="hover:underline underline-offset-4">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-ink-400">{product.category}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">${product.price}</p>
          {product.compareAtPrice > product.price && (
            <p className="text-xs tabular-nums text-ink-400 line-through">
              ${product.compareAtPrice}
            </p>
          )}
        </div>
      </div>

      {product.rating > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-400">
          <Stars rating={product.rating} />
          {product.rating.toFixed(1)}
          <span className="text-ink-300">({product.numReviews})</span>
        </p>
      )}
    </article>
  );
}

/**
 * Live 3D thumbnail, or nothing at all.
 *
 * Products with no 3D model simply have no image: the card keeps its soft ground
 * with the wishlist and quick-add controls, and the name, price and rating below
 * carry the identification. An invented graphic was tried first and a
 * typographic stand-in second — the plain card reads better than either.
 */
function ProductVisual({ product }) {
  if (product.modelUrl) {
    return <ModelThumb modelUrl={product.modelUrl} />;
  }
  return null;
}

function ModelThumb({ modelUrl }) {
  return <ModelThumbCanvas modelUrl={modelUrl} key={modelUrl} />;
}

/*
 * Rendered lazily: a grid of six products must not spin up six WebGL contexts.
 * The canvas is created only once the card scrolls into view, and the context is
 * disposed by R3F when the card unmounts.
 */
function ModelThumbCanvas({ modelUrl }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "300px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const viewRef = useRef({ target: 0, smooth: 0, nodes: null });

  return (
    <div ref={ref} className="absolute inset-0">
      {visible && (
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 26, near: 0.1, far: 60, position: [3.4, 2.0, 9.2] }}
        >
          <DrainModel viewRef={viewRef} />
          <CameraRig viewRef={viewRef} autoRotate={false} minDistance={5} maxDistance={16} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[4, 6, 5]} intensity={1.4} />
          <directionalLight position={[-4, 2, -4]} intensity={0.5} color="#cfe0ff" />
          <StudioEnvironment resolution={128} />
        </Canvas>
      )}
    </div>
  );
}

export function Stars({ rating, className = "" }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" width="11" height="11" aria-hidden="true">
          <defs>
            <linearGradient id={`st${i}-${Math.round(rating * 10)}`}>
              <stop offset={`${Math.min(1, Math.max(0, rating - i + 1)) * 100}%`} stopColor="currentColor" />
              <stop offset={`${Math.min(1, Math.max(0, rating - i + 1)) * 100}%`} stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.6 4.9 17.3l1-5.7-4.1-4 5.7-.8z"
            fill={`url(#st${i}-${Math.round(rating * 10)})`}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}
