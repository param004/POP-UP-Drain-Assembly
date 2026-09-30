import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query and re-renders when it changes.
 *
 * Used where layout genuinely differs in kind rather than in degree — for example
 * the explode slider, which is a vertical track beside the canvas on desktop and
 * a horizontal track beneath it on mobile. That is a structural difference, so it
 * is handled in JS (one element, two arrangements) rather than by rendering two
 * copies and hiding one, which would duplicate every accessible name.
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);

    // Re-sync in case the viewport changed between first render and this effect.
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Tailwind's `sm` breakpoint, which is where the layout switches. */
export const SM = "(min-width: 640px)";
