import "server-only";
import { headers } from "next/headers";

interface RateLimitRecord {
  timestamps: number[];
}

/** In-memory store for rate limiting sliding window. */
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodically clean up stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    // Drop records where the latest timestamp is older than 10 minutes
    const latest = record.timestamps[record.timestamps.length - 1];
    if (!latest || now - latest > 10 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

/**
 * Sliding-window rate limiter.
 *
 * @param key Unique identifier for the client (e.g. IP, userId, or combination)
 * @param limit Maximum allowed requests within the time window
 * @param windowMs Duration of the sliding window in milliseconds (default: 60,000ms = 1m)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  cleanupStaleEntries();

  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter out timestamps outside the active sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  const firstTimestamp = record.timestamps[0] ?? now;
  const resetAt = firstTimestamp + windowMs;
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));

  if (record.timestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt,
      retryAfterSec,
    };
  }

  // Record this hit
  record.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    resetAt,
    retryAfterSec: 0,
  };
}

/** Extracts the best guess for client IP from incoming request headers. */
export function getClientIpFromHeaders(headerList: Headers): string {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = headerList.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = headerList.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/** Helper for Server Actions using next/headers. */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    return getClientIpFromHeaders(headerList);
  } catch {
    return "127.0.0.1";
  }
}
