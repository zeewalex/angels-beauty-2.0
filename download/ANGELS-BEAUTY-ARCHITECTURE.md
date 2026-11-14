# Angels Beauty — Full-Stack Architecture Proposal & Development Roadmap

**Status:** Draft for client review and approval — **do not begin Phase 1 Task 2 or any backend development until approved.**
**Date:** November 2024
**Prepared by:** Zai (build lead)

---

## 1. Executive summary

This document proposes the complete architecture for the new Angels Beauty ecommerce
website, rebuilt from scratch on Next.js 16 + TypeScript. It covers the technology
stack, development roadmap (Phases 1–4), database schema, authentication, API
structure, third-party integration strategy, security, and the plan for replacing
all temporary demo content with production-ready implementations.

The homepage (Phase 1, Task 1) is complete and under QC review. **No further
development stages will start until the design and this architecture are
approved.**

Two non-negotiable guardrails from the client:
- **Do not create new Cloudinary or Supabase accounts.** Verify and reuse the
  existing accounts/data.
- **Do not connect `angelsbeauties.shop`** until the new site is approved.

---

## 2. Confirmed technology stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16 (App Router)** | Required, non-negotiable |
| Language | **TypeScript 5** | Required, strict |
| Styling | **Tailwind CSS 4 + shadcn/ui (New York)** | Already scaffolded |
| Client state | **Zustand** | Cart UI state, UI preferences |
| Server state | **TanStack Query** | Product lists, cart sync, admin data |
| ORM | **Prisma 6** | Dev = SQLite; Prod (Phase 3) = Supabase Postgres |
| Auth | **NextAuth.js v4** | Credentials + role-based access |
| Validation | **Zod** | Shared client/server schemas |
| Icons | **Lucide React** | Already in use |
| Realtime | **Socket.io mini-service** (optional) | Order status / admin live updates only if needed |
| Hosting | **Vercel** | Preview URL first; production only after approval |
| Payments | **Clover** (Phase 3) | |
| Shipping | **EasyPost** (Phase 3) | |
| Images | **Cloudinary** (Phase 3) | Existing account — verify assets first |
| Database | **Supabase (Postgres)** (Phase 3) | Existing account — verify data first |
| Email | **TBD provider** (Phase 3) | Transactional: order confirmations, shipping, resets |

---

## 3. Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Vercel (hosting)                        │
│   Preview URL  ──►  (approval gate)  ──►  Production          │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────▼────────────────┐
            │   Next.js 16 App Router (1 app) │
            │   - React Server Components      │
            │   - Route Handlers (/api/*)      │
            │   - Server Actions (forms)       │
            │   - Middleware (auth, locale)    │
            └───────┬──────────────┬───────────┘
        Client side │              │ Server side
   ┌────────────────┘              └──────────────┐
   │ Zustand (UI/cart)  │   Prisma Client (server)│
   │ TanStack Query     │   NextAuth sessions     │
   │ shadcn/ui          │   Zod validation        │
   └────────────────────┘   └───────────┬─────────┘
                                        │
            ┌───────────────────────────▼───────────────────────────┐
            │              Phase 2 dev: local SQLite                 │
            │   (separate dev DB — no touch to Supabase/Cloudinary)  │
            └───────────────────────────┬───────────────────────────┘
                                        │  (Phase 3 cutover)
            ┌───────────────────────────▼───────────────────────────┐
            │  Supabase (Postgres)  │  Cloudinary  │  Clover  │ EasyPost │ Email │
            │  *verified existing*   │  *verified*  │  *new*   │  *new*  │  *new*│
            └──────────────────────────────────────────────────────┘
```

**Key principle:** one Next.js application serves both the storefront and the
admin dashboard. Admin lives under `/admin/*` protected by a middleware
role check. The storefront and admin share the same Prisma client and API
layer but with different route segments and authorization.

---

## 4. Development roadmap

### Phase 1 — Frontend (in progress)
Customer-facing UI + admin UI shell, all using demo data.

| Task | Status | Notes |
|---|---|---|
| 1.1 Homepage | ✅ Done | Under QC review |
| 1.2 Shop & category listing pages | Pending approval | Grid + filters + sort |
| 1.3 Individual product pages | Pending | Gallery, variants, reviews, related |
| 1.4 Search + filtering | Pending | Query, facets (category, price, rating), sort |
| 1.5 Cart + wishlist | Pending | Drawer/page, qty, totals, persisted server-side |
| 1.6 Customer account pages | Pending | Profile, addresses, order history, wishlist |
| 1.7 Checkout interface | Pending | Shipping, payment (Clover stub), review, confirmation |
| 1.8 About + Contact pages | Pending | Static + form |
| 1.9 Promotional banners / offers | Pending | Admin-driven, authorized flag |
| 1.10 Customer reviews UI | Pending | List + submit form (moderated) |
| 1.11 Newsletter + footer | Pending | Newsletter already on homepage |
| 1.12 Admin dashboard UI | Pending | Products, orders, customers, inventory, content |

### Phase 2 — Backend core (after Phase 1 + design approval)
Clean, secure ecommerce architecture on the **local dev SQLite DB**.

| Module | Deliverables |
|---|---|
| Product & category management | CRUD APIs, nested categories, slug management, sort/featured flags |
| Product variants & inventory | Variants (size/shade), SKU, stock levels, low-stock thresholds, track flag |
| Customer accounts & auth | NextAuth credentials, email verification, password reset, roles |
| Order management | Cart → checkout → order pipeline, order items snapshot, statuses |
| Admin access controls | Role-based (CUSTOMER / ADMIN / SUPER_ADMIN), middleware guard on `/admin` + `/api/admin` |
| Image management | Upload flow (local dev → Cloudinary in Phase 3), primary image, sort, alt text |
| Shipping & payment integration points | Interfaces/stubs for Clover + EasyPost; real wiring in Phase 3 |
| Server-side validation & errors | Zod schemas shared client/server, centralized error responses |

### Phase 3 — Connect existing services (after Phase 2 verified)
**Step 0 (before any code): verify existing data.**
1. Inspect existing Supabase database — do products, categories, variants,
   orders still exist? Map their shape to the new Prisma schema.
2. Inspect existing Cloudinary account — do product images still exist?
   Record public IDs and URLs.
3. **Do not delete, overwrite, or modify** any existing Supabase or Cloudinary data.

Then (read-only first, then migrate):
- Switch Prisma datasource from SQLite → Supabase Postgres.
- Backfill/import verified data into the new schema (or adapt schema to fit
  existing tables if the client prefers to keep current structure).
- Wire Cloudinary for image upload + transformations (signed uploads,
  on-the-fly resizing/optimization).
- Wire Clover payments (hosted fields / iframe + server-side charge, webhooks).
- Wire EasyPost (rate shopping, label purchase, tracker webhooks).
- Wire transactional email (order confirmation, shipping, password reset).

### Phase 4 — Testing & deployment (after Phase 3)
- Full E2E test matrix (see §10).
- Deploy to a **separate Vercel preview URL**.
- Client review on preview.
- Only after written approval: point `angelsbeauties.shop` to the new build.

---

## 5. Proposed database schema (Prisma)

> Money is stored as **integer cents** (`*Cents Int`) — works identically on
> SQLite (dev) and Postgres (prod), avoids floating-point errors, and matches
> what payment processors expect. This is a deliberate deviation from a naive
> `Decimal` approach.

### 5.1 Auth & users
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String?              // null for OAuth-only users
  firstName       String?
  lastName        String?
  role            UserRole @default(CUSTOMER)
  status          UserStatus @default(ACTIVE)
  emailVerifiedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  addresses       Address[]
  orders          Order[]
  reviews         Review[]
  wishlistItems   WishlistItem[]
  cart            Cart?
}

enum UserRole   { CUSTOMER ADMIN SUPER_ADMIN }
enum UserStatus { ACTIVE SUSPENDED PENDING }

// NextAuth.js required tables
model Account            { /* OAuth accounts */ }
model Session            { /* DB sessions if used */ }
model VerificationToken  { /* email verify / reset */ }
```

### 5.2 Catalog
```prisma
model Category {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  imageId     String?                 // Cloudinary public id (Phase 3)
  imageUrl    String?
  parentId    String?
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  products    Product[]
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Product {
  id               String       @id @default(cuid())
  slug             String       @unique
  name             String
  shortDescription String?
  description      String?      // markdown
  categoryId       String
  category         Category     @relation(fields: [categoryId], references: [id])
  variants         ProductVariant[]
  images           ProductImage[]
  reviews          Review[]
  status           ProductStatus @default(DRAFT)
  isFeatured       Boolean      @default(false)
  isBestSeller     Boolean      @default(false)
  isTrending       Boolean      @default(false)
  sortOrder        Int          @default(0)
  // denormalized for fast filtering/sorting
  priceMinCents    Int?
  priceMaxCents    Int?
  ratingAvg        Float?       // 0–5
  ratingCount      Int          @default(0)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}
enum ProductStatus { DRAFT ACTIVE ARCHIVED }

model ProductVariant {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  sku             String   @unique
  name            String?                 // "30ml", "Shade: Rose"
  optionValues    String?                 // JSON string: {"size":"30ml","shade":"Rose"}
  priceCents      Int
  compareAtCents  Int?
  inventory       Inventory?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ProductImage {
  id                String  @id @default(cuid())
  productId         String
  product           Product @relation(fields: [productId], references: [id])
  cloudinaryPublicId String                 // Phase 3; local path in dev
  url               String
  altText           String?
  sortOrder         Int     @default(0)
  isPrimary         Boolean @default(false)
  createdAt         DateTime @default(now())
}

model Inventory {
  id                String  @id @default(cuid())
  variantId         String  @unique
  variant           ProductVariant @relation(fields: [variantId], references: [id])
  quantity          Int     @default(0)
  lowStockThreshold Int     @default(5)
  trackInventory    Boolean @default(true)
  updatedAt         DateTime @updatedAt
}
```

### 5.3 Shopping
```prisma
model Cart {
  id         String      @id @default(cuid())
  userId     String?     @unique
  sessionId  String?                 // anonymous cart
  items      CartItem[]
  couponCode String?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}
model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int
  @@unique([cartId, variantId])
}
model WishlistItem {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  @@unique([userId, productId])
}
```

### 5.4 Orders, shipping, payments
```prisma
model Order {
  id                 String   @id @default(cuid())
  orderNumber        String   @unique
  userId             String?
  user               User?    @relation(fields: [userId], references: [id])
  email              String                      // guest checkout email
  status             OrderStatus @default(PENDING)
  fulfillmentStatus  FulfillmentStatus @default(UNFULFILLED)
  paymentStatus      PaymentStatus @default(PENDING)
  subtotalCents      Int
  discountCents      Int      @default(0)
  shippingCents      Int      @default(0)
  taxCents           Int      @default(0)
  totalCents         Int
  currency           String   @default("USD")
  shippingAddressId  String?
  shippingAddress    Address? @relation("OrderShipping", fields: [shippingAddressId], references: [id])
  billingAddressId   String?
  billingAddress     Address? @relation("OrderBilling", fields: [billingAddressId], references: [id])
  items              OrderItem[]
  shipments          Shipment[]
  payments           Payment[]
  notes              String?
  placedAt           DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
enum OrderStatus        { PENDING CONFIRMED CANCELLED REFUNDED }
enum FulfillmentStatus  { UNFULFILLED PARTIAL FULFILLED }
enum PaymentStatus      { PENDING AUTHORIZED PAID PARTIALLY_PAID REFUNDED FAILED }

model OrderItem {
  id           String  @id @default(cuid())
  orderId      String
  order        Order   @relation(fields: [orderId], references: [id])
  variantId    String
  variant      ProductVariant @relation(fields: [variantId], references: [id])
  productId    String
  name         String                  // snapshot at purchase time
  sku          String                  // snapshot
  unitCents    Int
  quantity     Int
  lineCents    Int
  imageUrl     String?                 // snapshot
}

model Address {
  id         String  @id @default(cuid())
  userId     String?
  user       User?   @relation(fields: [userId], references: [id])
  firstName  String
  lastName   String
  line1      String
  line2      String?
  city       String
  state      String
  postalCode String
  country    String
  phone      String?
  isDefault  Boolean @default(false)
}

model Shipment {
  id                  String  @id @default(cuid())
  orderId             String
  order               Order   @relation(fields: [orderId], references: [id])
  carrier             String?
  trackingNumber      String?
  easypostShipmentId  String?
  easypostTrackerId   String?
  status              ShipmentStatus @default(LABEL_CREATED)
  labelUrl            String?
  estimatedDelivery   DateTime?
  shippedAt           DateTime?
  deliveredAt         DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
enum ShipmentStatus { LABEL_CREATED IN_TRANSIT OUT_FOR_DELIVERY DELIVERED RETURNED EXCEPTION }

model Payment {
  id              String        @id @default(cuid())
  orderId         String
  order           Order         @relation(fields: [orderId], references: [id])
  provider        PaymentProvider
  providerPaymentId String?                   // Clover payment id
  amountCents     Int
  currency        String        @default("USD")
  status          PaymentStatus
  raw             String?                     // JSON snapshot of provider response
  processedAt     DateTime?
  createdAt       DateTime      @default(now())
}
enum PaymentProvider { CLOVER }
```

### 5.5 Reviews, promotions, content, settings
```prisma
model Review {
  id                String  @id @default(cuid())
  productId         String
  product           Product @relation(fields: [productId], references: [id])
  userId            String?
  user              User?   @relation(fields: [userId], references: [id])
  authorName        String
  rating            Int                       // 1–5
  title             String?
  body              String
  status            ReviewStatus @default(PENDING)   // moderated
  isVerifiedPurchase Boolean @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
enum ReviewStatus { PENDING APPROVED REJECTED }

model Promotion {
  id            String  @id @default(cuid())
  code          String? @unique              // null = automatic
  name          String
  description   String?
  type          PromotionType
  value         Int                          // percent (0–100) or fixed cents
  isActive      Boolean @default(false)      // ★ must be authorized true to display
  authorizedBy  String?                      // admin user id
  startsAt      DateTime?
  endsAt        DateTime?
  usageLimit    Int?
  usageCount    Int     @default(0)
  appliesTo     ApplyScope @default(ALL)
  scopeJson     String?                      // JSON: {categoryIds:[], productIds:[]}
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
enum PromotionType { PERCENTAGE FIXED_AMOUNT FREE_SHIPPING }
enum ApplyScope    { ALL CATEGORY PRODUCT }

model Page {                // About, Contact, legal pages
  id            String  @id @default(cuid())
  slug          String  @unique
  title         String
  body          String                  // markdown
  seoTitle      String?
  seoDescription String?
  published     Boolean @default(false)
  updatedAt     DateTime @updatedAt
}

model StoreSetting {       // global key/value config
  id    String @id @default(cuid())
  key   String @unique
  value String
  updatedAt DateTime @updatedAt
}
```

---

## 6. Authentication & authorization

**Provider:** NextAuth.js v4.

- **Credentials provider** (email + password) for customers and admins.
  Passwords hashed with **bcrypt** (never stored or returned in plaintext).
- **Session strategy:** JWT (stateless) — best fit for Vercel serverless and
  the dev environment. Sessions carry `{ id, email, role }`.
- **Roles:** `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` (from `UserRole` enum).
- **Route protection:**
  - Middleware checks the JWT for `/account/*`, `/checkout`, `/admin/*`,
    and `/api/admin/*`.
  - Customer pages require `CUSTOMER+`.
  - Admin requires `ADMIN+`. Super-admin can manage other admins.
- **Account flows:** email verification, password reset (token via email),
  optional OAuth (Google) later if desired.
- **Admin provisioning:** the first admin is created via a secure,
  invite-only script (or env-seeded super-admin), never via a public
  sign-up form.

---

## 7. API structure

All backend logic is implemented as **Next.js Route Handlers** under
`/api/*` (App Router), server-side only. No client-side SDK calls to
third parties.

```
/api/auth/[...nextauth]        NextAuth handler
/api/products                  GET list (filter/sort/paginate)
/api/products/[slug]           GET one
/api/categories                GET tree
/api/categories/[slug]         GET one + products
/api/search?q=                 GET search
/api/cart                      GET/PATCH  (sync server cart)
/api/cart/items                POST       (add item)
/api/cart/items/[id]           PATCH/DELETE
/api/wishlist                  GET/POST/DELETE
/api/checkout                  POST       (create order + payment intent)
/api/orders                    GET        (customer's orders)
/api/orders/[id]               GET
/api/reviews                   POST       (submit, moderated)
/api/newsletter/subscribe      POST
/api/contact                   POST

/api/admin/products            GET/POST
/api/admin/products/[id]       GET/PATCH/DELETE
/api/admin/categories          GET/POST
/api/admin/orders              GET/PATCH (status)
/api/admin/orders/[id]         GET
/api/admin/customers           GET
/api/admin/inventory           PATCH
/api/admin/images/upload       POST       (→ Cloudinary in Phase 3)
/api/admin/promotions          CRUD
/api/admin/reviews             PATCH (approve/reject)

/api/webhooks/clover           POST       (payment events)
/api/webhooks/easypost         POST       (tracking events)
```

**Conventions:**
- All mutations validated with **Zod** schemas shared between client and server.
- Consistent JSON error shape: `{ error: { code, message, fields? } }`.
- All write endpoints require a valid session + CSRF where applicable.
- Rate limiting on auth + public write endpoints (newsletter, contact, reviews).

---

## 8. Integration strategy (Phase 3)

| Service | Approach | Data safety |
|---|---|---|
| **Supabase (Postgres)** | Switch Prisma datasource to Supabase connection string. **Read-only audit first**: list tables, compare to schema §5, decide import-vs-adapt. | No destructive ops. Take a backup snapshot before any write migration. Use a separate dev Supabase project if the client allows, else a dev schema. |
| **Cloudinary** | Signed uploads from server only. Store `cloudinaryPublicId` + transformed URL. On-the-fly transformations for product gallery sizes. | Verify existing image assets exist before reuse. Never delete existing assets without explicit approval. |
| **Clover** | Clover hosted card fields (iframe) → token → server-side charge via Clover REST API. Webhook updates payment status. | Test mode / sandbox credentials until production cutover. |
| **EasyPost** | Server-side rate shopping at checkout, label purchase on fulfillment, tracker webhooks for status updates. | Sandbox API key for dev. |
| **Email** | Transactional provider (TBD — e.g., Resend/SendGrid). Templates for order confirmation, shipping update, password reset, welcome. | Double opt-in for newsletter. |
| **Vercel** | Deploy preview per branch. Production deploy only after written approval. `angelsbeauties.shop` DNS pointed only at approval. | Preview URLs are isolated; no impact on live domain. |

**Phase 3 verification checklist (before wiring):**
1. Supabase: confirm products, categories, variants, orders data presence + shape.
2. Cloudinary: confirm product image assets + public IDs.
3. Record findings; present to client before any migration code runs.

---

## 9. Demo content → production migration plan

**Confirmation:** All current demo content and temporary functionality **will be
replaced** with production-ready implementations. Specifically:

| Demo (now) | Production (Phase 2/3) |
|---|---|
| Demo products, prices, categories in `src/lib/demo-data.ts` | Real products/categories/variants from Supabase, served via `/api/products` |
| 22 AI-generated placeholder images in `/public/images/*` | Real product photography from Cloudinary (existing assets reused after verification) |
| Demo testimonials (Sarah/Emily/Olivia) | Real moderated customer reviews from the `Review` table (approved only) |
| In-memory cart/wishlist store (non-persisted) | Server-side `Cart`/`CartItem`/`WishlistItem` tables tied to user accounts |
| Newsletter "subscribe" setTimeout stub | Real transactional email provider + subscriber persistence |
| Static "Add to Cart" that only updates a badge | Real cart API, inventory checks, persistence |
| **40% OFF sale banner** (see §11) | Admin-managed `Promotion` with `isActive` + `authorizedBy` flags |
| Initial-letter testimonial avatars | Real customer photos (with consent) or omitted |
| No real checkout | Clover-integrated checkout with real payment + EasyPost shipping |

The `DemoBadge` component and the dashed "Demo Content" tags are **temporary
scaffolding** and will be removed once real data flows in.

---

## 10. Phase 4 testing matrix

| Area | Tests |
|---|---|
| Product browsing | Listing, pagination, category drill-down, product detail |
| Search & filtering | Query, facets (category/price/rating), sort, empty states |
| Cart | Add/update/remove, qty, totals, persistence across login |
| Checkout | Shipping address, rates, payment, order creation, confirmation |
| Payments | Clover sandbox auth + capture, webhook status sync, refunds |
| Shipping | EasyPost rate fetch, label purchase, tracking webhook |
| Admin login | Role guard, super-admin invite flow, blocked customer access |
| Image uploads | Admin product image upload, primary/secondary, alt text |
| Product editing | Create/edit/variant/inventory, publish/draft |
| Order management | View, status transitions, fulfillment, refunds |
| Mobile | Full flow on 390px viewport |
| Security | Auth, CSRF, input validation, rate limits, no secrets to client |
| Performance | Image optimization, lazy load, query indexing, cache headers |

---

## 11. The 40% OFF banner — demo content confirmation

**Confirmed: the "Glow Up This Season — Up to 40% OFF" banner is DEMO content.**

- It is currently a static promotional block hardcoded in the homepage for
  visual reference only.
- It does **not** represent a real offer and will **not** appear as a real
  offer unless you explicitly authorize it.
- In production, all promotions are governed by the `Promotion` table
  (§5.5), which requires:
  - `isActive = true`
  - an `authorizedBy` value (the admin who enabled it)
  - optional `startsAt` / `endsAt` scheduling
  - optional `usageLimit`
- No promotional banner will be displayed on the live site unless a real,
  authorized promotion record exists and is active within its date window.

---

## 12. Approvals needed before proceeding

1. **Homepage design** — approve as-is, or approve with the visual corrections
   listed in the QC comparison (provided separately in chat).
2. **This architecture document** — approve the stack, roadmap, schema, auth,
   API, and integration strategy.
3. **Phase 3 data verification** — authorize read-only inspection of the
   existing Supabase + Cloudinary accounts before any integration code.

No development beyond the homepage will begin until items 1 and 2 are approved.
