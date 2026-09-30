import mongoose from "mongoose";

/**
 * Connects to MongoDB using MONGODB_URI.
 * Exits the process with a clear message when the connection cannot be made,
 * so a misconfigured environment fails fast instead of hanging on boot.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }

  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  console.log(`[db] connected -> ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
