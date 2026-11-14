#!/usr/bin/env bash
# ============================================================================
#  Angels Beauty — dev database backup (pg_dump)
# ----------------------------------------------------------------------------
#  Dumps the `angels_dev` Postgres dev database to a gzipped SQL file in
#  db/backups/. Run periodically or before risky changes.
#
#  NOTE on persistence: the dev DB itself does NOT survive a full sandbox
#  reset. The schema + migrations (in the repo) always survive. This backup
#  captures any seed/demo/dev data so it can be restored after a reset.
#  For real safety, copy the generated backup OUT of the sandbox (e.g. commit
#  it, or download it) if you need it to survive an environment reset.
# ============================================================================
set -euo pipefail

PGBIN="$HOME/pg/usr/lib/postgresql/17/bin"
PORT=5433
PGUSER="angels"
DBNAME="angels_dev"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/db/backups"
mkdir -p "$OUT_DIR"

STAMP="$(date +%Y%m%d%H%M%S)"
OUT="$OUT_DIR/angels_dev_${STAMP}.sql.gz"

if ! "$PGBIN/pg_isready" -p "$PORT" -h localhost >/dev/null 2>&1; then
  echo "✗ Postgres not running on port $PORT. Start it with scripts/setup-dev-postgres.sh"
  exit 1
fi

echo "★ Backing up $DBNAME → $OUT"
"$PGBIN/pg_dump" -p "$PORT" -h localhost -U "$PGUSER" -d "$DBNAME" --no-owner --no-privileges | gzip > "$OUT"
SIZE="$(du -h "$OUT" | cut -f1)"
echo "✔ Backup complete ($SIZE)"
echo ""
echo "To restore after a reset:"
echo "    bash scripts/setup-dev-postgres.sh        # recreate the server + empty db"
echo "    bunx prisma migrate deploy               # recreate schema"
echo "    bash scripts/dev-db-restore.sh \"$OUT\"   # reload data"
