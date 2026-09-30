import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { connectDB } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

/*
 * Directory of this file, in a form that survives being bundled.
 *
 * The server ships as two builds: the plain ESM source (`npm start`) and a fully
 * bundled CommonJS file (`npm run build` → `dist/server.cjs`). The bundle inlines
 * every dependency so startup is a single file read instead of walking thousands
 * of module files — which matters a great deal on a slow or busy filesystem.
 * `import.meta.url` only exists in the ESM build, hence the check.
 */
const serverDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 4000;

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        // three.js and its loaders instantiate WebAssembly modules. Without
        // 'wasm-unsafe-eval' here, helmet's default policy blocks them and the
        // GLB silently fails to load in production builds.
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        // React and Framer Motion both write inline style attributes.
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
  })
);
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") ?? true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/api", apiRoutes);

// Serves the client build from the same origin in production, so the deployed
// app is a single process. Harmless no-op in development.
/*
 * Locate the built client.
 *
 * The two builds sit at different depths — the ESM source is in `server/`, the
 * bundle is in `server/dist/` — so rather than counting `..` hops, walk upwards
 * until a sibling `client/dist` with an index.html turns up. CLIENT_DIST overrides.
 */
function findClientDist() {
  if (process.env.CLIENT_DIST) return path.resolve(process.env.CLIENT_DIST);

  let dir = serverDir;
  for (let i = 0; i < 6; i++) {
    const candidate = path.resolve(dir, "client", "dist");
    if (fs.existsSync(path.join(candidate, "index.html"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Nothing found: return the conventional path so the error message is sensible.
  return path.resolve(serverDir, "..", "client", "dist");
}

const clientDist = findClientDist();

/*
 * Static assets are read into memory once at boot and served from there.
 *
 * The client build is small — a couple of MB, almost all of it the 1.5 MB GLB —
 * so holding it in RAM costs nothing. It also makes serving independent of
 * filesystem behaviour: streaming these files straight off disk proved liable to
 * ETIMEDOUT mid-read on a busy or degraded volume, which surfaced as a 500 on the
 * 3D model and a blank page. Anything not preloaded still falls through to disk.
 */
const staticCache = new Map();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

/** Reads a file, retrying transient I/O failures (ETIMEDOUT / EAGAIN / EMFILE). */
async function readWithRetry(file, attempts = 6) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fsp.readFile(file);
    } catch (err) {
      lastErr = err;
      if (!["ETIMEDOUT", "EAGAIN", "EBUSY", "EMFILE", "ENFILE"].includes(err.code)) throw err;
      await new Promise((r) => setTimeout(r, 150 * (i + 1)));
    }
  }
  throw lastErr;
}

async function preloadStatic(root) {
  let count = 0;
  let bytes = 0;

  async function walk(dir) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      try {
        const data = await readWithRetry(full);
        const rel = "/" + path.relative(root, full).split(path.sep).join("/");
        staticCache.set(rel, {
          data,
          type: MIME[path.extname(entry.name).toLowerCase()] || "application/octet-stream",
        });
        count++;
        bytes += data.length;
      } catch (err) {
        console.warn(`[static] skipped ${path.relative(root, full)}: ${err.code}`);
      }
    }
  }

  await walk(root);
  console.log(
    `[static] preloaded ${count} files (${(bytes / 1048576).toFixed(1)} MB) from client/dist`
  );
}

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const hit = staticCache.get(req.path);
  if (!hit) return next();
  res.type(hit.type);
  res.setHeader(
    "Cache-Control",
    req.path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache"
  );
  if (req.method === "HEAD") return res.end();
  return res.send(hit.data);
});

// Fallback for anything added to the build after boot.
app.use(express.static(clientDist, { maxAge: "1h" }));

app.get(/^\/(?!api).*/, (req, res, next) => {
  const index = staticCache.get("/index.html");
  if (index) {
    res.type(index.type).setHeader("Cache-Control", "no-cache").send(index.data);
    return;
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use(notFound);
app.use(errorHandler);

let server;

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`[db] connection failed: ${err.message}`);
    process.exit(1);
  }

  // Load the client build into memory before accepting traffic, so the very first
  // page load does not race the filesystem.
  try {
    await preloadStatic(clientDist);
  } catch (err) {
    console.error(`[static] preload failed: ${err.message} — serving from disk instead`);
  }

  server = app.listen(PORT, () => {
    console.log(
      `[api] listening on http://localhost:${PORT} (${process.env.NODE_ENV || "development"})`
    );
  });
}

start();

/** Close the HTTP server before exiting so in-flight requests are not severed. */
async function shutdown(signal) {
  console.log(`\n[api] ${signal} received, shutting down.`);
  server?.close(async () => {
    const { disconnectDB } = await import("./config/db.js");
    await disconnectDB().catch(() => {});
    process.exit(0);
  });
  // Don't hang forever if a connection refuses to close.
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default app;
