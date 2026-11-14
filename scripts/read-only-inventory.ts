/**
 * ============================================================================
 *  Angels Beauty — READ-ONLY data inventory script
 * ----------------------------------------------------------------------------
 *  Purpose: verify whether the existing Supabase database still contains
 *  products/categories/variants/orders, and whether the existing Cloudinary
 *  account still contains uploaded product images — BEFORE any integration.
 *
 *  ★ THIS SCRIPT IS STRICTLY READ-ONLY. ★
 *    It performs ONLY HTTP GET requests (Supabase REST API + Cloudinary
 *    Admin API listing). It NEVER inserts, updates, deletes, uploads,
 *    transforms, or destroys any data in Supabase or Cloudinary.
 *
 *  Required environment variables (set in your shell before running):
 *    SUPABASE_URL          e.g. https://xxxxxxxx.supabase.co
 *    SUPABASE_KEY          service role key (read-only usage; bypasses RLS)
 *    CLOUDINARY_CLOUD_NAME
 *    CLOUDINARY_API_KEY
 *    CLOUDINARY_API_SECRET
 *
 *  Run:
 *    SUPABASE_URL=... SUPABASE_KEY=... \
 *    CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... \
 *    bun run scripts/read-only-inventory.ts
 *
 *  Output:
 *    download/SUPABASE-CLOUDINARY-INVENTORY-REPORT.json  (the inventory)
 *
 *  If you prefer not to share credentials with the build agent, you can run
 *  this script yourself and send back the generated JSON report.
 * ============================================================================
 */

const OUT_PATH = new URL("../download/SUPABASE-CLOUDINARY-INVENTORY-REPORT.json", import.meta.url);

// ---- env checks -----------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET;

const report: any = {
  generatedAt: new Date().toISOString(),
  mode: "READ-ONLY (GET requests only — no writes, no uploads, no deletes)",
  supabase: { configured: !!(SUPABASE_URL && SUPABASE_KEY), tables: [], notes: [] },
  cloudinary: { configured: !!(CLOUD_NAME && CLOUD_KEY && CLOUD_SECRET), resources: [], summary: null, notes: [] },
};

// ---- helpers --------------------------------------------------------------
async function getJSON(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { method: "GET", headers });
  return { status: res.status, ok: res.ok, headers: res.headers, data: await res.json().catch(() => null) };
}

// ---- Supabase (read-only via PostgREST GET) -------------------------------
async function inventorySupabase() {
  if (!report.supabase.configured) {
    report.supabase.notes.push("SUPABASE_URL / SUPABASE_KEY not set — skipped.");
    return;
  }
  const base = `${SUPABASE_URL}/rest/v1`;
  const headers = {
    apikey: SUPABASE_KEY!,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
  };

  // 1. Root: lists available tables (OpenAPI paths) — GET only
  const root = await getJSON(base, headers);
  if (!root.ok) {
    report.supabase.notes.push(`Root request failed: HTTP ${root.status}`);
    return;
  }
  const paths: string[] = Object.keys(root.data?.paths || {});
  // PostgREST exposes each table/view as a path like "/products"
  const candidates = paths
    .map((p) => p.replace(/^\//, ""))
    .filter((p) => !p.includes("/") && !p.startsWith("rpc/"));

  report.supabase.notes.push(`Discovered ${candidates.length} table/view endpoint(s): ${candidates.join(", ")}`);

  // 2. For each table: count + 3 sample rows (all GET)
  for (const table of candidates) {
    // count via Range header + Prefer count=exact (no body returned beyond range)
    const countRes = await fetch(`${base}/${encodeURIComponent(table)}?select=*`, {
      method: "GET",
      headers: { ...headers, Range: "0-0", Prefer: "count=exact" },
    });
    const range = countRes.headers.get("content-range") || "";
    const total = range.includes("/") ? Number(range.split("/")[1]) : null;

    // 3 sample rows
    const sample = await getJSON(`${base}/${encodeURIComponent(table)}?select=*&limit=3`, headers);

    report.supabase.tables.push({
      table,
      rowCount: total,
      sampleRows: Array.isArray(sample.data) ? sample.data.slice(0, 3) : sample.data,
      columnHints: sample.data && Array.isArray(sample.data) && sample.data[0]
        ? Object.keys(sample.data[0])
        : [],
    });
  }
}

// ---- Cloudinary (read-only Admin API: GET /resources) --------------------
async function inventoryCloudinary() {
  if (!report.cloudinary.configured) {
    report.cloudinary.notes.push("CLOUDINARY_* not set — skipped.");
    return;
  }
  const auth = Buffer.from(`${CLOUD_KEY}:${CLOUD_SECRET}`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, Accept: "application/json" };

  // Summary by resource type — GET only
  let byType: Record<string, { count: number; sample: any[] }> = {};
  for (const type of ["image", "video", "raw"]) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/${type}?max_results=500`;
    const res = await getJSON(url, headers);
    if (!res.ok) {
      report.cloudinary.notes.push(`${type} list HTTP ${res.status}`);
      continue;
    }
    const resources = res.data?.resources || [];
    byType[type] = {
      count: resources.length,
      sample: resources.slice(0, 3).map((r: any) => ({
        publicId: r.public_id,
        format: r.format,
        url: r.secure_url,
        bytes: r.bytes,
        folder: r.folder,
        tags: r.tags,
      })),
    };
    report.cloudinary.resources.push({ type, ...byType[type] });
  }
  report.cloudinary.summary = {
    totalListed: Object.values(byType).reduce((n, t) => n + t.count, 0),
    byType,
  };
}

// ---- run ------------------------------------------------------------------
(async () => {
  console.log("★ READ-ONLY inventory starting. No writes will be performed.");
  await inventorySupabase();
  await inventoryCloudinary();

  const { writeFileSync, mkdirSync } = await import("node:fs");
  const { dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const out = fileURLToPath(OUT_PATH);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`✔ Report written to ${out}`);
  console.log("Supabase tables:", report.supabase.tables.map((t: any) => `${t.table}(${t.rowCount ?? "?"})`).join(", ") || "n/a");
  console.log("Cloudinary total listed:", report.cloudinary.summary?.totalListed ?? "n/a");
})();
