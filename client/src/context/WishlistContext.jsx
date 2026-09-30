import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../api/endpoints.js";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    api
      .fetchWishlist()
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const toggle = useCallback(
    async (productId) => {
      if (!isAuthenticated) return { requiresAuth: true };
      const has = items.some((p) => p._id === productId);
      // Optimistic: the heart fills immediately, and rolls back if the call fails.
      const previous = items;
      setItems((cur) =>
        has ? cur.filter((p) => p._id !== productId) : [...cur, { _id: productId }]
      );
      try {
        if (has) await api.removeFromWishlist(productId);
        else await api.addToWishlist(productId);
        return { added: !has };
      } catch (err) {
        setItems(previous);
        throw err;
      }
    },
    [items, isAuthenticated]
  );

  // ids as a Set, so product cards can check membership in constant time.
  const ids = useMemo(() => new Set(items.map((p) => String(p._id))), [items]);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      loading,
      toggle,
      ids,
      has: (productId) => ids.has(String(productId)),
    }),
    [items, loading, toggle, ids]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
