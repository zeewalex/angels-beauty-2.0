# Migration Safety Guide

## Overview

This project uses Prisma Migrate with a clean, reproducible migration
history. There are two migrations:

1. `20261120092237_initial_baseline` — creates the complete schema (all
   13 enums, 30 tables, indexes, foreign keys, constraints).
2. `20261120092329_add_rate_limit_bucket` — adds the `RateLimitBucket`
   table for persistent rate limiting.

## Migration behavior by database state

### Case A: Fresh, empty database (STAGING)

**Safe to apply.** Run `prisma migrate deploy`. Both migrations apply
in order. All tables, enums, and indexes are created. No data exists
to lose. This is the intended path for staging deployment.

### Case B: Existing database WITH an established Prisma baseline

If the database already has a `_prisma_migrations` table recording that
`20261120092237_initial_baseline` was applied, then `prisma migrate
deploy` will apply only the pending `add_rate_limit_bucket` migration.
Existing data is preserved — the migration is additive (CREATE TABLE +
CREATE INDEX only, no ALTER or DROP on existing tables).

### Case C: Existing database WITHOUT a Prisma migration history

**NOT safe to apply blindly.** If the database has tables and data but
no `_prisma_migrations` table (or a different migration history), running
`prisma migrate deploy` will attempt to create tables that already exist,
causing errors. Running `prisma migrate reset` would DROP all data.

For an existing database without a baseline, you MUST:
1. Inspect the existing schema against `prisma/schema.prisma`.
2. Reconcile the migration history (e.g., manually mark the baseline
   migration as applied via `prisma migrate resolve --applied
   20261120092237_initial_baseline` after verifying schema match).
3. Have a separately reviewed migration plan.

**Do NOT run `prisma db push` against an existing database with data.**
`db push` does not create migration history and can silently alter the
schema in ways that lose data.

### Case D: Production database

**Do NOT run any migrations against production without a separately
reviewed migration plan.** Production Supabase is not connected to
staging or dev. Production migrations require:
- A full backup.
- A reviewed migration plan.
- A maintenance window.
- Rollback procedures.

## Deployment procedure for staging

```bash
# 1. Ensure the staging database is empty (freshly provisioned).
psql -h <staging-host> -U <user> -d <staging-db> -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
# Expected: 0 (empty database)

# 2. Apply migrations
npx prisma migrate deploy

# 3. Verify
npx prisma migrate status
# Expected: all migrations applied, database in sync

# 4. Seed admin user and catalog (staging-only)
bun scripts/seed-catalog.ts
bun scripts/seed-content.ts
# Admin user is created via a separate script (see deployment runbook)
```

## Files

- `prisma/schema.prisma` — the source of truth for the schema
- `prisma/migrations/` — the migration history (committed to Git)
- `prisma/migrations/migration_lock.toml` — locks the provider to
  `postgresql`
