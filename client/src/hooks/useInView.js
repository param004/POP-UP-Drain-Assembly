import { useEffect, useRef, useState } from "react";

/**
 * Reports whether an element is anywhere near the viewport.
 *
 * Used to park 3D canvases that are scrolled out of view. A page can hold two
 * viewers (the product page has a compact one beside the buy box and a scroll
 * story further down), and two live WebGL contexts halve the frame rate for
 * everyone. Pausing the offscreen one keeps exactly one loop running.
 *
 * `once` is useful for large media (a GLB is 1.5 MB): keep it false for canvases
 * that should resume, true for something you only want to load on first sight.
 */
export default function useInView({ rootMargin = "300px 0px", threshold = 0.01 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      setHasBeenInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasBeenInView(true);
      },
      { rootMargin, threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold]);

  return { ref, inView, hasBeenInView };
}
