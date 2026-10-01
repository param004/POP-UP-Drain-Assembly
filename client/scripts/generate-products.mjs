/*
 * Bakes the product catalogue into the client bundle.
 *
 * The site is deployed as static files, so there is no API to read products from at
 * runtime. This script runs before `vite build`, reads the active products out of
 * MongoDB, and writes them to `src/data/products.json`, which the client imports.
 *
 * Consequences of doing it this way, both deliberate:
 *   - Editing a product in the database does NOT change the live site. Re-run the
 *     build to publish a change.
 *   - Nothing secret is written: only the fields the pages actually render are kept,
 *     and `_id` is replaced with a slug lookup since nothing addresses a product by id.
 *
 * Secrets come from the environment (`MONGODB_URI`), never from a hardcoded URI, so
 * this script is safe to commit. On a deploy host without database access, run the
 * build with `--offline` to reuse the committed JSON instead of connecting.
 *
 *   node scripts/generate-products.mjs            # read from MONGODB_URI
 *   node scripts/generate-products.mjs --offline  # keep the existing JSON
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(HERE, "..", "src", "data", "products.json");

const offline = process.argv.includes("--offline");

/*
 * Fields kept in the generated file. Everything else is either internal bookkeeping
 * (`__v`, timestamps) or meaningless without a database (`stock`, since nothing can
 * decrement it). `hotspots` and `specs` come from the product itself rather than
 * being hardcoded, so the 3D callouts stay in step with whatever the DB holds.
 */
const KEEP = [
  "name",
  "slug",
  "tagline",
  "description",
  "price",
  "compareAtPrice",
  "category",
  "material",
  "images",
  "modelUrl",
  "variants",
  "hotspots",
  "specs",
  "features",
  "rating",
  "numReviews",
  "badge",
];

function pick(doc) {
  const out = {};
  for (const key of KEEP) {
    if (doc[key] !== undefined) out[key] = doc[key];
  }
  return out;
}

async function readFromDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Export it, or run with --offline to reuse the committed products.json."
    );
  }

  const { default: mongoose } = await import("mongoose");

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });

    // A plain collection read rather than importing the server's model: the model
    // lives outside this package and drags in its own dependency tree, and the only
    // thing needed here is the same `isActive` filter the API applies.
    const docs = await mongoose.connection
      .collection("products")
      .find({ isActive: { $ne: false } })
      .toArray();

    return docs.map(pick).sort((a, b) => (a.name > b.name ? 1 : -1));
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
}

async function main() {
  if (offline) {
    /*
     * Fail loudly rather than writing an empty catalogue. An empty file is not a
     * build error — vite would happily bundle it and publish a site whose product
     * pages are all 404s, which is exactly the failure that is hardest to notice.
     * A missing JSON almost always means a fresh clone, where the fix is to run the
     * generator against the database once and commit the result.
     */
    let count;
    try {
      count = JSON.parse(await fs.readFile(OUT_FILE, "utf8")).length;
    } catch {
      throw new Error(
        "src/data/products.json is missing. It is committed to the repo; restore it, " +
          "or run `npm run gen:data` with MONGODB_URI set to regenerate it from the database."
      );
    }

    if (count === 0) {
      throw new Error(
        "src/data/products.json is empty. Regenerate it with `npm run gen:data` — " +
          "an empty catalogue builds successfully but publishes a site with no products."
      );
    }

    console.log(`[gen] --offline: keeping products.json (${count} products)`);
    return;
  }

  const products = await readFromDatabase();

  if (products.length === 0) {
    throw new Error(
      "No active products found in the database. Nothing was written. Check the database, or seed it with `npm run seed` in server/."
    );
  }

  const body = `${JSON.stringify(products, null, 2)}\n`;
  await fs.writeFile(OUT_FILE, body);

  const slugs = products.map((p) => p.slug).filter(Boolean);
  const missing = products.filter((p) => !p.slug).length;
  const hotspots = products.reduce((n, p) => n + (p.hotspots?.length || 0), 0);

  console.log(
    `[gen] wrote ${products.length} products (${hotspots} hotspots, ${(body.length / 1024).toFixed(1)} KB) to src/data/products.json`
  );
  if (missing) console.warn(`[gen] warning: ${missing} product(s) have no slug and cannot be linked`);
  console.log(`[gen] slugs: ${slugs.join(", ")}`);
}

main().catch((err) => {
  console.error("[gen] failed:", err.message);
  process.exit(1);
});
