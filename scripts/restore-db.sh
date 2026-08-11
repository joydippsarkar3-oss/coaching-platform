#!/usr/bin/env bash
# restore-db.sh — Restore a CompuTrain PostgreSQL backup from S3
#
# Usage:
#   restore-db.sh <s3-path>
#   e.g.  restore-db.sh s3://my-bucket/db-backups/2026/08/11/mydb_20260811_020001.sql.gz
#
# Required environment variables:
#   PGHOST, PGPORT, PGUSER, PGPASSWORD
#   RESTORE_DB_NAME   — target DB (must NOT be production)

set -euo pipefail

ts()  { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
log() { echo "[$(ts)] $*"; }
die() { log "ERROR: $*" >&2; exit 1; }

# ── args & env ────────────────────────────────────────────────────────────────
[[ $# -ge 1 ]] || die "Usage: $0 <s3-path-to-backup>"
S3_PATH="$1"

for var in PGHOST PGPORT PGUSER PGPASSWORD RESTORE_DB_NAME; do
  [[ -n "${!var:-}" ]] || die "Environment variable $var is not set."
done

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

FILENAME=$(basename "$S3_PATH")
LOCAL_GZ="$WORK_DIR/$FILENAME"
LOCAL_SQL="$WORK_DIR/${FILENAME%.gz}"

# ── download ──────────────────────────────────────────────────────────────────
log "Downloading $S3_PATH"
aws s3 cp "$S3_PATH" "$LOCAL_GZ" || die "S3 download failed."

# ── decompress ────────────────────────────────────────────────────────────────
log "Decompressing $FILENAME"
gunzip "$LOCAL_GZ" || die "Decompression failed."

# ── (re-)create target DB ─────────────────────────────────────────────────────
log "Recreating database '$RESTORE_DB_NAME'"
PGPASSWORD="$PGPASSWORD" psql \
  --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
  --dbname=postgres \
  --no-password \
  -c "DROP DATABASE IF EXISTS \"$RESTORE_DB_NAME\";" \
  || die "DROP DATABASE failed."

PGPASSWORD="$PGPASSWORD" psql \
  --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
  --dbname=postgres \
  --no-password \
  -c "CREATE DATABASE \"$RESTORE_DB_NAME\";" \
  || die "CREATE DATABASE failed."

# ── restore ───────────────────────────────────────────────────────────────────
log "Restoring into '$RESTORE_DB_NAME'"
PGPASSWORD="$PGPASSWORD" psql \
  --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
  --dbname="$RESTORE_DB_NAME" \
  --no-password \
  --file="$LOCAL_SQL" \
  || die "psql restore failed."

# ── integrity row counts ──────────────────────────────────────────────────────
log "Row counts after restore:"
PGPASSWORD="$PGPASSWORD" psql \
  --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
  --dbname="$RESTORE_DB_NAME" \
  --no-password \
  --tuples-only \
  --command="
    SELECT 'users'       AS table_name, COUNT(*) AS rows FROM users
    UNION ALL
    SELECT 'centers',                   COUNT(*)         FROM centers
    UNION ALL
    SELECT 'enrollments',               COUNT(*)         FROM enrollments
    UNION ALL
    SELECT 'payments',                  COUNT(*)         FROM payments
    ORDER BY table_name;
  " || die "Row count query failed."

log "SUCCESS: restore of $S3_PATH completed into '$RESTORE_DB_NAME'"
