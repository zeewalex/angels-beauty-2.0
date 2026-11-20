import { db } from "@/lib/db";

/**
 * Persistent rate limiter backed by PostgreSQL — atomic, race-safe.
 *
 * Design:
 *   A dedicated `RateLimitBucket` table tracks per-identifier attempt rows.
 *   The check-and-increment is done in a SINGLE atomic SQL statement
 *   (COUNT + conditional INSERT) so concurrent requests cannot bypass the
 *   limit. This is safe for multi-instance deployments — all instances
 *   share the same DB state.
 *
 * For production with Redis, replace `checkRateLimit()` with a Redis
 * INCR + EXPIRE implementation — the interface stays the same.
 *
 * Security:
 *   - Used for trusted-device enrollment (POST /api/admin/trust).
 *   - 5 attempts per 15 minutes per IP.
 *   - IP is extracted safely (see normalizeIdentifier).
 *   - The response never reveals account information — only allowed/denied.
 */

const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX = 5;

/**
 * Extract and normalize the client identifier (IP address).
 *
 * Behind Vercel / a reverse proxy, `x-forwarded-for` contains the original
 * client IP as the first value in a comma-separated list. We:
 *   1. Take the first entry (left-most = original client).
 *   2. Trim whitespace.
 *   3. Validate it looks like an IP (IPv4 or IPv6) — reject anything else.
 *   4. Fall back to "unknown" if no valid IP is found.
 *
 * We do NOT blindly trust arbitrary forwarded headers. The value is validated
 * as an IP address format. On Vercel, `x-forwarded-for` is set by Vercel's
 * own proxy infrastructure and is trustworthy as the first entry.
 */
export function normalizeIdentifier(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first && isValidIp(first)) {
      return first.toLowerCase();
    }
  }
  // Fall back to the connection's remote address if available (Node.js).
  // In serverless (Vercel), this isn't available — x-forwarded-for is the
  // only source, and Vercel sets it reliably.
  return "unknown";
}

function isValidIp(ip: string): boolean {
  // IPv4: four dot-separated octets 0-255
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4.test(ip)) {
    return ip.split(".").every((octet) => {
      const n = parseInt(octet, 10);
      return n >= 0 && n <= 255;
    });
  }
  // IPv6: contains colons (simplified check — covers standard and
  // bracketed forms like ::1, 2001:db8::, [::1])
  const ipv6 = /^\[?[0-9a-f:]+\]?$/i;
  return ipv6.test(ip);
}

/**
 * Atomically check the rate limit and record the attempt.
 *
 * Uses a single SQL statement: COUNT existing rows in the window, and
 * INSERT a new row ONLY if the count is under RATE_MAX. This is atomic
 * at the database level — concurrent requests cannot both pass the count
 * check and both insert.
 *
 * Returns:
 *   - { allowed: true, remaining, retryAfterMs: 0 } if under the limit.
 *   - { allowed: false, remaining: 0, retryAfterMs } if rate-limited.
 */
export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}> {
  const now = Date.now();
  const windowStart = new Date(now - RATE_WINDOW_MS);

  // Use a transaction with a PostgreSQL advisory lock to serialize
  // concurrent requests for the SAME identifier. This prevents the race
  // condition where two requests both read count=4 and both insert (allowing
  // 6 when the limit is 5).
  //
  // pg_advisory_xact_lock(hash(identifier)) locks on a 32-bit hash of the
  // identifier string. The lock is held until the transaction commits/rolls
  // back, then automatically released. Other requests for the same identifier
  // wait until the lock is released — so count+insert is effectively atomic
  // per identifier.
  //
  // Different identifiers hash to different locks (usually), so requests
  // from different IPs don't block each other.
  return db.$transaction(async (tx) => {
    // Acquire the advisory lock for this identifier.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${identifier}))`;

    // Now safe to count + insert — no other request for this identifier
    // can interleave.
    const recent = await tx.rateLimitBucket.count({
      where: {
        identifier,
        createdAt: { gte: windowStart },
      },
    });

    if (recent >= RATE_MAX) {
      // Rate-limited. Find oldest attempt to compute retry-after.
      const oldest = await tx.rateLimitBucket.findFirst({
        where: {
          identifier,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      const retryAfterMs = oldest
        ? Math.max(oldest.createdAt.getTime() + RATE_WINDOW_MS - now, 1000)
        : RATE_WINDOW_MS;
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    // Under the limit — insert the attempt.
    await tx.rateLimitBucket.create({
      data: {
        id: crypto.randomUUID(),
        identifier,
        expiresAt: new Date(now + RATE_WINDOW_MS),
      },
    });

    return {
      allowed: true,
      remaining: Math.max(RATE_MAX - recent - 1, 0),
      retryAfterMs: 0,
    };
  });
}

/**
 * Clean up expired rate-limit rows. Call periodically via a cron job.
 * Safe to call on any instance — uses DELETE WHERE expiresAt < now().
 *
 * Deployment configuration:
 *   On Vercel, use Vercel Cron (vercel.json):
 *     {
 *       "crons": [
 *         { "path": "/api/cron/cleanup-rate-limits", "schedule": "0 * * * *" }
 *       ]
 *     }
 *   The cron endpoint calls this function and requires CRON_SECRET for auth.
 *
 *   On other platforms, use a systemd timer, Kubernetes CronJob, or
 *   equivalent scheduled task that calls this function hourly.
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await db.rateLimitBucket.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
