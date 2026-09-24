import { NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter (fixed window).
 *
 * IMPORTANT: on Vercel each serverless instance has its own memory, so this
 * slows down casual abuse and brute-forcing but is not a hard guarantee.
 * For a strict limit across all instances, swap the Map for Upstash Redis
 * (@upstash/ratelimit) — the function signature can stay the same.
 */
type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as { _rateBuckets?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = globalStore._rateBuckets || new Map();
globalStore._rateBuckets = buckets;

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow without bound.
  if (buckets.size > 5000) {
    buckets.forEach((b, k) => {
      if (b.resetAt < now) buckets.delete(k);
    });
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Please wait a bit and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
