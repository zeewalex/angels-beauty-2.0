# Supabase + Cloudinary Read-Only Inventory — Report Template

**Status:** Not yet populated. This template will be filled once the read-only
inventory script (`scripts/read-only-inventory.ts`) has been run with credentials.

---

## How this gets filled

Either:
- **(A)** You provide read-only credentials (Supabase URL + service role key,
  Cloudinary cloud name + API key + secret) and the build agent runs
  `bun run scripts/read-only-inventory.ts`, which writes a JSON report to
  `download/SUPABASE-CLOUDINARY-INVENTORY-REPORT.json`; the agent then summarizes
  it here. The script performs **only GET requests** — no writes of any kind.
- **(B)** You run the script yourself (so credentials never leave your side)
  and send back the generated JSON report.

---

## 1. Supabase database (existing)

### 1.1 Connection
- Project URL: ____________________
- Auth method used: service role key (read-only GET usage)
- Date of inventory: ____________________

### 1.2 Tables discovered
| Table | Row count | Column hints | Sample (first 3 rows) |
|---|---|---|---|
| products | _ | _ | _ |
| categories | _ | _ | _ |
| product_variants / variants | _ | _ | _ |
| orders | _ | _ | _ |
| order_items | _ | _ | _ |
| product_images | _ | _ | _ |
| reviews | _ | _ | _ |
| promotions / coupons | _ | _ | _ |
| users / customers | _ | _ | _ |
| (others) | _ | _ | _ |

### 1.3 Findings
- Do products still exist? YES / NO — count: ______
- Do categories still exist? YES / NO — count: ______
- Do variants still exist? YES / NO — count: ______
- Do orders still exist? YES / NO — count: ______
- Schema shape vs. our Prisma schema (§6 of architecture doc):
  - Fields that map 1:1: ____________________
  - Fields that need transformation: ____________________
  - Fields in existing data not in our schema: ____________________
  - Fields in our schema not in existing data: ____________________

### 1.4 Migration decision (to be made WITH the client — no destructive ops)
- Preferred path: import existing data into our schema / adapt our schema to fit / both.
- Any renaming, type changes, or table additions will be presented as a **written
  change plan** and approved before any migration is applied.

---

## 2. Cloudinary (existing)

### 2.1 Connection
- Cloud name: ____________________
- Auth method used: API key + secret (read-only Admin API listing)
- Date of inventory: ____________________

### 2.2 Resources discovered
| Type | Count listed | Sample public IDs | Sample URLs |
|---|---|---|---|
| image | _ | _ | _ |
| video | _ | _ | _ |
| raw | _ | _ | _ |

### 2.3 Findings
- Do existing product images still exist? YES / NO — count: ______
- Folder/tag structure observed: ____________________
- Are public IDs discoverable for re-linking to products? YES / NO

### 2.4 Reuse plan (no destructive ops)
- Existing assets will be referenced as-is via their public IDs / URLs.
- No existing asset will be deleted or overwritten without explicit approval.
- New uploads (Phase 3+) will be additive only.

---

## 3. Confirmation

- ☐ Inventory was performed read-only (GET requests only).
- ☐ No data in Supabase or Cloudinary was modified, deleted, or created.
- ☐ Field-level mapping between existing data and the Prisma schema is documented above.
- ☐ Migration/change plan (if any) will be presented for approval before execution.
