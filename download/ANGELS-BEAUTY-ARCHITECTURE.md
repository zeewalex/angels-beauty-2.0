# Angels Beauty — Full-Stack Architecture (Revised)

**Status:** Revised after client architecture corrections. Pending client approval before Phase 1 Task 2 (remaining pages) and Phase 2 (backend) begin.
**Database:** Isolated local PostgreSQL 17 dev database — **not** connected to, and never modifies, the existing production Supabase database or the live Angels Beauty website.
**Schema status:** Complete, validated, and migrated to the dev database (see §6). Field-level mapping to existing Supabase tables will be confirmed during the read-only inventory (§5) — no destructive changes will be made to existing data.

---

## 1. What changed in this revision

This revision incorporates all 10 client architecture corrections:

| # | Correction | How it is addressed |
|---|---|---|
| 1 | Read-only inventory of existing Supabase + Cloudinary **before** finalizing schema | §5 — inventory script + template provided; credentials requested; schema is complete but mapping to existing tables is confirmed during inventory with no destructive ops. |
| 2 | Isolated PostgreSQL dev DB (not SQLite) | §4 — local PostgreSQL 17 on port 5433, database `angels_dev`, fully isolated. SQLite is no longer used. |
| 3 | Complete Prisma schema, validated, with migrations | §6 — 23 models, all relationships/constraints/indexes validated; initial migration `20261114152704_init` applied to dev DB. |
| 4 | Server-side authorization on **every** protected endpoint + server action (not middleware alone) | §8 — `requireRole()`/`requireSession()` helpers called inside every route handler and server action; middleware is defense-in-depth only. |
| 5 | Preserve guest checkout (no account required) | §7 + §9 — `Order.userId` optional, guest email captured, cart supports anonymous sessions, checkout works without login. |
| 6 | Safe checkout: server-side price verification, inventory protection, idempotent payments, verified webhooks, safe transactions | §9 — full pipeline with `$transaction`, price recompute, inventory reserve/commit with optimistic lock, idempotency keys, signature-verified webhooks. |
| 7 | Dedicated image-management operations (price/variant/shipping edits can't erase images) | §10 — `ProductImage` is a separate model with its own CRUD endpoints; product/variant/price/shipping update operations never touch image rows. |
| 8 | Preserve historical orders when products/variants archived | §6 + §11 — soft-archive (`status`, `archivedAt`), never hard delete; `OrderItem` stores a full snapshot; FKs use `Restrict`. |
| 9 | Security, backup, logging, monitoring, rollback | §12 — audit log, webhook log, input validation, rate limiting, secrets management, backup strategy, logging/monitoring, migration + deploy rollback. |
| 10 | Keep new site isolated from live website + production DB | §4 + §13 — dev DB is local and isolated; no prod credentials in the project; no live domain; Vercel preview deploys only; `angelsbeauties.shop` not connected until written approval. |

---

## 2. Technology stack (confirmed)

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Client state | Zustand (UI/cart) |
| Server state | TanStack Query |
| ORM | Prisma 6 → **PostgreSQL** (dev + prod) |
| Dev database | Local PostgreSQL 17 (isolated) |
| Prod database | Existing Supabase (Postgres) — verified read-only before connection (Phase 3) |
| Auth | NextAuth.js v4 (JWT, credentials + roles) |
| Validation | Zod (shared client/server) |
| Images | Cloudinary (Phase 3, existing account) |
| Payments | Clover (Phase 3, sandbox until cutover) |
| Shipping | EasyPost (Phase 3, sandbox until cutover) |
| Email | Transactional provider TBD (Phase 3) |
| Hosting | Vercel — preview URL only until approval |

---

## 3. Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Vercel (hosting)                        │
│   Preview URL  ──►  (approval gate)  ──►  Production           │
│   * angelsbeauties.shop NOT connected until written approval * │
└───────────────────────────┬──────────────────────────────────┘
                            │
            ┌───────────────▼────────────────┐
            │   Next.js 16 App Router (1 app) │
            │   - React Server Components      │
            │   - Route Handlers (/api/*)      │
            │   - Server Actions (forms)       │
            │   - Middleware (auth guard,      │
            │     DEFENSE-IN-DEPTH only)       │
            └───────┬──────────────┬───────────┘
        Client side │              │ Server side
   ┌────────────────┘              └──────────────┐
   │ Zustand (UI/cart)  │   Prisma Client (server)│
   │ TanStack Query     │   NextAuth sessions     │
   │ shadcn/ui          │   Zod validation        │
   │                    │   requireRole() per     │
   │                    │   route/action          │
   └────────────────────┘   └───────────┬─────────┘
                                        │
            ┌───────────────────────────▼───────────────────────────┐
            │   ISOLATED local PostgreSQL 17  (port 5433, angels_dev) │
            │   • Separate from production Supabase                    │
            │   • No read/write access to live data                    │
            └───────────────────────────┬───────────────────────────┘
                                        │  (Phase 3 cutover — only after
                                        │   read-only inventory + approval)
            ┌───────────────────────────▼───────────────────────────┐
            │  Supabase (existing) │ Cloudinary (existing) │ Clover  │
            │  *verified read-only* │ *verified*            │ (new)   │
            │  EasyPost (new) │ Email (new)                                │
            └──────────────────────────────────────────────────────┘
```

---

## 4. Isolated PostgreSQL development database

**Implementation (already done):**
- PostgreSQL 17.12 installed locally **without root** (Debian packages extracted to `~/pg`, binaries at `~/pg/usr/lib/postgresql/17/bin/`).
- Data directory: `~/pgdata`. Server runs on **port 5433** (distinct from any default), listening on `localhost` only, Unix socket in `/tmp`.
- Superuser/dev role: `angels`. Auth: `trust` (local dev only — never exposed externally).
- Dev database: `angels_dev`.
- Connection string (in `.env`):
  `DATABASE_URL=postgresql://angels@localhost:5433/angels_dev?schema=public`

**Isolation guarantees:**
- This database has **no network path** to the production Supabase database.
- No production credentials exist in the project (`.env` Phase 3 placeholders are empty).
- The existing live Angels Beauty website and its production database are **completely unaffected** by anything in this dev environment.
- Start/stop (dev only): `~/pg/usr/lib/postgresql/17/bin/pg_ctl -D ~/pgdata start|stop`.

**Why Postgres, not SQLite:** the client correction requires building on the same engine we will ship to production (Supabase Postgres), eliminating the risk and schema drift of a late SQLite→Postgres switch. Prisma features used here (enums, `Json`, `Decimal`, native arrays, FK constraints) are all Postgres-native.

---

## 5. Read-only data inventory (correction #1)

**Status: not yet executed — credentials required from the client.**

I checked the environment: **no Supabase or Cloudinary credentials are present** (the previous Angels Beauty development project was deleted, and no credentials remain in env vars or `.env`). Therefore the read-only inventory cannot be run yet.

**What I need from you (minimum-privilege, read-only):**
- **Supabase:** either (a) a read-only Postgres connection string to the existing project, or (b) the project URL + a **read-only** service role / anon key with SELECT access only. If you prefer not to share credentials, you can run the provided script yourself and send me the JSON report.
- **Cloudinary:** cloud name + API key + API secret (read-only usage: `resources` listing only; no uploads/deletes).

**What the inventory will do (strictly read-only):**
- Supabase: list tables, row counts per table, column types, sample rows (first 3), and existing constraints/indexes — for products, categories, variants, orders, and any related tables.
- Cloudinary: list resource counts by type/tag/folder, and a sample of asset public IDs + URLs — to confirm whether existing product images are still present.

**What the inventory will NOT do:**
- No `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, or any write operation.
- No uploads, deletions, or transformations to Cloudinary assets.
- No schema changes to Supabase.

**Deliverables:** the inventory script (`scripts/read-only-inventory.ts`, §14) and an empty report template (`download/SUPABASE-CLOUDINARY-INVENTORY-TEMPLATE.md`). Once you provide credentials (or run the script), I will fill the report and finalize any field-level mapping between existing Supabase tables and the schema in §6 — **without modifying existing data**.

---

## 6. Completed Prisma schema (correction #3)

**Status: complete, validated (`prisma validate` ✔), formatted, and migrated to the dev database.**

- File: `prisma/schema.prisma`
- Initial migration: `prisma/migrations/20261114152704_init/migration.sql` (applied to `angels_dev`; 23 tables created).
- Prisma Client generated.

**Models (23):**

| Group | Models |
|---|---|
| Auth & users | `User`, `Account`, `VerificationToken` |
| Catalog | `Category` (nested), `Product`, `ProductVariant`, `ProductImage`, `Inventory` |
| Shopping | `Cart`, `CartItem`, `WishlistItem` |
| Orders | `Order`, `OrderItem` (snapshot), `Address` |
| Shipping & payments | `Shipment`, `Payment` |
| Reviews & promotions | `Review` (moderated), `Promotion` (authorized), `CouponRedemption` |
| Content & settings | `Page`, `StoreSetting` |
| Security | `AuditLog`, `WebhookEvent` |

**Key constraints & relationships (highlights):**
- **Money as integer cents** (`*Cents Int`) — matches payment processors, no rounding, works on Postgres.
- **Soft-archive, never hard delete:** `Product.status` (`DRAFT`/`ACTIVE`/`ARCHIVED`), `ProductVariant.archivedAt`. Catalog FKs use `onDelete: Restrict` to prevent accidental deletion.
- **Historical order preservation (correction #8):** `OrderItem` stores a full snapshot (`name`, `sku`, `unitCents`, `lineCents`, `imageUrl`, `variantName`). `OrderItem.variantId` uses `Restrict`, so archiving a variant keeps both the row and the reference valid, and the order still displays correctly from the snapshot.
- **Image isolation (correction #7):** `ProductImage` is a dedicated model with its own lifecycle (`cloudinaryPublicId`, `url`, `altText`, `sortOrder`, `isPrimary`). It is managed only via dedicated image endpoints; product/variant/price/shipping update operations never read or write image rows.
- **Inventory protection (correction #6):** `Inventory` has `quantity`, `reservedQty` (held during checkout), `lowStockThreshold`, `trackInventory`, and `version` (optimistic concurrency lock). Available = `quantity - reservedQty`, enforced in app logic.
- **Idempotent payments (correction #6):** `Payment.idempotencyKey` is `@unique`, `Payment.providerPaymentId` is `@unique`. Duplicate charge attempts are rejected.
- **Verified webhooks (correction #6):** `WebhookEvent` logs every incoming webhook with `provider`, `externalId` (`@unique` per provider — idempotent), `signature`, `payload`, and `status` (`RECEIVED`/`PROCESSING`/`PROCESSED`/`FAILED`).
- **Guest checkout (correction #5):** `Order.userId` is optional; `Order.email` captures the guest email; `Cart.userId` optional with `sessionId` for anonymous carts; `Address.userId` optional.
- **Authorized promotions (40% OFF control):** `Promotion.isActive` + `authorizedBy` + `startsAt`/`endsAt` + `usageLimit`. No promotional banner renders on the live site without an active, authorized, in-date record.
- **Indexing:** FK columns and common filter/sort columns are indexed (`@@index`) for query performance.

The full schema is in `prisma/schema.prisma` and the generated SQL in `prisma/migrations/20261114152704_init/migration.sql`.

---

## 7. Authentication & authorization

**Provider:** NextAuth.js v4, **JWT** (stateless — best for Vercel serverless).
- Credentials provider (email + password), bcrypt-hashed passwords.
- Roles: `CUSTOMER`, `ADMIN`, `SUPER_ADMIN`.
- Account flows: email verification, password reset (token via `VerificationToken`), optional OAuth later (`Account`).
- First admin created via an **invite-only script** (or env-seeded super-admin), never via public sign-up.

**Guest checkout is preserved:** a customer can complete checkout without an account. An account is only required for wishlist persistence, order history, and saved addresses. A guest order captures the email and can optionally be migrated to an account post-purchase.

---

## 8. Server-side authorization (correction #4 — not middleware alone)

Middleware checks the JWT for route protection (`/account/*`, `/checkout`, `/admin/*`, `/api/admin/*`) as **defense-in-depth**, but every protected Route Handler and Server Action additionally calls an explicit authorization helper:

```
// pseudo — actual helpers live in src/lib/authz.ts
requireSession()           → throws 401 if no valid session
requireRole("ADMIN")      → throws 403 if session.role < ADMIN
requireOwnership(resource) → throws 403 if resource.userId !== session.userId
```

- Every `/api/admin/*` handler calls `requireRole("ADMIN")` at the top, then re-checks before each mutating operation.
- Every customer write endpoint (`/api/cart`, `/api/wishlist`, `/api/orders`, `/api/account/*`) calls `requireSession()` and `requireOwnership()` where the resource is user-scoped.
- Server Actions repeat the same checks — they never trust that "middleware already verified."
- Read endpoints validate query input with Zod before querying.

This means even if middleware were bypassed or misconfigured, each handler independently enforces authorization.

---

## 9. Checkout pipeline (correction #6 — safe by construction)

The checkout flow runs as a single Prisma `$transaction` with the following stages:

1. **Validate cart** — load cart items, confirm each variant is `ACTIVE` (not archived), confirm `trackInventory` + available quantity.
2. **Server-side price verification** — recompute every line total from the **database** `ProductVariant.priceCents` (never trust client-submitted prices). Recompute subtotal, discount (from a verified `Promotion`), shipping (from EasyPost rate or flat rule), tax. The client-submitted total is compared; any mismatch aborts the transaction.
3. **Inventory protection** — atomically increment `Inventory.reservedQty` (with optimistic-lock `version` check) for each line. If available drops below the requested quantity, abort.
4. **Idempotent payment** — check `Payment.idempotencyKey`; if already processed, return the existing result. Otherwise create a Clover charge server-side with that key. On success, record `providerPaymentId`; on failure, roll back the reservation.
5. **Create order** — insert `Order` (status `CONFIRMED`, `paymentStatus` `PAID`), `OrderItem` rows with the **snapshot**, `CouponRedemption`, and link `Payment`.
6. **Commit inventory** — convert `reservedQty` into actual `quantity` deduction; decrement stock.
7. **Webhook safety** — Clover/EasyPost webhooks update order/shipment status only after **signature verification** and **idempotent** processing (checked via `WebhookEvent.externalId`).

If any stage fails, the transaction rolls back: no partial orders, no orphaned inventory holds, no duplicate charges.

---

## 10. Image management isolation (correction #7)

- `ProductImage` rows are created/updated/deleted **only** through dedicated endpoints:
  `POST /api/admin/products/[id]/images`, `PATCH /api/admin/images/[id]`, `DELETE /api/admin/images/[id]`, `POST /api/admin/images/[id]/primary`.
- The product update endpoint (`PATCH /api/admin/products/[id]`) and the variant update / price / shipping endpoints operate on `Product`/`ProductVariant`/`Inventory` fields only — they **never** include image fields in their Zod input schema and never write to `ProductImage`.
- Reordering/setting primary is a separate image operation.
- Deleting a product cascades its images (FK `onDelete: Cascade` on `ProductImage`), but archiving a product (the normal lifecycle) leaves images intact.
- Result: editing price, variants, or shipping can never accidentally erase images.

---

## 11. Historical order preservation (correction #8)

- Products and variants are **soft-archived**, never hard-deleted.
- `OrderItem` carries a full purchase-time snapshot (`name`, `sku`, `unitCents`, `lineCents`, `imageUrl`, `variantName`), so an order renders correctly forever — even if the product or variant is later archived or its price/name changes.
- `OrderItem.variantId` and `OrderItem.productId` use `onDelete: Restrict`, and `Order`/`OrderItem` use `Restrict`, so neither the variant nor the order can be accidentally deleted while the other exists.
- Admin "delete" actions on catalog entities are actually "archive" actions.

---

## 12. Security, backup, logging, monitoring, rollback (correction #9)

**Security**
- All input validated with Zod (shared schemas).
- Passwords bcrypt-hashed; JWT signed with a server secret; HTTP-only cookies.
- Per-route + per-action server-side authorization (§8).
- Rate limiting on auth, newsletter, contact, and review endpoints.
- No third-party SDK or secrets in client code; all provider calls server-side.
- CORS locked to the storefront origin; webhooks verified by signature.

**Backup**
- Dev DB (`angels_dev`): periodic `pg_dump` snapshots into `db/backups/`.
- Production (Phase 3): rely on Supabase automated backups + nightly logical exports; Cloudinary assets are immutable and versioned. No destructive migration runs without a pre-snapshot.

**Logging & monitoring**
- `AuditLog` records every admin mutating action (actor, role, action, entity, IP, metadata).
- `WebhookEvent` records every incoming provider webhook and its processing result.
- Application errors logged server-side with request context; no sensitive data in logs.
- Vercel runtime logs + uptime monitoring on the preview URL.

**Rollback**
- Migrations are versioned in `prisma/migrations/`; every change has a down-path or is applied additively. `prisma migrate resolve` + `migrate diff` used for safe corrections. No `db push` against production.
- Deployments: Vercel instant rollback to the previous preview/production deployment.
- Failed migrations never reach production (preview gate + approval).

---

## 13. Isolation from the live site & production database (correction #10)

- The dev database is **local** (port 5433) and has no network route to production Supabase.
- No production credentials live in the project (Phase 3 placeholders are empty in `.env`).
- No code connects to Cloudinary, Clover, EasyPost, or email yet.
- Deployment target is a **separate Vercel preview URL**. `angelsbeauties.shop` is **not** connected and will not be until you give written approval after Phase 4 testing.
- The existing live Angels Beauty website continues to operate independently and is unaffected.

---

## 14. Read-only inventory script & template

Provided as separate files:
- **Script:** `scripts/read-only-inventory.ts` — a standalone TypeScript script that connects to Supabase (read-only) and Cloudinary (read-only) and emits a JSON inventory report. It performs **only** `SELECT` / list operations. Run with: `bun run scripts/read-only-inventory.ts` after setting the env vars listed in the script header.
- **Template:** `download/SUPABASE-CLOUDINARY-INVENTORY-TEMPLATE.md` — the report structure I will fill once the inventory is run.

---

## 15. Updated development roadmap

### Phase 1 — Frontend (in progress)
| Task | Status |
|---|---|
| 1.1 Homepage | ✅ Complete (design corrections applied + verified) |
| 1.2 Shop & category listing pages | Pending approval |
| 1.3 Individual product pages (gallery, variants, reviews, related) | Pending |
| 1.4 Search + filtering (query, facets, sort) | Pending |
| 1.5 Cart drawer/page + wishlist | Pending |
| 1.6 Customer account pages (profile, addresses, orders, wishlist) | Pending |
| 1.7 Checkout interface (guest + signed-in) | Pending |
| 1.8 About + Contact pages | Pending |
| 1.9 Promotional banners (admin-driven, authorized) | Pending |
| 1.10 Customer reviews UI (list + submit, moderated) | Pending |
| 1.11 Newsletter + footer | Newsletter done on homepage |
| 1.12 Admin dashboard UI | Pending |

### Phase 2 — Backend core (on isolated Postgres dev DB)
- Product/category/variant/inventory management + dedicated image operations (§10)
- Customer auth + roles + server-side authorization on every endpoint/action (§8)
- Cart/wishlist (anonymous + authenticated), guest checkout preserved (§7, §9)
- Order pipeline with safe transactions, price verification, inventory protection, idempotent payments, verified webhooks (§9)
- Admin access controls + audit logging (§12)
- Reviews moderation, authorized promotions, content pages, settings
- Zod validation everywhere; consistent error shape

### Phase 3 — Connect existing services (read-only audit first, then integrate)
1. Run the read-only inventory (§5) — verify existing Supabase + Cloudinary data; present findings.
2. Map existing data to the §6 schema; import or adapt **without destructive changes**; take a pre-snapshot.
3. Switch Prisma datasource to Supabase (dev schema first, then production after testing).
4. Wire Cloudinary signed uploads + transformations (existing assets reused).
5. Wire Clover (sandbox) + EasyPost (sandbox) + webhooks.
6. Wire transactional email.

### Phase 4 — Testing & deployment
- Full E2E test matrix (§10 of the prior version, retained).
- Deploy to a **separate Vercel preview URL**.
- Client review on preview.
- Only after **written approval**: point `angelsbeauties.shop` to the new build.

---

## 16. Guardrails (reaffirmed)

- No migrations against production.
- No live payment credentials (Clover/EasyPost sandbox only until cutover).
- No deployment to the live domain until written approval.
- No new Supabase or Cloudinary accounts created without client approval.
- No destructive operations on existing Supabase or Cloudinary data.

---

## 17. Approvals needed

1. **Homepage design** — corrected version ready for review (screenshots provided separately).
2. **This revised architecture** — stack, dev DB, schema, auth, checkout safety, image isolation, archival, security/backup/rollback, isolation.
3. **Read-only inventory** — provide credentials (or run the script) so the existing Supabase + Cloudinary data can be verified before Phase 3.

No further development begins until these are approved.
