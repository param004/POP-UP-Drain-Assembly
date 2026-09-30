import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import SceneCanvas from "../three/SceneCanvas.jsx";
import { HotspotCard, HotspotMarker } from "../three/Hotspot.jsx";
import Button from "../ui/Button.jsx";
import useInView from "../../hooks/useInView.js";
import useScrollStory, {
  activeFocus,
  buildChapters,
  sampleStory,
} from "../../hooks/useScrollStory.js";

/**
 * Scroll-driven product narrative.
 *
 * The section is a tall spacer with a `100vh` sticky stage. As the visitor scrolls
 * through it, `useScrollStory` reports a continuous progress value, which is
 * sampled into a per-frame camera target and explode value. The result is a guided
 * tour — focus a part, introduce it, move to the next — rather than a viewer the
 * visitor has to drive.
 *
 * The same SceneCanvas, hotspot projector and spec cards as the interactive viewer
 * are reused, so the two modes can never drift apart visually.
 *
 * Used in three places — the homepage explorer, the About page and the product
 * page — so the narrative is the consistent experience wherever the product is
 * showcased. The props exist only to let a page adapt the opening beat and the
 * call to action; the beats themselves always come from the product's hotspots.
 */
export default function ScrollStory({
  product,
  /** Overrides the opening beat's heading when the page already shows the name. */
  introLabel = null,
  introCaption = null,
  /** Set false to drop the "Shop Now" / "Skip to the end" row. */
  showCta = true,
  id,
}) {
  const chapters = useMemo(() => {
    const base = buildChapters(product);
    if (!introLabel && !introCaption) return base;
    // The opening beat is always chapter 0; override it in place.
    return base.map((c, i) =>
      i === 0
        ? { ...c, label: introLabel ?? c.label, caption: introCaption ?? c.caption }
        : c
    );
  }, [product, introLabel, introCaption]);
  const hotspots = useMemo(() => product?.hotspots ?? [], [product]);

  const spacerRef = useRef(null);
  const viewRef = useRef({
    target: 0,
    smooth: 0,
    nodes: null,
    focusY: 0.6,
    focusDist: 7.4,
    takeControl: false,
  });
  const markerRefs = useRef([]);
  const tipRefs = useRef([]);

  const [ready, setReady] = useState(false);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  // Park the render loop when the story is scrolled away — a page can hold this
  // viewer and an interactive one at the same time.
  const { ref: stageRef, inView } = useInView({ rootMargin: "600px 0px" });

  const { chapter: chapterIndex, progressRef, setOnProgress, goToChapter } = useScrollStory({
    chapters,
    viewRef,
    spacerRef,
  });

  const chapter = chapters[chapterIndex] ?? chapters[0];

  /* -------------------------------------------------------------------------- */
  /*                        drive the 3D from the story                          */
  /* -------------------------------------------------------------------------- */

  // Bounding radius per node, read from the real geometry so a flat cap and a long
  // shank get sensibly different camera distances.
  const radiusCache = useRef(new Map());
  const nodeRadius = useCallback((nodeName) => {
    if (radiusCache.current.has(nodeName)) return radiusCache.current.get(nodeName);
    const node = viewRef.current.nodes?.[nodeName];
    if (!node?.geometry) return 0;
    node.geometry.computeBoundingSphere();
    const s = node.scale ?? { x: 1, y: 1, z: 1 };
    const r = (node.geometry.boundingSphere?.radius ?? 1) * Math.max(s.x, s.y, s.z);
    radiusCache.current.set(nodeName, r);
    return r;
  }, []);

  // Written from a rAF loop rather than React state: these are render-loop hot
  // values, and routing them through state would re-render 60 times a second.
  // The focus highlight is computed here too, because it needs the same
  // per-frame progress and must not wait on a chapter-boundary render.
  const [focus, setFocus] = useState(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!chapters.length) return;
    let raf = 0;
    const tick = () => {
      const progress = viewRef.current.storyProgress ?? 0;
      const s = sampleStory({ chapters, progress, nodeRadius });
      if (s) {
        viewRef.current.target = s.explode;
        viewRef.current.focusY = s.focusY;
        viewRef.current.focusDist = s.focusDist;
        // Scripted moves assert control of the framing so a manual zoom earlier in
        // the page cannot strand the camera halfway through the story.
        viewRef.current.takeControl = true;
      }

      // Only push the highlight into React when the part actually changes, not on
      // every frame — the fade between them is handled by the damped camera and the
      // spec card, so a per-frame re-render would buy nothing.
      const f = activeFocus({ chapters, progress });
      const key = f?.node ?? null;
      if (key !== lastFocus.current) {
        lastFocus.current = key;
        setFocus(f);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chapters, nodeRadius]);

  /* --------------------------------- reveal --------------------------------- */

  // A one-time nudge as the stage first fills the viewport, so the story does not
  // begin mid-transition if the visitor lands on it already scrolled.
  useEffect(() => {
    if (inView) setReady(true);
  }, [inView]);

  if (!product || !chapters.length) return null;

  const partChapters = chapters.filter((c) => c.kind === "part");

  return (
    <div
      ref={spacerRef}
      id={id}
      // One viewport of travel per chapter, plus a little settling time at each end.
      style={{ height: `${(chapters.length + 0.6) * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          {/* ------------------------------ copy ------------------------------ */}
          <div className="order-2 lg:order-1">
            {/*
              Keyed remount rather than AnimatePresence. A narrative driven by
              scroll can cross several chapter boundaries faster than an exit
              animation completes, and `mode="wait"` queues those crossings — which
              left the panel showing the previous beat indefinitely. Remounting on
              the key gives a clean entrance every time and cannot fall behind.
            */}
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="eyebrow">{chapter.eyebrow}</p>
              <h2 className="display mt-3 text-3xl sm:text-4xl lg:text-5xl">
                {chapter.label}
              </h2>
              {chapter.caption && (
                <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-500 sm:text-base">
                  {chapter.caption}
                </p>
              )}

              {chapter.specs && Object.keys(chapter.specs).length > 0 && (
                <dl className="mt-7 max-w-sm divide-y divide-shell-300 border-y border-shell-300">
                  {Object.entries(chapter.specs).map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-400">
                        {k}
                      </dt>
                      <dd className="text-right text-sm font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {chapter.kind === "part" && (
                <p className="mt-6 text-xs text-ink-400">
                  <span className="font-semibold text-ink-900">
                    {String(chapter.hotspot).padStart(2, "0")}
                  </span>{" "}
                  of {String(partChapters.length).padStart(2, "0")} — keep scrolling
                </p>
              )}
            </motion.div>

            {showCta && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button to={`/products/${product.slug}`} variant="solid" size="md" withArrow>
                  Shop Now
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  className="border border-shell-300"
                  onClick={() => goToChapter(chapters.length - 1)}
                >
                  Skip to the end
                </Button>
              </div>
            )}
          </div>

          {/* ------------------------------ stage ------------------------------ */}
          <div className="order-1 lg:order-2" ref={stageRef}>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-shell-300 bg-[radial-gradient(120%_90%_at_50%_10%,#fbfbfa_0%,#eceae6_55%,#dedbd6_100%)]">
              {ready && (
                <SceneCanvas
                  modelUrl={product.modelUrl}
                  hotspots={hotspots}
                  viewRef={viewRef}
                  markerRefs={markerRefs}
                  tipRefs={tipRefs}
                  hoveredNode={
                    hoveredHotspot != null
                      ? hotspots.find((h) => h.index === hoveredHotspot)?.node
                      : null
                  }
                  focusedNode={focus?.node ?? null}
                  focusedNodes={focus?.nodes ?? null}
                  autoRotate={false}
                  active={inView}
                  onReady={() => setReady(true)}
                  dpr={[1, 1.75]}
                />
              )}

              {/* The part being introduced gets its spec card, opened for you. */}
              <div className="pointer-events-none absolute inset-0">
                {hotspots.map((h, i) => (
                  <HotspotCard
                    key={h.index}
                    hotspot={h}
                    registerRef={(el) => {
                      tipRefs.current[i] = el;
                    }}
                    open={chapter.hotspot === h.index}
                    onClose={() => {}}
                  />
                ))}
              </div>

              <div className="pointer-events-none absolute inset-0">
                {hotspots.map((h, i) => (
                  <HotspotMarker
                    key={h.index}
                    hotspot={h}
                    registerRef={(el) => {
                      markerRefs.current[i] = el;
                    }}
                    open={chapter.hotspot === h.index}
                    onToggle={() => goToChapter(i + 1)}
                    onHover={(on) => setHoveredHotspot(on ? h.index : null)}
                  />
                ))}
              </div>

              {/* Scroll cue, only on the opening beat. */}
              {chapterIndex === 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                  <span className="flex flex-col items-center gap-2 text-ink-400">
                    <span className="text-[0.5625rem] uppercase tracking-[0.2em]">Scroll</span>
                    <span className="relative block h-8 w-px overflow-hidden bg-shell-300">
                      <span className="absolute inset-x-0 top-0 h-3 animate-[storycue_2s_ease-in-out_infinite] bg-ink-900" />
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChapterRail
        chapters={chapters}
        active={chapterIndex}
        onProgress={setOnProgress}
        onSelect={goToChapter}
      />

      <style>{`@keyframes storycue{0%{transform:translateY(-100%)}100%{transform:translateY(300%)}}`}</style>
    </div>
  );
}

/** Vertical progress rail on desktop, dot strip with a progress hairline on mobile. */
function ChapterRail({ chapters, active, onProgress, onSelect }) {
  // The hairline is written straight to the DOM from the rAF loop, so the rail can
  // show continuous progress without the section re-rendering every frame.
  const fillRef = useRef(null);

  useEffect(() => {
    onProgress?.((p) => {
      if (fillRef.current) fillRef.current.style.width = `${p * 100}%`;
    });
  }, [onProgress]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center lg:inset-y-0 lg:right-6 lg:bottom-auto lg:justify-end">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-shell-300 bg-shell-50/80 px-3 py-2 backdrop-blur-md lg:flex-col lg:gap-1.5 lg:px-2 lg:py-3">
        {chapters.map((c, i) => {
          const isActive = i === active;
          const isPart = c.kind === "part";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={c.label}
              aria-current={isActive ? "step" : undefined}
              className="group relative grid h-6 w-6 place-items-center"
              title={c.label}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? isPart
                      ? "h-2.5 w-2.5 bg-ink-900"
                      : "h-2 w-2 bg-brass-500"
                    : "h-1.5 w-1.5 bg-ink-400/50 group-hover:bg-ink-500"
                }`}
              />
              {/*
                On mobile the rail is a centred strip along the bottom, so the label
                sits centred above its dot. On desktop the rail becomes a column hard
                against the right edge, where a centred label hangs past the viewport
                and gives the whole page a horizontal scrollbar — so anchor the label
                to the left of the dot (right edge flush with the dot) instead.
              */}
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-800 px-2 py-1 text-[0.625rem] text-shell-100 opacity-0 transition-opacity group-hover:opacity-100 lg:bottom-auto lg:left-auto lg:right-full lg:top-1/2 lg:mb-0 lg:mr-2 lg:block lg:translate-x-0 lg:-translate-y-1/2">
                {c.label}
              </span>
            </button>
          );
        })}

        {/* Continuous progress hairline under the dots on mobile. */}
        <span className="absolute inset-x-3 -bottom-0.5 h-px bg-shell-300 lg:hidden">
          <span ref={fillRef} className="block h-px bg-ink-900" style={{ width: "0%" }} />
        </span>
      </div>
    </div>
  );
}
