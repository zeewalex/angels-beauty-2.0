import { validateAdminSecrets } from "@/lib/trusted-device";

/**
 * Server startup validation — ensures required secrets are present before
 * the app accepts requests. Called from the instrumentation hook.
 *
 * If secrets are missing, logs an error. In production, this would block
 * admin trust enrollment (the /api/admin/trust endpoint checks again at
 * request time). This is a fail-fast early warning.
 */
export function validateStartupSecrets() {
  const secrets = validateAdminSecrets();
  if (!secrets.ok) {
    console.error(
      "[SECURITY] Missing or weak admin secrets:",
      secrets.missing.join(", "),
    );
    console.error(
      "[SECURITY] Trusted-device enrollment will be disabled until these are set.",
    );
  }

  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 16) {
    console.error(
      "[SECURITY] NEXTAUTH_SECRET is missing or too short (< 16 chars).",
    );
  }

  if (!process.env.DATABASE_URL) {
    console.error("[SECURITY] DATABASE_URL is not set.");
  }
}
