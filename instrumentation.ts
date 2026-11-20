/**
 * Next.js instrumentation hook — runs once on server startup.
 *
 * Validates that required security secrets are present. If any are missing,
 * logs an error to the server console (never to the browser). This does NOT
 * expose secret values — only confirms their presence and minimum length.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  // Only run on the server (not in the Edge Runtime).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateStartupSecrets } = await import("./src/lib/startup-validation");
    validateStartupSecrets();
  }
}
