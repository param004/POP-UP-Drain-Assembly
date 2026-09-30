import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../api/endpoints.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

const EMPTY = { items: [], subtotal: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Identifies which mutation is in flight so the UI can disable just that row
  // instead of flashing the whole cart.
  const [pendingItem, setPendingItem] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.fetchCart();
      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-sync whenever identity changes: signing in claims the guest cart server-side.
  useEffect(() => {
    setLoading(true);
    load();
  }, [isAuthenticated, load]);

  /** Runs a mutation, then replaces local state with the server's authoritative cart. */
  const run = useCallback(async (itemId, fn) => {
    setPendingItem(itemId ?? "new");
    setError(null);
    try {
      const data = await fn();
      setCart(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setPendingItem(null);
    }
  }, []);

  const addItem = useCallback(
    (productId, variantId = null, qty = 1) => run("new", () => api.addToCart({ productId, variantId, qty })),
    [run]
  );

  const setQty = useCallback(
    (itemId, qty) => run(itemId, () => api.updateCartItem(itemId, qty)),
    [run]
  );

  const removeItem = useCallback(
    (itemId) => run(itemId, () => api.removeCartItem(itemId)),
    [run]
  );

  const empty = useCallback(() => run("all", () => api.clearCart()), [run]);

  const value = useMemo(() => {
    const count = cart.items.reduce((n, i) => n + i.qty, 0);
    return {
      items: cart.items,
      count,
      subtotal: cart.subtotal,
      loading,
      error,
      pendingItem,
      isEmpty: cart.items.length === 0,
      hasUnavailable: cart.items.some((i) => !i.available),
      addItem,
      setQty,
      removeItem,
      empty,
      refresh: load,
      clearError: () => setError(null),
    };
  }, [cart, loading, error, pendingItem, addItem, setQty, removeItem, empty, load]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
