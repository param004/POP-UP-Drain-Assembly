import mongoose from "mongoose";

/**
 * Server-selection timeout for a single connection attempt.
 *
 * Defaults to 20s rather than something tight: a cold start against a remote
 * Atlas cluster has to resolve the SRV record, open a TLS socket and complete
 * the handshake before any document is exchanged, which comfortably exceeds a
 * few seconds. Override with DB_CONNECT_TIMEOUT_MS if needed.
 */
const CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS) || 20000;

/** How many times to try before giving up. See connectDB. */
const CONNECT_ATTEMPTS = Number(process.env.DB_CONNECT_ATTEMPTS) || 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connects to MongoDB using MONGODB_URI.
 *
 * Retries with backoff before failing: a managed database can briefly refuse
 * connections while it fails over, on a cold start, or when it is scaled, and
 * that is a transient condition rather than a misconfiguration. Only a missing
 * MONGODB_URI is treated as fatal straight away.
 *
 * Throws when every attempt is exhausted, so a genuinely bad URI still fails
 * fast with a clear message instead of hanging on boot.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }

  mongoose.set("strictQuery", true);

  let lastErr;
  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
      });
      console.log(`[db] connected -> ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      lastErr = err;
      if (attempt === CONNECT_ATTEMPTS) break;
      const wait = attempt * 2000;
      console.warn(
        `[db] attempt ${attempt}/${CONNECT_ATTEMPTS} failed (${err.message}) — retrying in ${wait}ms`
      );
      await sleep(wait);
    }
  }

  throw new Error(
    `Could not reach MongoDB after ${CONNECT_ATTEMPTS} attempts: ${lastErr.message}`
  );
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
