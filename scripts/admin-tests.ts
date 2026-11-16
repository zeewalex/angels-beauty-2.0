/**
 * Phase 3 admin security + functionality tests.
 * Run: export DATABASE_URL=... && bun run scripts/admin-tests.ts
 * (Requires dev server on :3000 with the admin user created.)
 */
const BASE = "http://localhost:3000";
let passed = 0, failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} ${detail}`); }
}

async function signIn(email: string, password: string): Promise<string> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookie = csrfRes.headers.get("set-cookie")?.split(";")[0] ?? "";
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
    body: new URLSearchParams({ email, password, csrfToken }).toString(),
    redirect: "manual",
  });
  const sc = res.headers.get("set-cookie") ?? "";
  const session = sc.split(",").map((c) => c.split(";")[0]).join("; ");
  return session;
}

async function main() {
  console.log("Phase 3 — admin security + functionality tests\n");

  // ---- 1. Unauthorized access ----
  console.log("[1] Unauthorized access");
  const noAuth = await fetch(`${BASE}/api/admin/products`);
  check("admin products without session → 403", noAuth.status === 403, `got ${noAuth.status}`);
  const noAuthOrders = await fetch(`${BASE}/api/admin/orders/abc`);
  check("admin order detail without session → 403", noAuthOrders.status === 403, `got ${noAuthOrders.status}`);

  // ---- 2. Cross-user: a CUSTOMER cannot access admin ----
  console.log("[2] Cross-user (customer cannot access admin)");
  const custSession = await signIn("demo.shopper@angels.dev", "demopass123");
  const custAccess = await fetch(`${BASE}/api/admin/products`, { headers: { Cookie: custSession } });
  check("customer accessing admin products → 403", custAccess.status === 403, `got ${custAccess.status}`);

  // ---- Sign in as admin ----
  const adminSession = await signIn("admin@angels.dev", "adminpass123");
  check("admin sign-in succeeded", adminSession.includes("next-auth.session-token") || adminSession.includes("__Secure-"), adminSession.slice(0, 40));

  // ---- 3. Image preservation during product edit ----
  console.log("[3] Image preservation (product edit doesn't touch images)");
  const adminHdr = { Cookie: adminSession };
  const prods = await (await fetch(`${BASE}/api/admin/products`, { headers: adminHdr })).json();
  const testProduct = prods.products?.[0];
  check("fetched admin products list", !!testProduct);
  if (testProduct) {
    const imgsBefore = await (await fetch(`${BASE}/api/admin/products/${testProduct.id}/images`, { headers: adminHdr })).json();
    const beforeCount = imgsBefore.images?.length ?? 0;
    // edit the product (name change) — must NOT affect images
    await fetch(`${BASE}/api/admin/products/${testProduct.id}`, { method: "PATCH", headers: { ...adminHdr, "Content-Type": "application/json" }, body: JSON.stringify({ name: testProduct.name + " (edit)" }) });
    const imgsAfter = await (await fetch(`${BASE}/api/admin/products/${testProduct.id}/images`, { headers: adminHdr })).json();
    check("image count unchanged after product edit", (imgsAfter.images?.length ?? 0) === beforeCount, `before=${beforeCount} after=${imgsAfter.images?.length}`);
    // restore name
    await fetch(`${BASE}/api/admin/products/${testProduct.id}`, { method: "PATCH", headers: { ...adminHdr, "Content-Type": "application/json" }, body: JSON.stringify({ name: testProduct.name }) });
  }

  // ---- 4. Inventory update ----
  console.log("[4] Inventory update");
  if (testProduct) {
    const before = await (await fetch(`${BASE}/api/admin/products/${testProduct.id}`, { headers: adminHdr })).json();
    const oldStock = before.product?.variants?.[0]?.inventory?.quantity ?? 0;
    await fetch(`${BASE}/api/admin/products/${testProduct.id}`, { method: "PUT", headers: { ...adminHdr, "Content-Type": "application/json" }, body: JSON.stringify({ stock: oldStock + 5 }) });
    const after = await (await fetch(`${BASE}/api/admin/products/${testProduct.id}`, { headers: adminHdr })).json();
    check("stock increased by 5", (after.product?.variants?.[0]?.inventory?.quantity ?? 0) === oldStock + 5, `before=${oldStock} after=${after.product?.variants?.[0]?.inventory?.quantity}`);
  }

  // ---- 5. Product archival ----
  console.log("[5] Product archival (soft)");
  if (testProduct) {
    const res = await fetch(`${BASE}/api/admin/products/${testProduct.id}?action=archive`, { method: "POST", headers: adminHdr });
    check("archive returns ok", res.status === 200, `got ${res.status}`);
    const after = await (await fetch(`${BASE}/api/admin/products/${testProduct.id}`, { headers: adminHdr })).json();
    check("product status is ARCHIVED", after.product?.status === "ARCHIVED", after.product?.status);
    // restore
    await fetch(`${BASE}/api/admin/products/${testProduct.id}?action=restore`, { method: "POST", headers: adminHdr });
  }

  // ---- 6. Audit logging ----
  console.log("[6] Audit logging");
  // The archive + restore above created audit entries. Verify via the audit API or DB.
  const { db } = await import("../src/lib/db");
  const auditCount = await db.auditLog.count({ where: { action: { in: ["product.archive", "product.restore", "product.update"] } } });
  check("audit entries exist for admin actions", auditCount > 0, `count=${auditCount}`);
  await db.$disconnect();

  // ---- 7. Payment status not changeable via admin ----
  console.log("[7] No unverified payment-status changes");
  // Attempt to change paymentStatus via the order PATCH (should be ignored — not in schema).
  if (testProduct) {
    // create a quick order to test (via the existing test orders) — just verify the PATCH schema rejects paymentStatus
    const orders = await db.order.findMany({ take: 1 });
    if (orders.length) {
      const o = orders[0];
      const res = await fetch(`${BASE}/api/admin/orders/${o.id}`, { method: "PATCH", headers: { ...adminHdr, "Content-Type": "application/json" }, body: JSON.stringify({ paymentStatus: "PAID" }) });
      // paymentStatus is not in the patchSchema → validation fails → 400
      check("paymentStatus change rejected (400)", res.status === 400, `got ${res.status}`);
    } else {
      check("skipped (no orders to test)", true);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error("Test runner failed:", e); process.exit(1); });
