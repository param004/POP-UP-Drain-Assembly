/**
 * Explode configuration for `pop_up_drain_final_animation.glb`.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 * The supplied GLB has no shape keys, and its 22 baked clips are NOT a usable
 * exploded view. Measured from the file, each clip is a single translation
 * channel that runs 0 → 15 s in four stages and then reverses:
 *
 *   t≈2.6–4.6 s   stopper cap assembly   +28.0
 *   t≈4.6–6.7 s   pivot collar group     +18.0
 *   t≈4.6–6.7 s   actuator shaft         +10.0
 *   t≈6.7–8   s   flange group            −8.0
 *   t≈7   –11 s   gasket                 −15.0
 *   t≈8   –11 s   body group             −25.0
 *   t≈8   –11 s   stopper tip            −38.0
 *   t≈12  –15 s   everything returns to rest
 *
 * Two problems make a literal `action.time = (pct/100) * duration` scrub wrong:
 *
 *   1. SCALE. The drain stands 4.46 units tall. A 28-unit throw puts the stopper
 *      cap six model-heights off screen, so the camera would have to pull back
 *      until the product was a speck.
 *   2. MONOTONICITY. The clip explodes, holds, then reassembles. A 0–100 %
 *      slider mapped straight onto clip time would run the teardown forwards for
 *      the first half and backwards for the second half.
 *
 * So the authored motion is used for what it is good for — the part grouping, the
 * vertical ordering, and the order in which tiers peel away — and the distances
 * are retargeted here to a scale that actually frames well. The model geometry,
 * materials and part names are never modified.
 */

export const MODEL_URL = "/models/pop_up_drain_final_animation.glb";

/**
 * Rest-pose measurements read straight out of the GLB (world units, metres-ish).
 * Used for camera framing and for validating the explode distances below.
 */
export const MODEL_BOUNDS = {
  minY: -1.63, // bottom of the threaded shank
  maxY: 2.83, // top of the stopper cap
  height: 4.46,
  radius: 1.12, // widest part (the stopper cap rim)
};

/**
 * The GLB ships a 30×30 "Studio_Floor" disc purely as a Blender-side backdrop.
 * We hide it and light the product with an HDRI + ContactShadows instead, so
 * parts that travel below the original floor plane stay visible.
 */
export const HIDDEN_NODES = new Set(["Studio_Floor"]);

/**
 * Which meshes form the outer shell. In cross-section mode the clip plane cuts
 * through these and we render double-sided so the section reads as a cutaway.
 */
export const OUTER_SHELL_NODES = new Set([
  "Drain_Body",
  "Drain_External_Threads",
  "Drain_Flange",
  "Stopper_Cap",
  "Stopper_Lower_Rim",
  "Pivot_Collar",
]);

/**
 * Explode tiers.
 *
 * `dy` is the Y offset in model units applied at 100 % explode. Values are chosen
 * so that (a) the parts that matter stay in a tight, readable vertical stack and
 * (b) nothing interpenetrates at full explode. At 100 % the assembly spans ~11
 * units against an assembled height of 4.46, so the parts are clearly separated
 * rather than merely nudged apart.
 *
 * `rank` is the tier's position in the authored peel order (0 = moves first).
 * It drives the stagger, so the cap lifts before the collar, which lifts before
 * the body drops away — the same sequence the artist keyed in Blender.
 */
export const EXPLODE_TIERS = [
  {
    id: "stopper",
    label: "Stopper Cap",
    rank: 0,
    dy: 3.6,
    nodes: [
      "Stopper_Cap",
      "Stopper_Lower_Rim",
      "Stopper_Underside_Brass",
      "Stopper_Connection",
    ],
  },
  {
    id: "shaft",
    label: "Actuator Shaft",
    rank: 1,
    dy: 2.55,
    nodes: ["Actuator_Shaft", "Shaft_Ring_Lower", "Shaft_Ring_Upper"],
  },
  {
    id: "collar",
    label: "Pivot Collar",
    rank: 1,
    dy: 1.55,
    nodes: [
      "Pivot_Collar",
      "Pivot_Collar_Inner_Ring",
      "Pivot_Mechanism",
      "Pivot_Pin",
      "Pivot_Rod",
    ],
  },
  {
    id: "tip",
    label: "Stopper Tip",
    rank: 2,
    dy: -0.3,
    nodes: ["Stopper_Tip", "Stopper_Tip_Neck"],
  },
  {
    id: "flange",
    label: "Drain Flange",
    rank: 3,
    dy: -1.5,
    nodes: ["Drain_Flange", "Flange_Inner_Rim", "Brass_Neck"],
  },
  {
    id: "gasket",
    label: "Sealing Gasket",
    rank: 4,
    dy: -2.15,
    nodes: ["Rubber_Gasket"],
  },
  {
    id: "body",
    label: "Threaded Body",
    rank: 4,
    dy: -3.0,
    nodes: [
      "Drain_Body",
      "Drain_External_Threads",
      "Brass_Inner_Body",
      "Internal_Brass_Core",
      "Brass_Bottom",
    ],
  },
];

/** How far each tier lags behind the one before it, as a fraction of the slider. */
export const TIER_STAGGER = 0.06;

const MAX_RANK = EXPLODE_TIERS.reduce((m, t) => Math.max(m, t.rank), 0);

/**
 * nodeName -> { dy, rank } lookup, built once.
 * The GLB also contains two non-product empties ("EXPLODED_VIEW", "PRODUCT_ROOT")
 * and a handful of internal parts; anything not listed here simply never moves,
 * which is the correct default for a part that belongs to a body we do move.
 */
export const NODE_EXPLODE = (() => {
  const map = new Map();
  for (const tier of EXPLODE_TIERS) {
    for (const node of tier.nodes) {
      map.set(node, { dy: tier.dy, rank: tier.rank, tier: tier.id, label: tier.label });
    }
  }
  return map;
})();

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

/**
 * Per-tier progress for a given global explode amount (0–1).
 *
 * Tier `rank` starts moving at `rank * TIER_STAGGER` and every tier is fully
 * settled by 1.0, so the slider always resolves to a complete exploded state
 * while still showing the staged peel on the way.
 */
export function tierProgress(explode, rank) {
  const start = rank * TIER_STAGGER;
  const span = 1 - MAX_RANK * TIER_STAGGER;
  return easeOutQuint(clamp01((explode - start) / span));
}

/**
 * Full explode transform for one node at a given slider value.
 * Returns { dy, rz } — rz is a slight collar tilt used only by the press demo.
 */
export function explodeOffsetFor(nodeName, explode) {
  const entry = NODE_EXPLODE.get(nodeName);
  if (!entry) return { dy: 0, rz: 0 };
  return { dy: entry.dy * tierProgress(explode, entry.rank), rz: 0 };
}

/**
 * World Y of a part at a given explode value.
 *
 * The scroll story uses this to point the camera at whichever part it is
 * introducing: the part is still moving while the explode runs, so its focus height
 * has to be recomputed per frame rather than baked from the rest pose.
 */
export function partYAt(nodeName, explode) {
  const entry = NODE_EXPLODE.get(nodeName);
  const rest = REST_Y[nodeName] ?? 0;
  if (!entry) return rest;
  return rest + entry.dy * tierProgress(explode, entry.rank);
}

/**
 * The "Press to Pop" mechanism demo, independent of the explode slider.
 *
 * The baked clip does not contain the real press cycle (it only contains the big
 * teardown), so the four-part motion below is authored here to match the physical
 * mechanism: the cap is pushed down, the collar rocks on its pin, and the tip is
 * levered up out of its seat.
 *
 * `press` runs 0 → 1 → 0 over the demo so it eases in and back out.
 */
export function pressOffsetFor(nodeName, press) {
  const p = clamp01(press);
  switch (nodeName) {
    case "Stopper_Cap":
    case "Stopper_Lower_Rim":
    case "Stopper_Underside_Brass":
    case "Stopper_Connection":
      return { dy: -0.17 * p, rz: 0 };
    case "Pivot_Collar":
      return { dy: 0.06 * p, rz: -0.09 * p };
    case "Pivot_Collar_Inner_Ring":
    case "Pivot_Mechanism":
      return { dy: 0.09 * p, rz: -0.11 * p };
    case "Pivot_Pin":
    case "Pivot_Rod":
      return { dy: 0.04 * p, rz: 0 };
    case "Stopper_Tip":
    case "Stopper_Tip_Neck":
      return { dy: 0.3 * p, rz: 0 };
    default:
      return { dy: 0, rz: 0 };
  }
}

/**
 * Camera + explode presets behind the carousel dots.
 * `dist` is the orbit distance; `y` is where the controls target sits.
 */
export const EXPLODE_STEPS = [
  {
    id: "assembled",
    label: "Assembled",
    caption: "The unit as it ships",
    explode: 0,
    y: 0.6,
    dist: 7.4,
  },
  {
    id: "cap",
    label: "Stopper Cap",
    caption: "One press, and the drain stays open",
    explode: 0.3,
    y: 4.1,
    dist: 6.4,
  },
  {
    id: "collar",
    label: "Pivot Collar",
    caption: "Where a straight push becomes a hinge",
    explode: 0.54,
    y: 2.7,
    dist: 6.8,
  },
  {
    id: "seal",
    label: "Seal & Flange",
    caption: "The gasket that actually stops the water",
    explode: 0.78,
    y: 0.1,
    dist: 7.2,
  },
  {
    id: "body",
    label: "Threaded Body",
    caption: "Brass, not chrome-over-plastic",
    explode: 1,
    y: -2.0,
    dist: 7.8,
  },
  {
    id: "full",
    label: "Full Explode",
    caption: "Every part, in order",
    explode: 1,
    y: 0.8,
    dist: 11.8,
  },
];

/**
 * Vertical extent of the assembly at a given explode value, used to keep the
 * camera framed. Returned as the world-space Y range the product occupies.
 */
export function explodedBounds(explode) {
  let min = Infinity;
  let max = -Infinity;
  for (const [node, entry] of NODE_EXPLODE) {
    const rest = REST_Y[node] ?? 0;
    const offset = entry.dy * tierProgress(explode, entry.rank);
    // Use the node origin as a proxy for its centre; the camera only needs the
    // rough envelope to pick a distance, not an exact bound.
    const y = rest + offset;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  // Pad by the part half-heights so the caps/flange are never clipped.
  return { min: min - 0.6, max: max + 0.6 };
}

/**
 * Rest-pose Y of each node origin, measured from the GLB node transforms.
 * Kept here (rather than read at runtime) so explodedBounds() can be called
 * outside the render loop, e.g. while computing a camera preset.
 */
export const REST_Y = {
  Actuator_Shaft: 2.05,
  Brass_Bottom: -1.58,
  Brass_Inner_Body: 0.0,
  Brass_Neck: 1.42,
  Drain_Body: 0.0,
  Drain_External_Threads: 0.0,
  Drain_Flange: 0.96,
  Flange_Inner_Rim: 1.0,
  Internal_Brass_Core: -0.25,
  Pivot_Collar: 1.72,
  Pivot_Collar_Inner_Ring: 2.02,
  Pivot_Mechanism: 1.55,
  Pivot_Pin: 1.73,
  Pivot_Rod: 1.56,
  Rubber_Gasket: 0.82,
  Shaft_Ring_Lower: 1.62,
  Shaft_Ring_Upper: 2.42,
  Stopper_Cap: 2.78,
  Stopper_Connection: 2.52,
  Stopper_Lower_Rim: 2.69,
  Stopper_Tip: 1.15,
  Stopper_Tip_Neck: 1.45,
  Stopper_Underside_Brass: 2.62,
};
