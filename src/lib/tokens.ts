import { createHash } from "node:crypto";

/**
 * Hash a verification token (SHA-256) for storage.
 * The DB stores only the hash — a DB leak does not expose usable tokens.
 * The plaintext token is delivered to the user out-of-band (email in Phase 3;
 * dev console only in development) and is never persisted or returned by APIs.
 */
export function hashToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}
