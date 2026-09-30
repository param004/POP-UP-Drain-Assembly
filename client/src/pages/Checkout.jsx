import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { createOrder } from "../api/endpoints.js";
import PageHeader, { Banner, Field, Row, SectionTitle } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner, { EmptyState } from "../components/ui/Feedback.jsx";
import { SHOP_PATH } from "../data/paths.js";

const TAX_RATE = 0.08;
const FREE_SHIPPING_OVER = 150;

const EMPTY = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
};

export default function Checkout() {
  const { items, subtotal, loading, refresh } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({
    ...EMPTY,
    fullName: user?.name ?? "",
    email: user?.email ?? "",
  }));
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Lets the reviewer exercise the declined-payment branch without real Stripe keys.
  const [simulateFailure, setSimulateFailure] = useState(false);

  const shipping = subtotal > FREE_SHIPPING_OVER || subtotal === 0 ? 0 : 12;
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address";
    if (!form.line1.trim()) next.line1 = "Required";
    if (!form.city.trim()) next.city = "Required";
    if (!form.state.trim()) next.state = "Required";
    if (!form.postalCode.trim()) next.postalCode = "Required";
    if (!form.country.trim()) next.country = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setBanner(null);
    if (!validate()) {
      setBanner({ tone: "error", text: "Please fix the highlighted fields." });
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        shippingInfo: form,
        paymentMethod: "mock",
        simulateFailure,
      });
      // The server empties the cart on a successful payment, so pull the new
      // state before navigating away from the cart-backed page.
      await refresh();
      navigate(`/order/${order.orderNumber}`, { state: { order } });
    } catch (err) {
      setBanner({ tone: "error", text: err.message });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center pt-24">
        <Spinner label="Loading checkout" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-16 sm:pt-[4.5rem]">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8">
          <EmptyState
            title="Nothing to check out"
            body="Your cart is empty."
            action={
              <Button to={SHOP_PATH} variant="solid" size="md" withArrow>
                View the product
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <p className="eyebrow">checkout</p>
        <h1 className="display mt-3 text-[clamp(2rem,5vw,3.5rem)]">Delivery &amp; payment</h1>

        {banner && (
          <div className="mt-6 max-w-lg">
            <Banner tone={banner.tone}>{banner.text}</Banner>
          </div>
        )}

        <form onSubmit={submit} noValidate className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
          <div className="max-w-2xl">
            {/* ------------------------------ contact ------------------------------ */}
            <SectionTitle>Contact</SectionTitle>
            <Row className="mt-5">
              <Field
                label="Full name"
                name="fullName"
                autoComplete="name"
                value={form.fullName}
                onChange={set("fullName")}
                error={errors.fullName}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                error={errors.email}
                hint={isAuthenticated ? undefined : "Order confirmation goes here."}
              />
            </Row>

            {/* ------------------------------ address ------------------------------ */}
            <SectionTitle note="Where should it ship?">Shipping address</SectionTitle>
            <div className="mt-5 space-y-4">
              <Field
                label="Address"
                name="line1"
                autoComplete="address-line1"
                value={form.line1}
                onChange={set("line1")}
                error={errors.line1}
              />
              <Field
                label="Apartment, suite (optional)"
                name="line2"
                autoComplete="address-line2"
                value={form.line2}
                onChange={set("line2")}
              />
              <Row>
                <Field
                  label="City"
                  name="city"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={set("city")}
                  error={errors.city}
                />
                <Field
                  label="State / region"
                  name="state"
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={set("state")}
                  error={errors.state}
                />
              </Row>
              <Row>
                <Field
                  label="Postal code"
                  name="postalCode"
                  autoComplete="postal-code"
                  value={form.postalCode}
                  onChange={set("postalCode")}
                  error={errors.postalCode}
                />
                <Field
                  label="Country"
                  name="country"
                  autoComplete="country-name"
                  value={form.country}
                  onChange={set("country")}
                  error={errors.country}
                />
              </Row>
              <Field
                label="Phone (optional)"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={set("phone")}
                hint="Only used if the courier needs to reach you."
              />
            </div>

            {/* ------------------------------ payment ------------------------------ */}
            <SectionTitle note="Test mode — no card is charged">Payment</SectionTitle>
            <div className="mt-5 rounded-xl border border-shell-300 bg-shell-50 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-900 text-shell-100">
                  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 8.5l3.5 3.5L13 5" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold">Mock payment</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    This build has no payment provider wired up. Placing the order marks it paid
                    and decrements stock, exactly as a real successful charge would. To see the
                    declined-payment path, use the control below.
                  </p>
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-shell-300 px-4 py-3">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="h-4 w-4 accent-ink-900"
                />
                <span className="text-xs text-ink-500">
                  Simulate a declined payment (creates the order as unpaid)
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="solid"
              size="lg"
              withArrow
              className="mt-8"
              disabled={submitting}
            >
              {submitting ? "Placing order…" : `Pay $${total.toFixed(2)}`}
            </Button>

            <p className="mt-4 text-xs text-ink-400">
              {isAuthenticated ? (
                <>This order will be saved to your account.</>
              ) : (
                <>
                  <Link to="/login" state={{ from: "/checkout" }} className="underline underline-offset-4">
                    Sign in
                  </Link>{" "}
                  to keep this order in your history. Guest checkout is fine too.
                </>
              )}
            </p>
          </div>

          {/* ------------------------------ summary ------------------------------ */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-shell-300 bg-shell-50 p-6">
              <h2 className="eyebrow">Order summary</h2>

              <ul className="mt-5 space-y-4">
                {items.map((item) => (
                  <li key={item._id} className="flex items-start gap-3 text-sm">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-shell-300 bg-shell-100">
                      <span className="text-[0.625rem] font-semibold tabular-nums text-ink-400">
                        {item.qty}×
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.product.name}</span>
                      {item.variantName && (
                        <span className="block text-xs text-ink-400">{item.variantName}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      ${item.lineTotal.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-2.5 border-t border-shell-300 pt-5 text-sm">
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
                  <dt className="text-ink-500">Tax</dt>
                  <dd className="font-medium tabular-nums">${tax.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-shell-300 pt-3 text-base">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-bold tabular-nums">${total.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
