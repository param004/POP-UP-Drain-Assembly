import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useCart } from "../context/CartContext.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner, { EmptyState } from "../components/ui/Feedback.jsx";
import { SHOP_PATH } from "../data/paths.js";

const FREE_SHIPPING_OVER = 150;
const TAX_RATE = 0.08;

export default function Cart() {
  const { items, subtotal, loading, error, pendingItem, setQty, removeItem, empty } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const shipping = subtotal > FREE_SHIPPING_OVER || subtotal === 0 ? 0 : 12;
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));
  const toFreeShipping = Math.max(0, FREE_SHIPPING_OVER - subtotal);

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center pt-24">
        <Spinner label="Loading cart" />
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">your bag</p>
            <h1 className="display mt-3 text-[clamp(2rem,5vw,3.5rem)]">Cart</h1>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => empty().catch(() => {})}
              className="text-xs text-ink-500 underline underline-offset-4 transition-colors hover:text-ink-900"
            >
              Empty cart
            </button>
          )}
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-brass-500/30 bg-brass-500/5 px-4 py-3 text-sm text-brass-500" role="alert">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <EmptyState
            className="mt-10"
            title="Your cart is empty"
            body="Nothing in here yet. The drain assembly is a good place to start."
            action={
              <Button to={SHOP_PATH} variant="solid" size="md" withArrow>
                View the product
              </Button>
            }
          />
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
            {/* ------------------------------ lines ------------------------------ */}
            <ul className="divide-y divide-shell-300 border-y border-shell-300">
              {items.map((item) => {
                const busyRow = pendingItem === item._id;
                return (
                  <li key={item._id} className="flex gap-5 py-6">
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-shell-300 bg-[linear-gradient(160deg,#fbfbfa,#eceae6)]"
                      aria-hidden="true"
                    >
                      <CartThumb product={item.product} />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-semibold">
                            <Link to={`/products/${item.product.slug}`} className="hover:underline underline-offset-4">
                              {item.product.name}
                            </Link>
                          </h2>
                          {item.variantName && (
                            <p className="mt-0.5 text-xs text-ink-400">{item.variantName}</p>
                          )}
                          {!item.available && (
                            <p className="mt-1 text-xs text-brass-500">
                              Only {item.maxQty} left — reduce the quantity to check out.
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold tabular-nums">
                          ${item.lineTotal.toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex h-9 items-center rounded-full border border-shell-300">
                          <button
                            type="button"
                            onClick={() => setQty(item._id, item.qty - 1).catch(() => {})}
                            disabled={busyRow || item.qty <= 1}
                            aria-label={`Decrease quantity of ${item.product.name}`}
                            className="grid h-full w-9 place-items-center text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-xs font-semibold tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(item._id, item.qty + 1).catch(() => {})}
                            disabled={busyRow || item.qty >= item.maxQty}
                            aria-label={`Increase quantity of ${item.product.name}`}
                            className="grid h-full w-9 place-items-center text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item._id).catch(() => {})}
                          disabled={busyRow}
                          className="text-xs text-ink-400 underline underline-offset-4 transition-colors hover:text-ink-900 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ------------------------------ summary ----------------------------- */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-shell-300 bg-shell-50 p-6">
                <h2 className="eyebrow">Summary</h2>

                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Subtotal</dt>
                    <dd className="font-medium tabular-nums">${subtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Shipping</dt>
                    <dd className="font-medium tabular-nums">
                      {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Estimated tax</dt>
                    <dd className="font-medium tabular-nums">${tax.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-shell-300 pt-3 text-base">
                    <dt className="font-semibold">Total</dt>
                    <dd className="font-bold tabular-nums">${total.toFixed(2)}</dd>
                  </div>
                </dl>

                {toFreeShipping > 0 && (
                  <p className="mt-4 text-xs text-ink-400">
                    Add <span className="font-semibold text-ink-900">${toFreeShipping.toFixed(2)}</span>{" "}
                    more for free shipping.
                  </p>
                )}

                <Button
                  type="button"
                  variant="solid"
                  size="lg"
                  withArrow
                  className="mt-6 w-full"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    // Let the click register visually before the route changes.
                    setTimeout(() => navigate("/checkout"), 120);
                  }}
                >
                  Checkout
                </Button>

                <Link
                  to={SHOP_PATH}
                  className="mt-3 block text-center text-xs text-ink-500 underline underline-offset-4 hover:text-ink-900"
                >
                  Back to the product
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small silhouette so cart lines are not bare grey boxes. */
function CartThumb({ product }) {
  return (
    <svg viewBox="0 0 48 48" className="h-16 w-16 text-ink-900/25" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M17 13h14v4l-2 3v16a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V20l-2-3z" />
      <path d="M21 25v11M24 25v13M27 25v11" />
    </svg>
  );
}
