#!/usr/bin/env bash
# test-restore.sh — Weekly automated restore drill for CompuTrain
#
# Finds the most recent backup in S3, restores it to the test DB,
# runs a sanity query, and posts PASS/FAIL to Slack.
#
# Required environment variables (same as restore-db.sh, plus):
#   S3_BACKUP_BUCKET
#   SLACK_WEBHOOK_URL
#   RESTORE_DB_NAME
#   PGHOST, PGPORT, PGUSER, PGPASSWORD

set -uo pipefail   # do NOT set -e — we want to capture failures ourselves

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ts()  { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
log() { echo "[$(ts)] $*"; }

# ── validate env ─────────────────────────────────────────────────────────────
for var in S3_BACKUP_BUCKET SLACK_WEBHOOK_URL RESTORE_DB_NAME \
           PGHOST PGPORT PGUSER PGPASSWORD; do
  [[ -n "${!var:-}" ]] || { log "ERROR: $var is not set." >&2; exit 1; }
done

RESULT="FAIL"
DETAIL=""
S3_PATH=""

# ── find latest backup ────────────────────────────────────────────────────────
log "Listing backups in s3://$S3_BACKUP_BUCKET/db-backups/"
S3_PATH=$(aws s3 ls "s3://$S3_BACKUP_BUCKET/db-backups/" --recursive \
  | grep '\.sql\.gz$' \
  | sort \
  | tail -n 1 \
  | awk '{print $4}')

if [[ -z "$S3_PATH" ]]; then
  DETAIL="No backup files found in s3://$S3_BACKUP_BUCKET/db-backups/"
  log "ERROR: $DETAIL"
else
  S3_FULL="s3://$S3_BACKUP_BUCKET/$S3_PATH"
  log "Latest backup: $S3_FULL"

  # ── run restore ────────────────────────────────────────────────────────────
  if bash "$SCRIPT_DIR/restore-db.sh" "$S3_FULL"; then
    log "Restore completed. Running sanity query..."

    # sanity: every key table must have at least one row
    SANITY=$(PGPASSWORD="$PGPASSWORD" psql \
      --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
      --dbname="$RESTORE_DB_NAME" --no-password --tuples-only \
      --command="
        SELECT
          (SELECT COUNT(*) FROM users)       > 0 AND
          (SELECT COUNT(*) FROM centers)     > 0 AND
          (SELECT COUNT(*) FROM enrollments) > 0
        AS sanity_ok;
      " 2>&1)

    if echo "$SANITY" | grep -q 't'; then
      RESULT="PASS"
      DETAIL="Restore drill succeeded. Backup: $S3_FULL"
      log "Sanity check PASSED."
    else
      DETAIL="Restore completed but sanity query returned false. Output: $SANITY"
      log "ERROR: $DETAIL"
    fi
  else
    DETAIL="restore-db.sh exited non-zero for $S3_FULL"
    log "ERROR: $DETAIL"
  fi
fi

# ── slack notification ────────────────────────────────────────────────────────
ICON=":white_check_mark:"
[[ "$RESULT" == "FAIL" ]] && ICON=":red_circle:"

PAYLOAD=$(printf '{"text":"%s *CompuTrain DB Restore Drill — %s*\n%s\nTimestamp: %s"}' \
  "$ICON" "$RESULT" "$DETAIL" "$(ts)")

HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' \
  -X POST -H 'Content-type: application/json' \
  --data "$PAYLOAD" \
  "$SLACK_WEBHOOK_URL")

if [[ "$HTTP_CODE" == "200" ]]; then
  log "Slack notification sent (HTTP $HTTP_CODE)."
else
  log "WARNING: Slack webhook returned HTTP $HTTP_CODE."
fi

# ── exit code ─────────────────────────────────────────────────────────────────
if [[ "$RESULT" == "PASS" ]]; then
  log "Restore drill PASSED."
  exit 0
else
  log "Restore drill FAILED: $DETAIL" >&2
  exit 1
fi
