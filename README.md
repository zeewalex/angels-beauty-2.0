# Angels Beauty 2.0

Premium skincare, makeup, and beauty essentials e-commerce platform built with Next.js 16, TypeScript, Tailwind CSS, Prisma (PostgreSQL), and shadcn/ui.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js v4 (JWT strategy)
- **State:** Zustand (client) + TanStack Query (server)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 20+ / Bun
- PostgreSQL 14+ (local or cloud)

### Setup

1. **Clone and install:**
   ```bash
   bun install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Fill in your values — generate secrets with:
   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Set up the database:**
   ```bash
   bunx prisma migrate deploy   # apply migrations
   bunx prisma generate         # generate client
   bun run scripts/seed-catalog.ts   # seed products
   bun run scripts/seed-content.ts   # seed FAQs/pages
   ```

4. **Start the dev server:**
   ```bash
   bun run dev
   ```

5. **Open** http://localhost:3000

## Admin Access

The admin dashboard uses a **five-tap logo shortcut** — tap the Angels Beauty logo 5 times within 3 seconds on any storefront page.

- **First time:** Enter admin email + PIN at `/admin-login` to trust your device
- **After enrollment:** Five taps go directly to `/admin` (no password, no PIN)
- **Trusted device lasts 90 days**, then re-enrollment is required
- **Manage devices:** `/admin/devices` (revoke access instantly)

## Key Features

- Animated announcement bar (admin-editable via `/admin/announcements`)
- Shop with 72 products across 11 categories
- Product detail pages with gallery and purchase panel
- Cart and checkout with coupon support
- Trusted-device admin access with DB-backed revocation
- Rate-limited enrollment (atomic, race-safe)
- Cron cleanup for expired rate-limit buckets

## Project Structure

```
src/
  app/           # Next.js App Router pages + API routes
  components/    # React components (site/, ui/)
  lib/           # Shared utilities (auth, db, session, etc.)
  hooks/         # Custom React hooks
prisma/          # Schema + migrations
scripts/         # Seed scripts + test utilities
docs/            # Migration safety + IP extraction docs
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | JWT signing secret (32+ chars) |
| `ADMIN_PIN` | 6-digit PIN for trusted-device enrollment |
| `ADMIN_TRUST_SECRET` | HMAC key for trusted-device tokens (48+ chars) |
| `CRON_SECRET` | Auth for the hourly rate-limit cleanup cron |

## Testing

```bash
bun run lint          # ESLint
bun run build         # Production build
```

## License

Proprietary. All rights reserved.
