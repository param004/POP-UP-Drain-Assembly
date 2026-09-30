import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MODEL_BOUNDS, NODE_EXPLODE, explodedBounds, partYAt } from "../data/explodeConfig.js";

/** SceneCanvas camera field of view, in radians. Mirrored so auto-framing matches. */
const THREE_FOV_RAD = (32 * Math.PI) / 180;

/* -------------------------------------------------------------------------- */
/*                              chapter definitions                             */
/* -------------------------------------------------------------------------- */

/**
 * Explode value to reach for each part as it is introduced.
 *
 * The tiers peel in order (cap → shaft → collar → tip → flange → gasket → body),
 * and each part's value is chosen so that tier has visibly separated by the time
 * the camera arrives on it, while everything below it is still in place.
 */
const PART_EXPLODE = [0.3, 0.55, 0.8, 0.9, 1];

/**
 * Base distance when framing a single part, before its own size is added.
 * Tuned by eye against the real model: close enough that the part is unmistakably
 * the subject, wide enough that the part is never cropped by the frame edge.
 */
const MIN_PART_DIST = 4.6;

/** How much of the framing distance comes from the part's own measured size. */
const PART_SIZE_WEIGHT = 2.1;

/**
 * Builds the storyboard from the product's own hotspots, so the narrative is
 * driven by the BOM in the database rather than by hard-coded copy in the client.
 */
export function buildChapters(product) {
  if (!product) return [];

  const hotspots = product.hotspots ?? [];

  const chapters = [
    {
      id: "intro",
      kind: "whole",
      label: product.name,
      eyebrow: "the assembly",
      caption:
        product.tagline ||
        "A press-to-close drain built around a single pivot. Scroll to take it apart.",
      hotspot: null,
      explode: 0,
      dist: null,
    },
  ];

  hotspots.forEach((h, i) => {
    chapters.push({
      id: `part-${h.index}`,
      kind: "part",
      label: h.label,
      eyebrow: `part ${String(h.index).padStart(2, "0")} of ${String(hotspots.length).padStart(2, "0")}`,
      caption: h.summary,
      specs: h.specs,
      hotspot: h.index,
      node: h.node,
      explode: PART_EXPLODE[i] ?? Math.min(1, 0.3 + i * 0.17),
      dist: null,
    });
  });

  // Pull all the way back on the fully separated assembly: every part visible at
  // once, in the order it comes apart.
  chapters.push({
    id: "overview",
    kind: "overview",
    label: "Every part",
    eyebrow: "the breakdown",
    caption: `All ${hotspots.length} numbered parts, separated in assembly order.`,
    hotspot: null,
    explode: 1,
    dist: null,
  });

  // And close on the whole product again, reassembled.
  chapters.push({
    id: "complete",
    kind: "whole",
    label: "The complete product",
    eyebrow: "back together",
    caption: "Twenty-three parts. One pivot. Nothing to adjust, nothing to seize.",
    hotspot: null,
    explode: 0,
    dist: null,
  });

  return chapters;
}

/* -------------------------------------------------------------------------- */
/*                                  the hook                                    */
/* -------------------------------------------------------------------------- */

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);
const clamp01 = (n) => clamp(n, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
/** Smootherstep — zero 1st AND 2nd derivative at both ends, so beats don't jolt. */
const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/**
 * Drives a scroll-linked 3D narrative.
 *
 * The page provides a tall spacer element; this hook measures how far through it
 * the viewport has travelled and returns a continuous `progress` in 0..1. The
 * caller maps that onto chapters — see `sampleStory` for the interpolation.
 *
 * Two things make this feel authored rather than merely scrubbed:
 *
 *   - Progress is damped with a frame-rate independent lerp, so a flicked scroll
 *     wheel or a trackpad fling arrives as one continuous camera move.
 *   - Chapter boundaries get an eased crossfade, so the camera eases out of one
 *     part and into the next instead of snapping at the seam.
 */
export default function useScrollStory({ chapters, viewRef, spacerRef, enabled = true }) {
  // Only the chapter INDEX lives in React state. The continuous progress is kept in
  // a ref, because this runs every frame: pushing progress through state would
  // re-render the whole section 60 times a second, which starves the copy
  // transition and makes the narrative feel like it is stuttering.
  const [chapter, setChapter] = useState(0);

  const progressRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef(0);
  const onProgressRef = useRef(null);

  // Total scrollable distance through the spacer, in px.
  const spanRef = useRef(1);

  const measure = useCallback(() => {
    const el = spacerRef?.current;
    if (!el) return;
    // The spacer is `N x 100vh` tall with a `100vh` sticky child, so the distance
    // the visitor can travel while the child is pinned is height - one viewport.
    const span = el.offsetHeight - window.innerHeight;
    spanRef.current = Math.max(1, span);
  }, [spacerRef]);

  const readScroll = useCallback(() => {
    const el = spacerRef?.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // How far the top of the spacer has passed above the viewport top.
    const travelled = -rect.top;
    targetRef.current = clamp01(travelled / spanRef.current);
  }, [spacerRef]);

  /* ------------------------------ the rAF loop ----------------------------- */

  useEffect(() => {
    if (!enabled || !chapters.length) return;

    measure();
    readScroll();

    const onScroll = () => readScroll();
    const onResize = () => {
      measure();
      readScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;

      // Frame-rate independent damping. The per-frame step is capped so a long
      // stall (a backgrounded tab, a GC pause) cannot teleport the camera, but the
      // cap must not make convergence depend on the *frame count* — on a page with
      // two WebGL contexts the frame rate halves, and a small cap with a tight snap
      // threshold left the story permanently a beat behind the scroll position.
      const step = Math.min(dt, 0.1);
      const k = 1 - Math.exp(-step * 6);
      progressRef.current += (targetRef.current - progressRef.current) * k;

      // Snap once close enough that the remaining difference is invisible. The
      // threshold is a fraction of a chapter, not 0.0002: being 0.3 % of the way
      // off is imperceptible but enough to sit on the wrong side of a boundary.
      if (Math.abs(targetRef.current - progressRef.current) < 0.004) {
        progressRef.current = targetRef.current;
      }

      const pos = progressRef.current * (chapters.length - 1);
      const index = clamp(Math.round(pos), 0, chapters.length - 1);

      // Re-render only on a chapter boundary — a handful of times per scroll, not
      // sixty times a second.
      setChapter((c) => (c === index ? c : index));

      if (viewRef?.current) viewRef.current.storyProgress = progressRef.current;
      // Lets the chapter rail paint its progress hairline without a React render.
      onProgressRef.current?.(progressRef.current);

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [chapters.length, enabled, measure, readScroll, viewRef]);

  /** Scrolls the page to the start of a chapter. Used by the chapter rail. */
  const goToChapter = useCallback(
    (index) => {
      const el = spacerRef?.current;
      if (!el) return;
      const clamped = clamp(index, 0, chapters.length - 1);
      const p = chapters.length > 1 ? clamped / (chapters.length - 1) : 0;
      const top = el.getBoundingClientRect().top + window.scrollY + p * spanRef.current;
      window.scrollTo({ top, behavior: "smooth" });
    },
    [chapters.length, spacerRef]
  );

  return {
    chapter,
    progressRef,
    /** Called every frame with 0..1; use for direct DOM writes, not state. */
    setOnProgress: (fn) => {
      onProgressRef.current = fn;
    },
    goToChapter,
  };
}

/* -------------------------------------------------------------------------- */
/*                            chapter interpolation                             */
/* -------------------------------------------------------------------------- */

/**
 * Samples the storyboard at a continuous progress value.
 *
 * Returns the blended explode, focus height and focus distance for that instant.
 * The camera target is a blend of the two neighbouring parts' current heights,
 * which is what produces the "travel from part to part" move rather than a cut.
 *
 * Part beats script an explicit focus; whole-assembly beats hand framing back to
 * the camera rig's own fit, so a single formula (reused here) covers both and the
 * handoff between them is smooth.
 */
export function sampleStory({ chapters, progress, nodeRadius }) {
  if (!chapters.length) return null;

  const pos = clamp01(progress) * (chapters.length - 1);
  const i = clamp(Math.floor(pos), 0, chapters.length - 1);
  const j = clamp(i + 1, 0, chapters.length - 1);
  const t = smooth(clamp01(pos - i));

  const a = chapters[i];
  const b = chapters[j];

  const explode = lerp(a.explode, b.explode, t);

  /**
   * The camera rig's own framing for a given explode value. Mirrored here so the
   * story can blend *into* the automatic behaviour instead of switching to it,
   * which is what would otherwise make the story jump when a part beat hands back.
   */
  const autoFocus = (explodeValue) => {
    const bounds = explodedBounds(explodeValue);
    const height = Math.max(1, bounds.max - bounds.min);
    const fov = THREE_FOV_RAD;
    const needed =
      (Math.max(height * 0.5, MODEL_BOUNDS.radius) / Math.tan(fov / 2)) * 1.12 + 0.45;
    return { y: (bounds.min + bounds.max) / 2, dist: needed };
  };

  const focusFor = (ch) => {
    if (ch.node && nodeRadius) {
      const r = nodeRadius(ch.node);
      if (r) {
        return {
          y: partYAt(ch.node, ch.explode),
          // Enough of a close-up to make the part the subject, but not so tight
          // that it is cropped by the frame edge.
          dist: MIN_PART_DIST + r * PART_SIZE_WEIGHT,
        };
      }
    }
    return autoFocus(ch.explode);
  };

  const fa = focusFor(a);
  const fb = focusFor(b);

  return {
    explode,
    focusY: lerp(fa.y, fb.y, t),
    focusDist: lerp(fa.dist, fb.dist, t),
    from: a,
    to: b,
    blend: t,
  };
}

/**
 * Which part (if any) should be highlighted right now, and how strongly.
 *
 * The highlight fades in over the first third of a part's beat and out over the
 * last third, so the emphasis is on the part *while* it is being talked about
 * rather than slamming on at a boundary.
 */
export function activeFocus({ chapters, progress }) {
  if (!chapters.length) return null;
  const pos = clamp01(progress) * (chapters.length - 1);
  const nearest = chapters[clamp(Math.round(pos), 0, chapters.length - 1)];
  if (!nearest?.node) return null;

  const band = pos - Math.floor(pos);
  const centred = Math.abs(band - 0.5) < 0.32;
  const strength = centred
    ? 1 - Math.abs(band - 0.5) / 0.32
    : 0;

  if (strength <= 0.12) return null;

  // Highlight the whole explode tier, not just the single node the hotspot points
  // at: a "part" in this model is several meshes (the cap is the disc *plus* its
  // lower rim and the brass underneath), and dimming half of it reads as a bug.
  const tier = NODE_EXPLODE.get(nearest.node)?.tier ?? null;
  const nodes = tier
    ? [...NODE_EXPLODE.entries()].filter(([, e]) => e.tier === tier).map(([n]) => n)
    : [nearest.node];

  return { node: nearest.node, tier, nodes, index: nearest.hotspot, strength };
}

/** Convenience hook wrapper so callers do not import three named things. */
export function useStoryboard(product) {
  return useMemo(() => buildChapters(product), [product]);
}
