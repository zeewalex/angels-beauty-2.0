#!/usr/bin/env bash
# ============================================================================
#  Angels Beauty — dev database restore (from a pg_dump backup)
# ----------------------------------------------------------------------------
#  Restores a gzipped SQL backup produced by dev-db-backup.sh into the
#  `angels_dev` Postgres dev database. Assumes the server is running and the
#  schema already exists (run setup-dev-postgres.sh + `prisma migrate deploy`
#  first if starting from scratch).
#
#  Usage: bash scripts/dev-db-restore.sh <backup.sql.gz>
# ============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: bash scripts/dev-db-restore.sh <backup.sql.gz>"
  exit 1
fi
BACKUP="$1"
if [ ! -f "$BACKUP" ]; then
  echo "✗ Backup file not found: $BACKUP"
  exit 1
fi

PGBIN="$HOME/pg/usr/lib/postgresql/17/bin"
PORT=5433
PGUSER="angels"
DBNAME="angels_dev"

if ! "$PGBIN/pg_isready" -p "$PORT" -h localhost >/dev/null 2>&1; then
  echo "✗ Postgres not running. Start it with scripts/setup-dev-postgres.sh"
  exit 1
fi

echo "★ Restoring $BACKUP → $DBNAME"
# Drop & recreate so the restore is clean (dev only).
"$PGBIN/dropdb"   --if-exists -p "$PORT" -h localhost -U "$PGUSER" "$DBNAME"
"$PGBIN/createdb"              -p "$PORT" -h localhost -U "$PGUSER" "$DBNAME"
gunzip -c "$BACKUP" | "$PGBIN/psql" -p "$PORT" -h localhost -U "$PGUSER" -d "$DBNAME" -v ON_ERROR_STOP=0 >/dev/null
echo "✔ Restore complete. Verifying…"
"$PGBIN/psql" -p "$PORT" -h localhost -U "$PGUSER" -d "$DBNAME" -c "SELECT count(*) AS table_count FROM information_schema.tables WHERE table_schema='public';"
