import { db } from "@/lib/db";

/**
 * Persistent rate limiter backed by the database (PostgreSQL).
 *
 * This replaces the in-memory rate limiter to support multi-instance
 * deployments. Every server instance shares the same rate-limit state
 * via the database.
 *
 * Design:
 *   - Uses the AuditLog table (or a dedicated RateLimitAttempt model)
 *   to track attempts. We use a lightweight approach: a dedicated
 *   `RateLimitBucket` table tracks per-identifier counts with a
 *   rolling window.
 *
 * For production with Redis, swap the implementation in
 * `checkRateLimitRedis()` — the interface is the same.
 *
 * Security: this is used for trusted-device enrollment rate limiting
 * (POST /api/admin/trust). 5 attempts per 15 minutes per IP.
 */

const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX = 5;

/**
 * Check and increment the rate limit for a given identifier (e.g. IP).
 * Returns true if the request should be allowed, false if rate-limited.
 *
 * Uses a DB-backed sliding window: counts all attempts in the last
 * RATE_WINDOW_MS, and if under RATE_MAX, inserts a new attempt row.
 */
export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}> {
  const now = Date.now();
  const windowStart = new Date(now - RATE_WINDOW_MS);

  // Count recent attempts in the window.
  const recent = await db.rateLimitBucket.count({
    where: {
      identifier,
      createdAt: { gte: windowStart },
    },
  });

  if (recent >= RATE_MAX) {
    // Find the oldest attempt in the window to compute retry-after.
    const oldest = await db.rateLimitBucket.findFirst({
      where: {
        identifier,
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const retryAfterMs = oldest
      ? oldest.createdAt.getTime() + RATE_WINDOW_MS - now
      : RATE_WINDOW_MS;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  // Insert the attempt. Use a short-expiry row.
  await db.rateLimitBucket.create({
    data: {
      identifier,
      expiresAt: new Date(now + RATE_WINDOW_MS),
    },
  });

  return { allowed: true, remaining: RATE_MAX - recent - 1, retryAfterMs: 0 };
}

/**
 * Clean up expired rate-limit rows. Call periodically (e.g. via cron).
 * Safe to call on any instance — uses DELETE WHERE expiresAt < now.
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await db.rateLimitBucket.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
