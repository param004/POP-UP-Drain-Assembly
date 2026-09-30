import { useCallback, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Projects each hotspot's anchor to screen space every frame and writes the
 * result straight into the DOM.
 *
 * The markers are real DOM elements rather than drei's <Html>, which lets them
 * stay crisp at any DPI, sit above the canvas without fighting its stacking
 * context, and be keyboard-focusable. Writing `transform` imperatively (instead
 * of going through React state) means moving a marker never triggers a render.
 *
 * Each marker is parented to the hotspot's GLB node, so it inherits that node's
 * live transform — which is what keeps a marker glued to its part while the
 * explode slider moves that part.
 *
 * Tooltips are positioned in their own layer and docked to the edge of the canvas
 * nearest the marker. Floating them next to the marker instead would drop a
 * 240px card straight over the middle of the product, hiding the very part being
 * described, and a marker near the canvas edge would push the card out of frame.
 */
export function HotspotProjector({ hotspots, viewRef, markerRefs, tipRefs }) {
  const { camera, size } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const nodes = viewRef?.current?.nodes;
    if (!nodes || !markerRefs?.current) return;

    for (let i = 0; i < hotspots.length; i++) {
      const hotspot = hotspots[i];
      const marker = markerRefs.current[i];
      const tip = tipRefs?.current?.[i];
      const node = nodes[hotspot.node];
      if (!marker) continue;

      const hide = () => {
        marker.style.opacity = "0";
        marker.style.pointerEvents = "none";
        if (tip) {
          tip.style.opacity = "0";
          tip.style.pointerEvents = "none";
        }
      };

      // A hotspot that names a node this model does not contain is hidden rather
      // than parked at an arbitrary place.
      if (!node) {
        hide();
        continue;
      }

      tmp.set(hotspot.position?.x ?? 0, hotspot.position?.y ?? 0, hotspot.position?.z ?? 0);
      node.localToWorld(tmp);
      tmp.project(camera);

      if (tmp.z > 1) {
        hide();
        continue;
      }

      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.y * 0.5 + 0.5) * size.height;

      // When the camera is close in on one part, the rest of the assembly projects
      // to enormous off-canvas coordinates. Hiding those markers matters: a marker
      // left at 14,000px is invisible but still focusable, and its tooltip can be
      // opened by keyboard into a card nowhere near the canvas.
      if (x < -40 || x > size.width + 40 || y < -40 || y > size.height + 40) {
        hide();
        continue;
      }

      // Push the marker clear of the part it labels. The offsets are kept small on
      // purpose: a large vertical stagger would detach a marker from the geometry
      // it points at, and a marker hovering over the wrong part is worse than no
      // stagger at all. The sideways offset is larger so that markers on the same
      // side but at similar heights stay individually clickable.
      const side = hotspot.side === "left" ? -1 : 1;
      const ox = side * (22 + (i % 3) * 30);
      const oy = i % 2 === 0 ? -9 : 9;

      marker.style.opacity = "1";
      marker.style.pointerEvents = "auto";
      marker.style.transform = `translate3d(${x + ox}px, ${y + oy}px, 0) translate(-50%, -50%)`;

      if (tip) {
        // Keep the card inside the canvas: clamp its vertical centre so a part
        // near the top or bottom does not push half the card out of view.
        const cardH = tip.offsetHeight || 190;
        const clampedY = Math.min(
          Math.max(y + oy, cardH / 2 + 8),
          size.height - cardH / 2 - 8
        );
        tip.style.opacity = "1";
        tip.style.pointerEvents = "auto";
        tip.style.transform = `translate3d(0, ${clampedY}px, 0) translateY(-50%)`;
      }
    }
  });

  return null;
}

/** The numbered marker. Positioned by HotspotProjector through `registerRef`. */
export function HotspotMarker({ hotspot, registerRef, open, onToggle, onHover }) {
  const setRef = useCallback(
    (el) => registerRef?.(el),
    [registerRef]
  );

  return (
    <div
      ref={setRef}
      className="absolute left-0 top-0 z-20 opacity-0"
      style={{ willChange: "transform" }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        aria-expanded={open}
        aria-label={`Part ${hotspot.index}: ${hotspot.label}`}
        className="group grid h-8 w-8 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 focus-visible:scale-110"
      >
        <span
          className={`grid h-8 w-8 place-items-center rounded-full text-[0.6875rem] font-semibold tabular-nums transition-all duration-300 ${
            open
              ? "bg-ink-900 text-shell-100"
              : "bg-shell-100/90 text-ink-900 backdrop-blur-sm group-hover:bg-ink-900 group-hover:text-shell-100"
          }`}
        >
          {hotspot.index}
        </span>
      </button>
    </div>
  );
}

/**
 * The spec card, rendered in its own layer and docked to the canvas edge on the
 * marker's side. Vertical position comes from HotspotProjector.
 */
export function HotspotCard({ hotspot, registerRef, open, onClose }) {
  const setRef = useCallback(
    (el) => registerRef?.(el),
    [registerRef]
  );

  if (!open) {
    // Kept mounted (and transparent) so the projector can measure it once and the
    // open/close transition has no layout jump.
    return (
      <div
        ref={setRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 z-30 w-56 opacity-0 sm:w-60"
        style={{ left: 0, transform: "translate3d(0,0,0)" }}
      />
    );
  }

  const entries = Object.entries(hotspot.specs ?? {});

  return (
    <div
      ref={setRef}
      role="tooltip"
      className={`absolute top-0 z-30 w-56 opacity-0 sm:w-60 ${
        hotspot.side === "left" ? "left-3" : "right-3"
      }`}
      style={{ willChange: "transform" }}
    >
      <div className="rounded-lg bg-ink-800 p-4 text-shell-100 shadow-2xl shadow-ink-900/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-shell-300/60">
              Part {String(hotspot.index).padStart(2, "0")}
            </p>
            <p className="mt-1 text-sm font-semibold leading-tight">{hotspot.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close specification"
            className="-mr-1 -mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-shell-300/70 transition-colors hover:bg-shell-100/10 hover:text-shell-100"
          >
            <svg
              viewBox="0 0 16 16"
              width="11"
              height="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        {hotspot.summary && (
          <p className="mt-2 text-xs leading-relaxed text-shell-200/75">{hotspot.summary}</p>
        )}

        {entries.length > 0 && (
          <dl className="mt-3 space-y-1.5 border-t border-shell-100/15 pt-3">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-[0.6875rem] uppercase tracking-wider text-shell-300/55">
                  {key}
                </dt>
                <dd className="text-right text-xs font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
