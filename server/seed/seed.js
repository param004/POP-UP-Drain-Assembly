import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

/**
 * Hotspot `node` values are the real glTF node names inside
 * `public/models/pop_up_drain_final_animation.glb`, so each marker is parented to
 * the actual part mesh and travels with it while the explode slider moves.
 *
 * `position` is a LOCAL offset in that node's own space. Remember that several
 * nodes carry a non-uniform scale (e.g. Stopper_Cap is scaled 1, 0.65, 1), so a
 * local Y of 1 there only moves the marker 0.65 in world space.
 *
 * NOTE: the spec strings below are PLACEHOLDERS. Replace them with the real BOM
 * before going live — see README "Content to confirm with the brand".
 */
const hotspots = [
  {
    index: 1,
    label: "Stopper Cap",
    node: "Stopper_Cap",
    position: { x: 1.32, y: 0.08, z: 0 },
    side: "right",
    summary:
      "The chrome dome you press with one finger. Its dished profile is what lets a fingertip slide off and let the drain close on its own.",
    specs: {
      Material: "Chrome-plated brass",
      Finish: "Mirror polish, 0.2 µm",
      Diameter: "54 mm (2-1/8 in)",
      Profile: "Domed, 3 mm dish",
    },
  },
  {
    index: 2,
    label: "Pivot Collar",
    node: "Pivot_Collar",
    position: { x: -1.0, y: 0.02, z: 0 },
    side: "left",
    summary:
      "The slotted cylinder that converts a straight push into a hinge. Press the cap and the collar rocks, tipping the stopper clear of the seat.",
    specs: {
      Material: "Chrome-plated brass",
      Diameter: "34 mm (1-3/8 in)",
      Slots: "6 flow windows",
      Function: "Push-to-hinge actuator",
    },
  },
  {
    index: 3,
    label: "Sealing Gasket",
    node: "Rubber_Gasket",
    position: { x: 1.18, y: 0, z: 0 },
    side: "right",
    summary:
      "A compressible EPDM ring under the flange. It takes the squeeze between flange and basin so neither surface has to seal on metal.",
    specs: {
      Material: "EPDM rubber",
      "Shore hardness": "70A",
      "Compression rating": "Up to 40% static",
      Temperature: "−40 °C to 120 °C",
    },
  },
  {
    index: 4,
    label: "Drain Flange",
    node: "Drain_Flange",
    position: { x: 1.34, y: 0, z: 0 },
    side: "right",
    summary:
      "The wide chrome escutcheon that covers the cut-out. Its lip seats against the basin and hides the gasket entirely.",
    specs: {
      Material: "Chrome-plated brass",
      Diameter: "66 mm (2-5/8 in)",
      Seat: "Flat, 1.2 mm lip",
      Finish: "Mirror polish",
    },
  },
  {
    index: 5,
    label: "Threaded Body",
    node: "Drain_External_Threads",
    position: { x: -1.02, y: -0.55, z: 0 },
    side: "left",
    summary:
      "The long chrome shank that reaches down through the basin and takes the locknut from below. This is what sets the installed depth.",
    specs: {
      Material: "Chrome-plated brass",
      Thread: "M38 × 1.5 (fine pitch)",
      Length: "52 mm below flange",
      Bearing: "18 kg static",
    },
  },
];

const drainProduct = {
  name: "Pop-Up Drain Assembly",
  slug: "pop-up-drain-assembly",
  tagline: "Seamless operation, durable materials.",
  description:
    "A press-to-close sink drain built around a single pivot. The stopper cap, pivot collar and threaded body are machined from brass and plated in chrome, so the mechanism stays quiet for years instead of developing the grind you get from rubber-topped drains.\n\nPress the cap once and the drain stays open. Press it again and it seals. No linkage to seize, no lift rod to adjust.",
  price: 89,
  compareAtPrice: 119,
  category: "Drain Assemblies",
  material: "Chrome-plated Brass",
  images: [],
  modelUrl: "/models/pop_up_drain_final_animation.glb",
  variants: [
    {
      name: "Assembled",
      slug: "assembled",
      modelUrl: "/models/pop_up_drain_final_animation.glb",
      description: "The unit as it ships — the default view.",
    },
    {
      name: "Cross-section",
      slug: "cross-section",
      modelUrl: "/models/pop_up_drain_final_animation.glb",
      description:
        "Outer shell cut away on the client to reveal the brass core, pivot pin and threaded shank.",
    },
  ],
  hotspots,
  specs: {
    "Overall height": "118 mm",
    "Flange diameter": "66 mm",
    "Cap diameter": "54 mm",
    "Thread": "M38 × 1.5",
    "Body material": "CZ121 brass, chrome plated",
    "Gasket material": "EPDM 70A",
    "Flow rate": "42 L/min",
    "Carton weight": "410 g",
    "Certification": "NSF/ANSI 372",
  },
  features: [
    "Single-pivot mechanism with no linkage to adjust",
    "Chrome-over-brass body, not chrome-over-plastic",
    "EPDM gasket rated for hot water up to 120 °C",
    "Fits standard 1-1/2 in (38 mm) basin cut-outs",
    "Tool-free installation from above the basin",
  ],
  stock: 64,
  rating: 4.8,
  numReviews: 214,
  badge: "Signature",
  isActive: true,
};

const otherProducts = [
  {
    name: "Pop-Up Drain Assembly — Matte Black",
    slug: "pop-up-drain-assembly-matte-black",
    tagline: "The same mechanism, in matte black.",
    description:
      "Identical brass mechanism and EPDM seal to the chrome unit, finished in a fingerprint-resistant matte black PVD coating. Made for darker basins where mirror chrome reads as a smudge magnet.",
    price: 104,
    category: "Drain Assemblies",
    material: "Matte Black PVD",
    modelUrl: "/models/pop_up_drain_final_animation.glb",
    variants: [
      { name: "Assembled", slug: "assembled" },
      { name: "Cross-section", slug: "cross-section" },
    ],
    hotspots,
    specs: {
      Finish: "Matte black PVD, 2 µm",
      "Body material": "CZ121 brass",
      "Thread": "M38 × 1.5",
      "Flow rate": "42 L/min",
    },
    features: ["Fingerprint-resistant PVD coating", "Same brass mechanism as the chrome unit"],
    stock: 31,
    rating: 4.7,
    numReviews: 96,
    badge: "New",
  },
  {
    name: "Replacement Gasket Set",
    slug: "replacement-gasket-set",
    tagline: "Two EPDM rings and a grease sachet.",
    description:
      "The two EPDM rings that do the actual sealing, in the right Shore hardness. If your drain seeps around the flange rather than through the centre, this is the fix — no need to replace the whole assembly.",
    price: 14,
    category: "Seals & Gaskets",
    material: "EPDM Rubber",
    specs: {
      "Ring material": "EPDM 70A",
      "Included": "2 rings + PTFE tape",
      "Outer diameter": "69 mm",
      "Fits": "All Premier Products® 66 mm flanges",
    },
    features: ["Tool-free replacement", "Correct 70A Shore hardness, not soft generic rubber"],
    stock: 240,
    rating: 4.9,
    numReviews: 512,
  },
  {
    name: "Universal Basin Strainer",
    slug: "universal-basin-strainer",
    tagline: "For sinks without a drain hole.",
    description:
      "Clamps onto a flat basin surface and turns it into a drain. Solid brass body with a lift-out basket, for retrofits where cutting a hole is not an option.",
    price: 62,
    category: "Strainers",
    material: "Chrome-plated Brass",
    specs: {
      "Clamp range": "6–19 mm surface",
      "Basket": "Lift-out, 1.2 mm mesh",
      "Body material": "CZ121 brass, chrome plated",
      "Flow rate": "38 L/min",
    },
    features: ["No drilling required", "Lift-out basket for easy cleaning"],
    stock: 87,
    rating: 4.5,
    numReviews: 143,
  },
  {
    name: "Corner Drain Adapter",
    slug: "corner-drain-adapter",
    tagline: "For corner-set basin waste.",
    description:
      "A 90° adapter that turns a standard vertical waste run into the corner-set geometry used in compact European basins. Machined brass, chrome plated to match.",
    price: 48,
    category: "Adapters",
    material: "Chrome-plated Brass",
    specs: {
      Angle: "90°",
      "Inlet thread": "M38 × 1.5",
      Outlet: "40 mm waste",
      "Body material": "CZ121 brass, chrome plated",
    },
    features: ["90° corner geometry", "Chrome plated to match the drain assembly"],
    stock: 45,
    rating: 4.4,
    numReviews: 61,
  },
  {
    name: "Overflow Plate Kit",
    slug: "overflow-plate-kit",
    tagline: "For tubs and deep sinks.",
    description:
      "Chrome overflow plate and the matching grub screw, sized to the 1-1/4 in overflow on our deep-basin sinks. Includes the thread sealant.",
    price: 22,
    category: "Trim & Overflow",
    material: "Chrome-plated Brass",
    specs: {
      "Plate diameter": "52 mm",
      "Fastener": "M6 × 12 grub screw",
      "Material": "Chrome-plated brass",
      "Sealant": "PTFE thread tape included",
    },
    features: ["Ships with thread sealant", "Matches the chrome finish on the drain line"],
    stock: 158,
    rating: 4.6,
    numReviews: 78,
  },
];

async function run() {
  await connectDB();

  console.log("[seed] clearing existing products…");
  await Product.deleteMany({});

  const created = await Product.insertMany([drainProduct, ...otherProducts]);
  console.log(`[seed] inserted ${created.length} products`);

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@premierproducts.com").toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log(`[seed] promoted existing user to admin: ${adminEmail}`);
    } else {
      console.log(`[seed] admin already exists: ${adminEmail}`);
    }
  } else {
    await User.create({
      name: "Store Admin",
      email: adminEmail,
      passwordHash: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
      role: "admin",
    });
    console.log(`[seed] created admin: ${adminEmail}`);
  }

  console.log("[seed] done.");
  await disconnectDB();
}

run().catch(async (err) => {
  console.error("[seed] failed:", err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
