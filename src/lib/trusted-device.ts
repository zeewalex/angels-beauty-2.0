/**
 * Trusted-Device token for the admin five-tap shortcut.
 *
 * Purpose:
 *   The client wants the five-tap logo shortcut to be the ONLY visible way to
 *   access the admin dashboard — no routine email/password prompt on each
 *   visit. To achieve this safely (without weakening server-side auth), we
 *   issue a long-lived "trusted device" cookie AFTER the client authenticates
 *   once with credentials + PIN on their private device. On subsequent visits,
 *   the five-tap shortcut reads this cookie (via the server) and grants
 *   immediate admin access. If the cookie is absent/expired, the five-tap
 *   routes to the PIN-gated /admin-login page for secure re-authentication.
 *
 * Security properties:
 *   - Signed with HMAC-SHA256 (ADMIN_TRUST_SECRET) — tamper-proof.
 *   - Bound to a specific admin user id + role — cannot be reused by another
 *     account even if the cookie is copied to a different browser.
 *   - Expires after TRUSTED_DEVICE_MAX_AGE (90 days) — requires periodic
 *     re-authentication per requirement #6.
 *   - httpOnly + sameSite=lax + secure(in prod) — not readable by JS, not
 *     leaked on cross-site requests, only sent over HTTPS in production.
 *   - The trusted cookie ALONE does not grant admin API access — every admin
 *     Route Handler calls requireRole("ADMIN") which reads the real session.
 *     The admin layout (Server Component) also calls requireRole("ADMIN").
 *     The trusted cookie only satisfies the *middleware* + getSession() so the
 *     page can render; the server-side role check is independent and enforced.
 *
 * Token format: <userId>.<role>.<expiresAt>.<hmac>
 *
 * Implementation note: uses the Web Crypto API (crypto.subtle) so it works in
 * the Edge Runtime (middleware) as well as the Node.js runtime (API routes,
 * Server Components). node:crypto is NOT available in the Edge Runtime.
 */

const SECRET = process.env.ADMIN_TRUST_SECRET || process.env.NEXTAUTH_SECRET || "dev-trust-fallback";
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

/** Compute the HMAC-SHA256 of `payload` using the secret, returned as hex. */
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

/** Constant-time string comparison to prevent timing attacks. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Build a trusted-device token for a given admin user. */
export async function createTrustedToken(userId: string, role: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + TRUSTED_DEVICE_MAX_AGE;
  const payload = `${userId}.${role}.${expiresAt}`;
  const hmac = await hmacSign(payload);
  return `${payload}.${hmac}`;
}

/**
 * Verify a trusted-device token. Returns the user id + role if valid and
 * unexpired, or null if the token is missing, tampered, or expired.
 */
export async function verifyTrustedToken(
  token: string | undefined | null,
): Promise<{ userId: string; role: string } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, role, expiresAtStr, hmac] = parts;
  const payload = `${userId}.${role}.${expiresAtStr}`;

  // Recompute the HMAC and compare in constant time.
  const expected = await hmacSign(payload);
  if (!constantTimeEqual(hmac, expected)) return null;

  // Check expiry.
  const expiresAt = parseInt(expiresAtStr, 10);
  if (Number.isNaN(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;

  return { userId, role };
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
