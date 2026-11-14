#!/usr/bin/env bash
# ============================================================================
#  Angels Beauty — reproducible local PostgreSQL 17 dev database setup
# ----------------------------------------------------------------------------
#  Runs WITHOUT root. Installs PostgreSQL 17 into ~/pg, initializes a data
#  directory in ~/pgdata, starts the server on port 5433 (localhost only),
#  and creates the `angels_dev` database.
#
#  Idempotent: safe to re-run; skips steps already completed.
#
#  Why this exists: the sandbox environment may be reset, wiping ~/pg and
#  ~/pgdata. This script recreates the isolated dev DB from scratch. The
#  schema itself lives in prisma/schema.prisma + prisma/migrations/ (which
#  persist in the project repo), so after running this script + `prisma
#  migrate deploy`, the dev DB is fully restored. See dev-db-restore.sh to
#  reload a data backup.
# ============================================================================
set -euo pipefail

PGBIN_DIR="$HOME/pg"
PGDATA="$HOME/pgdata"
PORT=5433
PGUSER="angels"
DBNAME="angels_dev"

echo "★ Angels Beauty dev PostgreSQL setup (no root, isolated)"

# 1. Binaries
if [ -x "$PGBIN_DIR/usr/lib/postgresql/17/bin/postgres" ]; then
  echo "  • Postgres binaries already present at $PGBIN_DIR"
else
  echo "  • Downloading PostgreSQL 17 packages (no root)…"
  TMP="$(mktemp -d)"
  ( cd "$TMP" && apt-get download \
      postgresql-17 postgresql-client-17 \
      postgresql-common postgresql-client-common )
  mkdir -p "$PGBIN_DIR"
  for d in "$TMP"/*.deb; do dpkg-deb -x "$d" "$PGBIN_DIR"; done
  rm -rf "$TMP"
fi
PGBIN="$PGBIN_DIR/usr/lib/postgresql/17/bin"

# 2. Data directory
if [ -d "$PGDATA" ] && [ -f "$PGDATA/PG_VERSION" ]; then
  echo "  • Data directory already initialized at $PGDATA"
else
  echo "  • Initializing data directory at $PGDATA…"
  rm -rf "$PGDATA"
  "$PGBIN/initdb" -D "$PGDATA" -U "$PGUSER" \
    --auth-local=trust --auth-host=trust \
    --encoding=UTF8 --locale=C
  cat >> "$PGDATA/postgresql.conf" <<EOF

# Angels Beauty dev overrides
port = $PORT
listen_addresses = 'localhost'
unix_socket_directories = '/tmp'
max_connections = 50
shared_buffers = 128MB
jit = off
EOF
fi

# 3. Start
if "$PGBIN/pg_isready" -p "$PORT" -h localhost >/dev/null 2>&1; then
  echo "  • Server already running on port $PORT"
else
  echo "  • Starting server on port $PORT…"
  "$PGBIN/pg_ctl" -D "$PGDATA" -l "$PGDATA/server.log" -w -t 30 start
fi

# 4. Database
if "$PGBIN/psql" -p "$PORT" -h localhost -U "$PGUSER" -lqt | cut -d'|' -f1 | grep -qx "$DBNAME"; then
  echo "  • Database $DBNAME already exists"
else
  echo "  • Creating database $DBNAME…"
  "$PGBIN/createdb" -p "$PORT" -h localhost -U "$PGUSER" "$DBNAME"
fi

echo ""
echo "✔ Dev PostgreSQL ready:"
echo "    host=localhost port=$PORT user=$PGUSER db=$DBNAME auth=trust"
echo "    DATABASE_URL=postgresql://$PGUSER@localhost:$PORT/$DBNAME?schema=public"
echo ""
echo "Next: from the project root, run:"
echo "    bunx prisma migrate deploy   # apply migrations"
echo "    # optionally: bash scripts/dev-db-restore.sh <backup.sql.gz>  # reload data"
