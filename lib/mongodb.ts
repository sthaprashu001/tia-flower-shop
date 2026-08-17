import mongoose from "mongoose";

/**
 * PHASE 2: Database connection.
 *
 * The site works fine without this (see lib/data.ts + the in-memory
 * fallback in app/api/orders/route.ts). Once you're ready to persist
 * real orders:
 *
 * 1. Create a free MongoDB Atlas cluster.
 * 2. Copy the connection string into .env.local as MONGODB_URI.
 * 3. Restart `npm run dev` — API routes will start using this file.
 */

const MONGODB_URI = process.env.MONGODB_URI;

// Reuse the connection across hot-reloads in dev, and across
// serverless invocations in production, instead of opening a new
// one on every request.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache || { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local, or keep using the mock data in lib/data.ts for now."
    );
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(MONGODB_URI);
}
