#!/usr/bin/env bash
# backup-db.sh — Daily PostgreSQL backup for CompuTrain
# Dumps the database, uploads to S3, then removes the local file.
#
# Required environment variables:
#   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
#   S3_BACKUP_BUCKET
# Optional:
#   BACKUP_DIR  (default: /backups/db)

set -euo pipefail

# ── helpers ──────────────────────────────────────────────────────────────────
ts()  { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
log() { echo "[$(ts)] $*"; }
die() { log "ERROR: $*" >&2; exit 1; }

# ── validate env ─────────────────────────────────────────────────────────────
for var in PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE S3_BACKUP_BUCKET; do
  [[ -n "${!var:-}" ]] || die "Environment variable $var is not set."
done

BACKUP_DIR="${BACKUP_DIR:-/backups/db}"
mkdir -p "$BACKUP_DIR"

# ── file paths ────────────────────────────────────────────────────────────────
DATE_PATH="$(date -u '+%Y/%m/%d')"
FILENAME="${PGDATABASE}_$(date -u '+%Y%m%d_%H%M%S').sql.gz"
LOCAL_FILE="$BACKUP_DIR/$FILENAME"
S3_KEY="db-backups/$DATE_PATH/$FILENAME"
S3_URI="s3://$S3_BACKUP_BUCKET/$S3_KEY"

# ── dump ──────────────────────────────────────────────────────────────────────
log "Starting backup of '$PGDATABASE' → $LOCAL_FILE"

PGPASSWORD="$PGPASSWORD" pg_dump \
  --host="$PGHOST" \
  --port="$PGPORT" \
  --username="$PGUSER" \
  --no-password \
  --format=plain \
  "$PGDATABASE" \
  | gzip -9 > "$LOCAL_FILE" \
  || die "pg_dump failed."

BYTES=$(stat -c '%s' "$LOCAL_FILE" 2>/dev/null || stat -f '%z' "$LOCAL_FILE")
log "Dump complete. Size: $BYTES bytes."

# ── upload ────────────────────────────────────────────────────────────────────
log "Uploading to $S3_URI"
aws s3 cp "$LOCAL_FILE" "$S3_URI" \
  --storage-class STANDARD_IA \
  || die "S3 upload failed."

# ── cleanup ───────────────────────────────────────────────────────────────────
rm -f "$LOCAL_FILE"
log "Local file removed."

log "SUCCESS: backup uploaded to $S3_URI"
