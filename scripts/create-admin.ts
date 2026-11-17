/**
 * Create an admin user in the ISOLATED dev database (angels_dev).
 * Dev-only. Production admin provisioning is via invite (Phase 3+).
 * Run: export DATABASE_URL=... && bun run scripts/create-admin.ts
 */
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const email = "admin@angels.dev";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "SUPER_ADMIN") {
      await db.user.update({ where: { id: existing.id }, data: { role: "SUPER_ADMIN", status: "ACTIVE" } });
      console.log(`✔ Promoted existing user ${email} to SUPER_ADMIN.`);
    } else {
      console.log(`✔ ${email} is already SUPER_ADMIN.`);
    }
    return;
  }
  await db.user.create({
    data: {
      firstName: "Store",
      lastName: "Admin",
      email,
      passwordHash: await hashPassword("adminpass123"),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✔ Created SUPER_ADMIN ${email} (password: adminpass123) — DEV ONLY.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
