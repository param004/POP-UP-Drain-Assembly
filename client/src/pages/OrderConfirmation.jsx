import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchOrder } from "../api/endpoints.js";
import Button from "../components/ui/Button.jsx";
import Spinner, { ErrorState } from "../components/ui/Feedback.jsx";
import { SHOP_PATH } from "../data/paths.js";

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const location = useLocation();

  // The order we just created is handed over in router state, so the common case
  // renders instantly. The query is still needed for a shared / reload.
  const seeded = location.state?.order;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => fetchOrder(orderNumber),
    initialData: seeded,
    staleTime: 60_000,
  });

  if (isLoading && !data) {
    return (
      <div className="grid min-h-[70vh] place-items-center pt-24">
        <Spinner label="Loading order" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="grid min-h-[80svh] place-items-center px-5 pt-24">
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  if (!data) return null;

  const paid = data.paymentStatus === "paid";
  const eta = new Date(data.createdAt);
  eta.setDate(eta.getDate() + (data.shipping === 0 ? 3 : 5));

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <div
          className={`grid h-14 w-14 place-items-center rounded-full ${
            paid ? "bg-emerald-600/10 text-emerald-700" : "bg-brass-500/10 text-brass-500"
          }`}
        >
          {paid ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 8v5M12 16.5v.5" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          )}
        </div>

        <p className="eyebrow mt-8">
          {paid ? "Order confirmed" : "Payment declined"}
        </p>
        <h1 className="display mt-3 text-[clamp(1.75rem,5vw,3rem)]">
          {paid ? "Thank you." : "That did not go through."}
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-ink-500">
          {paid ? (
            <>
              Order <span className="font-semibold text-ink-900">{data.orderNumber}</span> is
              confirmed. We&apos;ve emailed a receipt to{" "}
              <span className="font-medium text-ink-900">{data.shippingInfo.email}</span>, and it
              should arrive by{" "}
              <span className="font-medium text-ink-900">
                {eta.toLocaleDateString(undefined, { day: "numeric", month: "long" })}
              </span>
              .
            </>
          ) : (
            <>
              Order <span className="font-semibold text-ink-900">{data.orderNumber}</span> was
              created but not charged, and your items are still in your cart. This is the simulated
              decline — untick the box on the checkout page to complete a normal order.
            </>
          )}
        </p>

        <div className="mt-10 rounded-xl border border-shell-300 bg-shell-50 p-6">
          <h2 className="eyebrow">Items</h2>
          <ul className="mt-4 space-y-3">
            {data.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.name}</span>
                  {item.variantName && (
                    <span className="block text-xs text-ink-400">{item.variantName}</span>
                  )}
                </span>
                <span className="shrink-0 text-ink-500 tabular-nums">×{item.qty}</span>
                <span className="w-20 shrink-0 text-right font-medium tabular-nums">
                  ${(item.price * item.qty).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-shell-300 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Subtotal</dt>
              <dd className="tabular-nums">${data.subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Shipping</dt>
              <dd className="tabular-nums">
                {data.shipping === 0 ? "Free" : `$${data.shipping.toFixed(2)}`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Tax</dt>
              <dd className="tabular-nums">${data.tax.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between border-t border-shell-300 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">${data.total.toFixed(2)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 rounded-xl border border-shell-300 p-6">
          <h2 className="eyebrow">Shipping to</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed text-ink-500">
            {data.shippingInfo.fullName}
            <br />
            {data.shippingInfo.line1}
            {data.shippingInfo.line2 && (
              <>
                <br />
                {data.shippingInfo.line2}
              </>
            )}
            <br />
            {data.shippingInfo.city}, {data.shippingInfo.state} {data.shippingInfo.postalCode}
            <br />
            {data.shippingInfo.country}
          </address>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button to={SHOP_PATH} variant="solid" size="md" withArrow>
            Back to the product
          </Button>
          <Link
            to="/account"
            className="inline-flex h-11 items-center rounded-full border border-shell-300 px-6 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:border-ink-900"
          >
            View orders
          </Link>
        </div>
      </div>
    </div>
  );
}
