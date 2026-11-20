/**
 * Trusted-Device token for the admin five-tap shortcut — with DB-backed
 * revocation.
 *
 * Design:
 *   1. On enrollment (POST /api/admin/trust), after verifying credentials +
 *      PIN, we create a token: <deviceId>.<userId>.<role>.<expiresAt>.<hmac>
 *   2. We store a SHA-256 HASH of the token in the TrustedDevice table (never
 *      the plaintext token).
 *   3. On every protected request (middleware + getSession), we:
 *      a. Verify the HMAC (tamper check).
 *      b. Check expiry.
 *      c. Look up the token hash in the DB. If the record doesn't exist, or
 *         revokedAt is set, or the user has been deleted/demoted, access is
 *         DENIED — even if the cookie hasn't expired.
 *   4. Revocation = set revokedAt = now() on the TrustedDevice row. Immediate.
 *
 * Token format: <deviceId>.<userId>.<role>.<expiresAt>.<hmac>
 *
 * NOTE: The HMAC signing uses the Web Crypto API (crypto.subtle) so this module
 * works in the Edge Runtime (middleware). The DB lookup happens in the
 * Node.js runtime (getSession / route handlers / requireRole). The middleware
 * only does the HMAC + expiry check (no DB); the server-side getSession does
 * the full DB-backed revocation check. This is defense-in-depth: even if a
 * revoked cookie passes the middleware, getSession() will reject it.
 */

const SECRET =
  process.env.ADMIN_TRUST_SECRET || process.env.NEXTAUTH_SECRET || "dev-trust-fallback";
const TRUSTED_COOKIE = "ab_trusted_admin";
// 90 days — long-lived convenience on a trusted device, but expires eventually
// per requirement #6 ("If the session expires… require secure reauthentication").
export const TRUSTED_DEVICE_MAX_AGE = 90 * 24 * 60 * 60;

const encoder = new TextEncoder();

function bufToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/** Compute HMAC-SHA256 of `payload` using the secret, returned as hex. */
async function hmacSign(payload: string): Promise<string> {
  const keyData = encoder.encode(SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
  return bufToHex(sig);
}

/**
 * SHA-256 hash of the full token string, for DB storage/lookup.
 * Uses Web Crypto (async) so it works in both Edge and Node.js runtimes.
 */
export async function hashToken(token: string): Promise<string> {
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(hash);
}

/** Constant-time string comparison to prevent timing attacks. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export interface TrustedTokenPayload {
  deviceId: string;
  userId: string;
  role: string;
  expiresAt: number; // unix seconds
}

/**
 * Create a trusted-device token. Returns the token string AND the hash for DB
 * storage. The caller MUST store the hash in the TrustedDevice table.
 */
export async function createTrustedToken(
  userId: string,
  role: string,
): Promise<{ token: string; tokenHash: string; expiresAt: Date; deviceId: string }> {
  const deviceId = crypto.randomUUID();
  const expiresAtSec = Math.floor(Date.now() / 1000) + TRUSTED_DEVICE_MAX_AGE;
  const payload = `${deviceId}.${userId}.${role}.${expiresAtSec}`;
  const hmac = await hmacSign(payload);
  const token = `${payload}.${hmac}`;
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(expiresAtSec * 1000),
    deviceId,
  };
}

/**
 * Verify a trusted-device token's HMAC + expiry (Edge-safe, no DB).
 * Returns the parsed payload if valid, or null.
 *
 * This is used by the middleware (Edge Runtime) for the fast edge check.
 * The full DB-backed revocation check happens in verifyTrustedTokenFull()
 * (Node.js runtime) via getSession().
 */
export async function verifyTrustedToken(
  token: string | undefined | null,
): Promise<TrustedTokenPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const [deviceId, userId, role, expiresAtStr, hmac] = parts;
  const payload = `${deviceId}.${userId}.${role}.${expiresAtStr}`;

  // Recompute the HMAC and compare in constant time.
  const expected = await hmacSign(payload);
  if (!constantTimeEqual(hmac, expected)) return null;

  // Check expiry.
  const expiresAt = parseInt(expiresAtStr, 10);
  if (Number.isNaN(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;

  return { deviceId, userId, role, expiresAt };
}

/** Cookie name used for the trusted-device token. */
export const TRUSTED_COOKIE_NAME = TRUSTED_COOKIE;

/** Cookie options for Set-Cookie when issuing the trusted device. */
export const TRUSTED_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: TRUSTED_DEVICE_MAX_AGE,
};

/**
 * Validate that required admin secrets are set at startup.
 * Call this from the server entry to fail fast if secrets are missing.
 */
export function validateAdminSecrets(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.ADMIN_PIN || process.env.ADMIN_PIN.length < 4) {
    missing.push("ADMIN_PIN (must be ≥ 4 characters)");
  }
  if (!process.env.ADMIN_TRUST_SECRET || process.env.ADMIN_TRUST_SECRET.length < 32) {
    missing.push("ADMIN_TRUST_SECRET (must be ≥ 32 characters)");
  }
  return { ok: missing.length === 0, missing };
}
