# Angels Beauty — Stage A Report: Service Integration (Supabase + Cloudinary)

**Status:** Complete. Stopping for review.
**No Clover, EasyPost, or production email connected. No production data modified. No deployment.**

---

## Verification items (your 4 pre-integration checks)

### 1. Product-image operations (add/replace/reorder/remove) — Cloudinary assets preserved ✅
- Admin image APIs (`/api/admin/products/[id]/images` POST, `/api/admin/images/[id]` PATCH/DELETE) operate **only on DB `ProductImage` rows** (which reference Cloudinary URLs + public IDs). They **never call the Cloudinary API** — no upload, delete, overwrite, or transformation of assets.
- **Test:** `scripts/admin-tests.ts` — added an image, edited the product (name change), verified image count unchanged; the Cloudinary URLs remain HTTP 200 (assets intact).
- Adding/removing/reordering/setting-primary changes which URL a product references, never the asset itself.

### 2. Category editing + safe archival ✅
- **New:** `/api/admin/categories/[id]` PATCH (rename/activate) + POST `?action=archive` (soft-archive `isActive=false`).
- **Guard:** archiving a category with **active products** is refused (409) — "Cannot archive: N active product(s) still use this category. Reassign or archive them first." This prevents leaving active products without a valid customer-facing category.

### 3. Promotions end-to-end ✅
- **Storefront display:** promotions are managed via `/admin/promotions` (create/list). A promotion only displays/ applies when `isActive=true` **AND** `authorizedBy` is set **AND** within the date window.
- **Checkout price calculation:** the checkout API now accepts an optional `couponCode`; it validates the promotion (active + authorized + in-date + usage limit), computes the discount (PERCENTAGE / FIXED_AMOUNT / FREE_SHIPPING), records a `CouponRedemption`, and increments usage.
- **Eligibility + expiry:** expired/out-of-window/inactive/unauthorized promotions are rejected ("invalid, expired, or not authorized").
- **No unauthorized discounts:** only active+authorized+in-date promotions apply; the homepage 40% OFF banner remains a clearly-marked demo (no live discount).

### 4. Admin role enforcement, CSRF, audit-log integrity, demo creds ✅
- **Role enforcement:** `requireRole("ADMIN")` in every admin Route Handler + Server Action + layout; middleware (`getToken` role check) guards `/admin/*`. Customer accounts → 403. Verified by tests.
- **CSRF:** `checkOrigin(req)` (Origin-header verification) on all admin mutating endpoints (POST/PATCH/PUT/DELETE); SameSite=Lax session cookie.
- **Audit-log integrity:** every admin mutation writes an `AuditLog` entry (actor, role, action, entity, summary). Verified by test.
- **Demo admin credentials:** `admin@angels.dev` / `adminpass123` exists **only in the dev DB** (`angels_dev`). `scripts/create-admin.ts` is dev-only. Production admin provisioning will be invite-based. The `simulate-payment` endpoint 404s in production.

**Admin test results:** `scripts/admin-tests.ts` — **11/11 passed** (unauthorized 403, cross-user 403, image preservation, inventory update, archival, audit logging, payment-status rejection).

---

## Stage A: Supabase (READ-ONLY)

**Approach:** the client-provided `Product_rows.csv` export is the read-only Supabase source (per the earlier decision not to use service-role credentials). No live Supabase connection, no writes, no migrations.

**Reconciliation report:** `download/SUPABASE-CATALOG-RECONCILIATION.md`

| Metric | Supabase (CSV) | Dev catalog | Match |
|---|---|---|---|
| Products | 72 | 72 | ✓ |
| Category slugs | 12 | 11 | 12→11 (2 approved corrections) |
| Price mismatches | — | — | **0** |
| Stock mismatches | — | — | **0** |
| Image-ref mismatches | — | — | **0** |
| Name/slug mismatches | — | — | **0** |

**Category corrections (dev only, source slugs preserved):**
- `face-masks-scrubs` → merged into `masks-scrubs` (1 product).
- Angels Slimming and Detox Tea: `toners` → `supplements`.

**Discrepancies requiring your decision:** **None.** All product data matches exactly. When you approve a live read-only connection (read-only role / anon+RLS), the same comparison can re-run against live tables.

## Stage A: Cloudinary (READ-ONLY verification)

**Report:** `download/CLOUDINARY-IMAGE-VERIFICATION.md` · **Contact sheet:** `download/product-image-contact-sheet.png`

| Metric | Value |
|---|---|
| Unique Cloudinary URLs | 89 |
| Reachable (HTTP 200) | **89 / 89** |
| Unreachable | 0 |
| Total image refs | 112 |
| Products with ≥1 image | 72 / 72 |

**Assets preserved:** no uploads, deletes, overwrites, or reassignments. Public IDs untouched.

**Flagged mismatches (pending your approval — NOT auto-reassigned):**
1. Egg Collagen Soap — primary image is the serum.
2. Pink Collagen Soap — shows orange soaps.
3. Vitamin C Soap — shows orange soaps.
4. Caramel Lush Body Lotion — multi-product collection shot.
5. 24K Gold Serum & Glycolic Serum — identical 6-image sets.
Focused comparison: `download/image-comparison-flagged.png`.

---

## Security
- Credentials in environment variables only (`.env` — untracked, gitignored, removed from git history).
- No credentials in logs, reports, or screenshots.
- Least-privilege: no service-role credentials used; the CSV export is the read-only source.
- Dev database isolated (`angels_dev`); production Supabase/Cloudinary untouched.

## Screenshots (desktop + mobile)
Admin: Dashboard, Products, Categories, Orders, Customers, Promotions, Audit — at `/tmp/stageA-desktop-admin-*.png` + `/tmp/stageA-mobile-admin-*.png`.
**Live:** Preview Panel → sign in `admin@angels.dev` / `adminpass123` → `/admin`.

---

## Stopping for review
Per your instruction, development stops here. No Clover, EasyPost, or production email connected. No production data modified. No deployment. The 72 products, 11 categories, and Cloudinary image references are preserved. Awaiting your approval + decisions on the flagged image mismatches before proceeding to Stage B (Clover/EasyPost/email).
