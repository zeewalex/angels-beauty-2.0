/**
 * Create a staging SUPER_ADMIN account.
 *
 * SECURITY:
 *   - The admin email and password are read from environment variables
 *     (STAGING_ADMIN_EMAIL, STAGING_ADMIN_PASSWORD). They are NEVER
 *     hardcoded in this file.
 *   - The password is bcrypt-hashed before storage — the plaintext is
 *     never persisted or logged.
 *   - The password is not echoed to the console. Only the email and
 *     a confirmation message are printed.
 *
 * Usage:
 *   STAGING_ADMIN_EMAIL=... STAGING_ADMIN_PASSWORD=... bun run scripts/create-admin.ts
 *
 * If the environment variables are not set, the script exits with an error.
 */
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const email = process.env.STAGING_ADMIN_EMAIL;
  const password = process.env.STAGING_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "ERROR: STAGING_ADMIN_EMAIL and STAGING_ADMIN_PASSWORD environment variables are required.",
    );
    console.error("Set them before running this script. Do not pass credentials as command-line arguments.");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("ERROR: STAGING_ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" },
    });
    console.log(`✔ Updated existing user ${email} to SUPER_ADMIN with the new password.`);
    return;
  }

  await db.user.create({
    data: {
      firstName: "Store",
      lastName: "Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✔ Created SUPER_ADMIN ${email}.`);
  console.log("  The password was hashed and stored. It is not displayed or logged.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
