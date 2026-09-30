import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProduct,
  deleteProduct,
  fetchAllOrders,
  fetchContactMessages,
  fetchProducts,
  updateOrderStatus,
  updateProduct,
} from "../api/endpoints.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader, { Banner, Field, Row, SectionTitle } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner, { ErrorState } from "../components/ui/Feedback.jsx";

const TABS = [
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products" },
  { id: "messages", label: "Messages" },
];

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("orders");

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <PageHeader
        eyebrow="admin"
        title="Dashboard"
        lede={`Signed in as ${user?.email}. Orders, catalogue and contact enquiries.`}
      >
        <nav className="mt-8 flex flex-wrap gap-1 border-b border-shell-300" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                tab === t.id
                  ? "border-ink-900 text-ink-900"
                  : "border-transparent text-ink-400 hover:text-ink-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </PageHeader>

      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
        {tab === "orders" && <OrdersPanel />}
        {tab === "products" && <ProductsPanel />}
        {tab === "messages" && <MessagesPanel />}
      </div>
    </div>
  );
}

/* ---------------------------------- orders --------------------------------- */

function OrdersPanel() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orders", "all", status],
    queryFn: () => fetchAllOrders({ status: status || undefined, limit: 50 }),
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ id, next }) => updateOrderStatus(id, next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  if (isLoading) return <Spinner label="Loading orders" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle note={`${data.total} total`}>All orders</SectionTitle>
        <div className="ml-auto flex gap-1">
          {["", "pending", "paid", "failed", "refunded"].map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={`rounded-full border px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
                status === s
                  ? "border-ink-900 bg-ink-900 text-shell-100"
                  : "border-shell-300 text-ink-500 hover:border-ink-900"
              }`}
            >
              {s || "all"}
            </button>
          ))}
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="mt-8 text-sm text-ink-400">No orders match this filter.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-shell-300 text-left text-[0.625rem] uppercase tracking-[0.14em] text-ink-400">
                <th className="py-3 pr-4 font-semibold">Order</th>
                <th className="py-3 pr-4 font-semibold">Customer</th>
                <th className="py-3 pr-4 font-semibold">Items</th>
                <th className="py-3 pr-4 font-semibold">Total</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shell-200">
              {data.items.map((o) => (
                <tr key={o._id} className="align-top">
                  <td className="py-4 pr-4">
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-xs text-ink-400">
                      {new Date(o.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <p>{o.shippingInfo.fullName}</p>
                    <p className="text-xs text-ink-400">{o.shippingInfo.email}</p>
                    <p className="text-xs text-ink-400">
                      {o.shippingInfo.city}, {o.shippingInfo.state}
                    </p>
                  </td>
                  <td className="py-4 pr-4 text-ink-500">
                    {o.items.map((i) => (
                      <p key={i.name}>
                        {i.qty}× {i.name}
                      </p>
                    ))}
                  </td>
                  <td className="py-4 pr-4 font-semibold tabular-nums">
                    ${o.total.toFixed(2)}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] ${
                        o.paymentStatus === "paid"
                          ? "bg-emerald-600/10 text-emerald-700"
                          : o.paymentStatus === "failed"
                            ? "bg-brass-500/10 text-brass-500"
                            : "bg-shell-200 text-ink-500"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4">
                    <select
                      value={o.paymentStatus}
                      onChange={(e) =>
                        setStatusMutation.mutate({ id: o._id, next: e.target.value })
                      }
                      aria-label={`Update status for ${o.orderNumber}`}
                      className="h-9 rounded-full border border-shell-300 bg-shell-50 px-3 text-xs outline-none focus:border-ink-900"
                    >
                      {["pending", "paid", "failed", "refunded"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- products -------------------------------- */

const BLANK = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  price: "",
  category: "",
  material: "",
  stock: "0",
  modelUrl: "",
};

function ProductsPanel() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [banner, setBanner] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => fetchProducts({ limit: 48, sort: "name" }),
  });

  const save = useMutation({
    mutationFn: (payload) =>
      payload._id ? updateProduct(payload._id, payload) : createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      setForm(BLANK);
      setBanner({ tone: "success", text: "Saved." });
    },
    onError: (err) => setBanner({ tone: "error", text: err.message }),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setBanner({ tone: "success", text: "Product removed." });
    },
    onError: (err) => setBanner({ tone: "error", text: err.message }),
  });

  const startEdit = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name,
      slug: p.slug,
      tagline: p.tagline ?? "",
      description: p.description ?? "",
      price: String(p.price),
      category: p.category,
      material: p.material ?? "",
      stock: String(p.stock),
      modelUrl: p.modelUrl ?? "",
      _id: p._id,
    });
    setBanner(null);
  };

  const submit = (e) => {
    e.preventDefault();
    const { _id, ...rest } = form;
    save.mutate({ ...rest, price: Number(form.price), stock: Number(form.stock) });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isLoading) return <Spinner label="Loading products" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div>
      {banner && (
        <div className="mb-5 max-w-md">
          <Banner tone={banner.tone}>{banner.text}</Banner>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
        {/* ------------------------------ table ------------------------------ */}
        <div>
          <SectionTitle note={`${data.total} products`}>Catalogue</SectionTitle>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-shell-300 text-left text-[0.625rem] uppercase tracking-[0.14em] text-ink-400">
                  <th className="py-3 pr-4 font-semibold">Product</th>
                  <th className="py-3 pr-4 font-semibold">Category</th>
                  <th className="py-3 pr-4 font-semibold">Price</th>
                  <th className="py-3 pr-4 font-semibold">Stock</th>
                  <th className="py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shell-200">
                {data.items.map((p) => (
                  <tr key={p._id}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-ink-400">/{p.slug}</p>
                    </td>
                    <td className="py-4 pr-4 text-ink-500">{p.category}</td>
                    <td className="py-4 pr-4 tabular-nums">${p.price}</td>
                    <td className="py-4 pr-4 tabular-nums">
                      {p.stock}
                      {!p.isActive && <span className="ml-2 text-xs text-brass-500">archived</span>}
                    </td>
                    <td className="py-4">
                      <div className="flex gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="underline underline-offset-4 hover:text-ink-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove.mutate(p._id)}
                          disabled={remove.isPending || !p.isActive}
                          className="text-ink-400 underline underline-offset-4 hover:text-brass-500 disabled:opacity-30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ------------------------------ editor ----------------------------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-shell-300 bg-shell-50 p-5">
            <p className="eyebrow">{editing ? "Edit product" : "New product"}</p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <Field label="Name" name="ap-name" value={form.name} onChange={set("name")} required />
              <Field
                label="Slug"
                name="ap-slug"
                value={form.slug}
                onChange={set("slug")}
                hint={editing ? undefined : "Left blank, generated from the name on save."}
              />
              <Field label="Tagline" name="ap-tagline" value={form.tagline} onChange={set("tagline")} />
              <Field
                as="textarea"
                label="Description"
                name="ap-desc"
                rows={3}
                value={form.description}
                onChange={set("description")}
              />
              <Row>
                <Field label="Price" name="ap-price" type="number" step="0.01" min="0" value={form.price} onChange={set("price")} required />
                <Field label="Stock" name="ap-stock" type="number" min="0" value={form.stock} onChange={set("stock")} required />
              </Row>
              <Row>
                <Field label="Category" name="ap-cat" value={form.category} onChange={set("category")} required />
                <Field label="Material" name="ap-mat" value={form.material} onChange={set("material")} />
              </Row>
              <Field
                label="Model URL"
                name="ap-model"
                value={form.modelUrl}
                onChange={set("modelUrl")}
                placeholder="/models/pop_up_drain_final_animation.glb"
              />

              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  variant="solid"
                  size="sm"
                  disabled={save.isPending}
                  className="flex-1"
                >
                  {save.isPending ? "Saving…" : editing ? "Update" : "Create"}
                </Button>
                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(null);
                      setForm(BLANK);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* --------------------------------- messages -------------------------------- */

function MessagesPanel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["contact", "messages"],
    queryFn: fetchContactMessages,
  });

  if (isLoading) return <Spinner label="Loading messages" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (data.items.length === 0) {
    return <p className="text-sm text-ink-400">No enquiries yet.</p>;
  }

  return (
    <div>
      <SectionTitle note={`${data.items.length} received`}>Contact enquiries</SectionTitle>
      <ul className="mt-6 space-y-4">
        {data.items.map((m) => (
          <li key={m._id} className="rounded-xl border border-shell-300 bg-shell-50 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{m.name}</p>
                <a
                  href={`mailto:${m.email}`}
                  className="text-xs text-ink-400 underline underline-offset-4 hover:text-ink-900"
                >
                  {m.email}
                </a>
              </div>
              <p className="text-xs text-ink-400">
                {new Date(m.createdAt).toLocaleString()}
                {m.delivered ? " · emailed" : " · stored only"}
              </p>
            </div>
            {m.subject && <p className="mt-3 text-sm font-medium">{m.subject}</p>}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-500">
              {m.message}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
