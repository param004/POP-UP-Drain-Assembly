import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import SceneCanvas from "./SceneCanvas.jsx";
import ExplodeSlider from "./ExplodeSlider.jsx";
import { HotspotCard, HotspotMarker } from "./Hotspot.jsx";
import Button from "../ui/Button.jsx";
import Spinner from "../ui/Feedback.jsx";
import useMediaQuery, { SM } from "../../hooks/useMediaQuery.js";
import useInView from "../../hooks/useInView.js";
import { EXPLODE_STEPS } from "../../data/explodeConfig.js";

/**
 * `<ProductViewer />` — the interactive 3D explorer, reused verbatim on the
 * homepage and the product detail page.
 *
 * All interactive state lives here and flows one way:
 *   explode slider ─┐
 *   carousel dot  ──┼──> viewRef.target  (read by the model + camera rig)
 *   hotspot click  ──┘
 *
 * `viewRef` is a plain mutable object rather than React state because it is read
 * every animation frame; routing it through state would re-render the tree 60
 * times a second for no benefit.
 */
export default function ProductViewer({
  product,
  className = "",
  showSidebar = true,
  showSteps = true,
  compact = false,
}) {
  const hotspots = useMemo(() => product?.hotspots ?? [], [product]);
  const variants = useMemo(() => product?.variants ?? [], [product]);

  const [explode, setExplode] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [openHotspot, setOpenHotspot] = useState(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [variantSlug, setVariantSlug] = useState(variants[0]?.slug ?? "assembled");
  const [pressDemo, setPressDemo] = useState(0);
  const [ready, setReady] = useState(false);

  const viewRef = useRef({ target: 0, smooth: 0, nodes: null });
  // Two DOM layers driven by the projector: the numbered markers, and the spec
  // cards docked to the canvas edge.
  const markerRefs = useRef([]);
  const tipRefs = useRef([]);
  // Controls whether the single explode slider is a vertical or horizontal track.
  const isDesktop = useMediaQuery(SM);
  // Park the render loop when scrolled away. The product page holds this viewer
  // *and* a scroll story; two live WebGL contexts would halve the frame rate.
  const { ref: stageRef, inView, hasBeenInView } = useInView();

  const section = variantSlug === "cross-section";

  /* Keep the slider, the model and the camera on the same value. */
  const applyExplode = useCallback((next, stepIndex = null) => {
    viewRef.current.target = next;
    setExplode(next);
    if (stepIndex != null) setActiveStep(stepIndex);
  }, []);

  const goToStep = useCallback(
    (i) => {
      const step = EXPLODE_STEPS[i];
      if (!step) return;
      setOpenHotspot(null);
      applyExplode(step.explode, i);
      // Point the camera rig at this step. Written straight onto the ref the rig
      // reads each frame, so there is no state round-trip.
      viewRef.current.focusY = step.y;
      viewRef.current.focusDist = step.dist;
      viewRef.current.takeControl = true;
    },
    [applyExplode]
  );

  const step = EXPLODE_STEPS[activeStep] ?? EXPLODE_STEPS[0];
  // activeStep === -1 means the visitor moved the slider by hand, so the copy
  // reflects what they are actually looking at rather than a carousel preset.
  const manual = activeStep === -1;
  const pct = Math.round(explode * 100);

  const focusHotspot = useCallback((hotspot) => {
    setOpenHotspot((cur) => (cur === hotspot.index ? null : hotspot.index));
  }, []);

  // A tooltip must be dismissible with Escape, as expected of any overlay.
  useEffect(() => {
    if (openHotspot == null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenHotspot(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openHotspot]);

  // The press demo eases 0 -> 1 -> 0 so the mechanism opens and closes on its own.
  const runPressDemo = useCallback(() => {
    if (pressDemo > 0) {
      setPressDemo(0);
      return;
    }
    let start = null;
    const DURATION = 1500;
    const tick = (ts) => {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / DURATION);
      // Rise fast, fall slow — the way a real weighted stopper behaves.
      setPressDemo(t < 0.35 ? t / 0.35 : 1 - (t - 0.35) / 0.65);
      if (t < 1) requestAnimationFrame(tick);
      else setPressDemo(0);
    };
    requestAnimationFrame(tick);
  }, [pressDemo]);

  // Stop the press demo if the visitor grabs the explode slider instead.
  const handleExplode = useCallback((v) => {
    setPressDemo(0);
    setActiveStep(-1);
    applyExplode(v);
    // Release the scripted camera framing so the rig goes back to fitting the
    // whole assembly to the frame, which is what a hand-driven slider implies.
    viewRef.current.focusY = undefined;
    viewRef.current.focusDist = undefined;
  }, [applyExplode]);

  const activeSpec = hotspots.find((h) => h.index === openHotspot);
  const hoveredNode = useMemo(() => {
    const h = hotspots.find((x) => x.index === hoveredHotspot);
    return h?.node ?? null;
  }, [hotspots, hoveredHotspot]);

  if (!product) return null;

  return (
    <div
      className={`grid gap-8 ${
        // With no sidebar there is nothing for a second column to hold, and leaving
        // the two-column track in place squeezed the canvas into a fraction of the
        // available width. One column in that case.
        showSidebar ? "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12" : ""
      } ${className}`}
    >
      {/* ------------------------------- sidebar ------------------------------- */}
      {showSidebar && (
        <div className="flex flex-col justify-center order-2 lg:order-1">
          <p className="eyebrow">Interactive 3D</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl lg:text-5xl">
            {activeSpec
              ? activeSpec.label
              : manual
                ? pct === 0
                  ? "Assembled"
                  : pct >= 99
                    ? "Fully exploded"
                    : "Exploded view"
                : step.label}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-500 sm:text-base">
            {activeSpec
              ? activeSpec.summary
              : manual
                ? pct === 0
                  ? "The unit as it ships. Drag the explode slider to separate it."
                  : `Separated to ${pct}%. Scrub the slider, or tap a marker to read that part's specification.`
                : step.caption}
          </p>

          {/* Part list doubles as navigation: picking a row opens that hotspot. */}
          <ul className="mt-7 divide-y divide-shell-300 border-y border-shell-300">
            {hotspots.map((h) => {
              const isOpen = openHotspot === h.index;
              return (
                <li key={h.index}>
                  <button
                    type="button"
                    onClick={() => {
                      focusHotspot(h);
                      setActiveStep(-1);
                    }}
                    onPointerEnter={() => setHoveredHotspot(h.index)}
                    onPointerLeave={() => setHoveredHotspot(null)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center gap-4 py-3 text-left transition-colors hover:text-ink-500"
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.625rem] font-semibold tabular-nums transition-colors ${
                        isOpen
                          ? "bg-ink-900 text-shell-100"
                          : "border border-shell-300 text-ink-500 group-hover:border-ink-900"
                      }`}
                    >
                      {h.index}
                    </span>
                    <span className="flex-1 text-sm font-medium">{h.label}</span>
                    <span
                      className={`text-ink-400 transition-transform duration-300 ${
                        isOpen ? "rotate-90" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Variant swatches: assembled vs. client-side cross-section. */}
          {variants.length > 1 && (
            <div className="mt-7">
              <p className="eyebrow">View</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isActive = v.slug === variantSlug;
                  return (
                    <button
                      key={v.slug ?? v._id}
                      type="button"
                      onClick={() => setVariantSlug(v.slug)}
                      aria-pressed={isActive}
                      className={`rounded-full border px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                        isActive
                          ? "border-ink-900 bg-ink-900 text-shell-100"
                          : "border-shell-300 text-ink-500 hover:border-ink-900 hover:text-ink-900"
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-400">
                {variants.find((v) => v.slug === variantSlug)?.description}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button to={`/products/${product.slug}`} variant="solid" size="md" withArrow>
              Shop Now
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={runPressDemo}
              className="border-shell-300"
            >
              {pressDemo > 0 ? "Reset" : "Press to Pop"}
            </Button>
          </div>
        </div>
      )}

      {/* -------------------------------- canvas -------------------------------- */}
      <div className="order-1 lg:order-2">
        <div
          ref={stageRef}
          className="relative overflow-hidden rounded-xl border border-shell-300 bg-[radial-gradient(120%_90%_at_50%_10%,#fbfbfa_0%,#eceae6_55%,#dedbd6_100%)]"
          style={{ aspectRatio: compact ? "4 / 3" : "1 / 1" }}
        >
          {!ready && (
            <div className="absolute inset-0 grid place-items-center">
              <Spinner label="Loading model" />
            </div>
          )}

          {/* Mounted once it first scrolls into view, then paused while away. */}
          {hasBeenInView && (
            <SceneCanvas
              modelUrl={product.modelUrl}
              hotspots={hotspots}
              viewRef={viewRef}
              markerRefs={markerRefs}
              tipRefs={tipRefs}
              hoveredNode={hoveredNode}
              section={section}
              pressDemo={pressDemo}
              suspendRotate={openHotspot != null}
              active={inView}
              onReady={() => setReady(true)}
            />
          )}

          {/* Hotspot spec cards, docked to the canvas edge nearest their marker. */}
          <div className="pointer-events-none absolute inset-0">
            {hotspots.map((h, i) => (
              <HotspotCard
                key={h.index}
                hotspot={h}
                registerRef={(el) => {
                  tipRefs.current[i] = el;
                }}
                open={openHotspot === h.index}
                onClose={() => setOpenHotspot(null)}
              />
            ))}
          </div>

          {/* Numbered markers, positioned on their parts by HotspotProjector. */}
          <div className="pointer-events-none absolute inset-0">
            {hotspots.map((h, i) => (
              <HotspotMarker
                key={h.index}
                hotspot={h}
                registerRef={(el) => {
                  markerRefs.current[i] = el;
                }}
                open={openHotspot === h.index}
                onToggle={() => {
                  focusHotspot(h);
                  setActiveStep(-1);
                }}
                onHover={(on) => setHoveredHotspot(on ? h.index : null)}
              />
            ))}
          </div>

          {/*
            One slider, two arrangements. On desktop it is a vertical track pinned
            to the right edge of the canvas; below `sm` it becomes a horizontal
            track in a bar beneath the canvas. Rendering both and hiding one with
            Tailwind would put two controls with the same accessible name in the
            document, so the orientation is switched here instead.
          */}
          {isDesktop ? (
            <div className="pointer-events-auto absolute right-3 top-1/2 h-[58%] -translate-y-1/2">
              <ExplodeSlider value={explode} onChange={handleExplode} orientation="vertical" />
            </div>
          ) : (
            <div className="pointer-events-auto border-t border-shell-300/70 bg-shell-100/70 px-5 py-3 backdrop-blur-sm">
              <ExplodeSlider value={explode} onChange={handleExplode} orientation="horizontal" />
            </div>
          )}

          {/* Carousel dots */}
          {showSteps && (
            <StepDots
              steps={EXPLODE_STEPS}
              active={activeStep}
              onSelect={goToStep}
              label={
                activeStep === -1 ? `Explode ${pct}%` : step.label
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepDots({ steps, active, onSelect, label }) {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 sm:bottom-5 sm:gap-4">
      <button
        type="button"
        onClick={() => onSelect(Math.max(0, active - 1))}
        disabled={active <= 0}
        aria-label="Previous view"
        className="grid h-7 w-7 place-items-center rounded-full text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-25"
      >
        <Chevron dir="left" />
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={s.label}
              aria-current={isActive ? "true" : undefined}
              className="group grid h-6 w-5 place-items-center sm:w-6"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? "h-2 w-2 bg-ink-900"
                    : "h-1.5 w-1.5 bg-ink-400/60 group-hover:bg-ink-500"
                }`}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onSelect(Math.min(steps.length - 1, active + 1))}
        disabled={active >= steps.length - 1}
        aria-label="Next view"
        className="grid h-7 w-7 place-items-center rounded-full text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-25"
      >
        <Chevron dir="right" />
      </button>

      {/*
        The caption lives in the space to the left of the rail and is dropped on
        narrow canvases. With the vertical slider already occupying the right edge
        there is not room for both, and overlapping them reads as a glitch.
      */}
      <span className="eyebrow pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap 2xl:inline">
        {label}
      </span>
    </div>
  );
}

function Chevron({ dir }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === "left" ? <path d="M10 3L5 8l5 5" /> : <path d="M6 3l5 5-5 5" />}
    </svg>
  );
}
