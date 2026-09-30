import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchMyOrders, updateProfile } from "../api/endpoints.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import PageHeader, { Banner, Field, Row, SectionTitle } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner, { EmptyState, ErrorState } from "../components/ui/Feedback.jsx";
import { SHOP_PATH } from "../data/paths.js";

export default function Account() {
  const { user, setUser, isAdmin, logout } = useAuth();
  const { count: wishCount } = useWishlist();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ["orders", "me"],
    queryFn: fetchMyOrders,
  });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      const data = await updateProfile({ name });
      setUser(data.user);
      setBanner({ tone: "success", text: "Profile updated." });
    } catch (err) {
      setBanner({ tone: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <PageHeader
        eyebrow="your account"
        title={user?.name ?? "Account"}
        lede={user?.email}
      />

      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[18rem_1fr] lg:gap-16">
          {/* ------------------------------- side ------------------------------- */}
          <aside className="space-y-8">
            <div>
              <p className="eyebrow">Details</p>
              <form onSubmit={save} className="mt-4 space-y-4">
                <Field label="Name" name="acct-name" value={name} onChange={(e) => setName(e.target.value)} />
                <Field label="Email" name="acct-email" value={user?.email ?? ""} disabled hint="Email changes are not enabled in this build." />
                {banner && <Banner tone={banner.tone}>{banner.text}</Banner>}
                <Button type="submit" variant="solid" size="sm" disabled={saving || !name.trim()}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </form>
            </div>

            <nav className="space-y-2 border-t border-shell-300 pt-6 text-sm">
              <Link to="/wishlist" className="flex items-center justify-between text-ink-500 hover:text-ink-900">
                Wishlist
                <span className="tabular-nums text-ink-400">{wishCount}</span>
              </Link>
              <Link to="/cart" className="block text-ink-500 hover:text-ink-900">
                Cart
              </Link>
              {isAdmin && (
                <Link to="/admin" className="block text-ink-500 hover:text-ink-900">
                  Admin dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="block text-left text-ink-500 hover:text-ink-900"
              >
                Sign out
              </button>
            </nav>
          </aside>

          {/* ------------------------------ orders ------------------------------ */}
          <div>
            <SectionTitle note={`${orders?.items?.length ?? 0} order${orders?.items?.length === 1 ? "" : "s"}`}>
              Order history
            </SectionTitle>

            <div className="mt-5">
              {isLoading ? (
                <Spinner label="Loading orders" />
              ) : error ? (
                <ErrorState message={error.message} onRetry={refetch} />
              ) : !orders?.items?.length ? (
                <EmptyState
                  title="No orders yet"
                  body="Once you place an order it will show up here."
                  action={
                    <Button to={SHOP_PATH} variant="outline" size="sm" withArrow>
                      View the product
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-shell-300 border-y border-shell-300">
                  {orders.items.map((order) => (
                    <li key={order._id} className="py-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                        <div>
                          <Link
                            to={`/order/${order.orderNumber}`}
                            className="text-sm font-semibold hover:underline underline-offset-4"
                          >
                            {order.orderNumber}
                          </Link>
                          <p className="mt-1 text-xs text-ink-400">
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {" · "}
                            {order.items.length} item{order.items.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums">${order.total.toFixed(2)}</p>
                          <p
                            className={`mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] ${
                              order.paymentStatus === "paid" ? "text-emerald-700" : "text-brass-500"
                            }`}
                          >
                            {order.paymentStatus}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
