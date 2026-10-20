import { NextResponse } from "next/server";

/**
 * Rate limiter.
 *
 * - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, counters live
 *   in Upstash Redis (plain REST calls, no extra npm package), so the limit is
 *   shared by every serverless instance and can't be dodged by hitting a
 *   different one.
 * - Otherwise (local dev, or Upstash not set up yet) it falls back to an
 *   in-memory fixed window. That slows casual abuse but is per-instance only.
 * - If Upstash is configured but unreachable, it also falls back to memory so a
 *   Redis outage never blocks real customers.
 */
type Bucket = { count: number; resetAt: number };
export type RateLimitResult = { ok: boolean; retryAfter: number };

const globalStore = globalThis as unknown as { _rateBuckets?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = globalStore._rateBuckets || new Map();
globalStore._rateBuckets = buckets;

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
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

async function redisLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redisKey = `tia:rl:${key}`;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, String(windowMs), "NX"],
        ["PTTL", redisKey],
      ]),
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const out = (await res.json()) as { result?: unknown }[];
    const count = Number(out?.[0]?.result);
    const ttl = Number(out?.[2]?.result);
    if (!Number.isFinite(count)) return null;
    if (count > limit) {
      return { ok: false, retryAfter: Math.max(1, Math.ceil((Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs) / 1000)) };
    }
    return { ok: true, retryAfter: 0 };
  } catch {
    return null; // Redis unreachable — use the in-memory limiter instead
  }
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  return (await redisLimit(key, limit, windowMs)) ?? memoryLimit(key, limit, windowMs);
}

type HeaderLookup = (name: string) => string | null | undefined;

function pickIp(get: HeaderLookup): string {
  // Platform-set headers first: the client can't forge these on Vercel.
  const platform = get("x-vercel-forwarded-for") || get("x-real-ip");
  if (platform) return platform.split(",")[0].trim();
  // Last resort: the first X-Forwarded-For hop (spoofable if no trusted proxy sits in front).
  const forwarded = get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function clientIp(headers: Headers): string {
  return pickIp((name) => headers.get(name));
}

/** Same as clientIp, for the plain header objects NextAuth hands to `authorize`. */
export function clientIpFromPlain(headers: Record<string, string | string[] | undefined> | undefined): string {
  return pickIp((name) => {
    const v = headers?.[name];
    return Array.isArray(v) ? v[0] : v;
  });
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Please wait a bit and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
