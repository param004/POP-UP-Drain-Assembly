import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Handles in-page anchor links (#features). React Router does not scroll to a
 * hash on its own, and doing it here — rather than with a global scroll reset —
 * keeps the sticky header offset correct.
 */
export default function ScrollToTop() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    // The target may not be mounted yet on a cold load of a hashed route.
    const t = setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  }, [hash, pathname]);

  return null;
}
