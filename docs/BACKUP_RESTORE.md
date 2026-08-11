# Database Backup & Restore — CompuTrain

## Overview

| Target | Value |
|--------|-------|
| RPO (Recovery Point Objective) | 24 hours |
| RTO (Recovery Time Objective) | 4 hours |
| Backup schedule | Daily at 02:00 UTC |
| Restore drill | Weekly (automated) |
| Storage | S3 (STANDARD_IA), path `db-backups/YYYY/MM/DD/` |

---

## Setup

### 1. S3 Bucket

Create a bucket dedicated to backups and enable versioning:

```bash
aws s3api create-bucket \
  --bucket computrain-db-backups \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket computrain-db-backups \
  --versioning-configuration Status=Enabled
```

Add a lifecycle rule to expire objects older than 90 days:

```json
{
  "Rules": [{
    "ID": "expire-old-backups",
    "Status": "Enabled",
    "Filter": { "Prefix": "db-backups/" },
    "Expiration": { "Days": 90 }
  }]
}
```

### 2. IAM Policy

Attach the following policy to the IAM user or role used by the backup job:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BackupWrite",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::computrain-db-backups",
        "arn:aws:s3:::computrain-db-backups/*"
      ]
    }
  ]
}
```

### 3. GitHub Actions Secrets

Set the following secrets in the repository (Settings → Secrets → Actions):

| Secret | Description |
|--------|-------------|
| `PGHOST` | PostgreSQL host |
| `PGPORT` | PostgreSQL port (usually `5432`) |
| `PGUSER` | Database user |
| `PGPASSWORD` | Database password |
| `PGDATABASE` | Database name to back up |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `S3_BACKUP_BUCKET` | Bucket name (e.g. `computrain-db-backups`) |
| `SLACK_WEBHOOK_URL` | Incoming webhook URL for failure alerts |

### 4. Optional: Local / Server Cron

To run the backup outside GitHub Actions (e.g. on the database server itself):

```cron
# /etc/cron.d/computrain-backup
0 2 * * * postgres /opt/computrain/scripts/backup-db.sh >> /var/log/computrain-backup.log 2>&1
```

Export the required environment variables in the cron environment or in a sourced `.env` file before calling the script.

---

## Manual Backup

```bash
export PGHOST=... PGPORT=5432 PGUSER=... PGPASSWORD=... PGDATABASE=...
export S3_BACKUP_BUCKET=computrain-db-backups

bash scripts/backup-db.sh
```

---

## Restore Drill Steps

### Prerequisites

- A running PostgreSQL instance reachable as `$PGHOST`
- A **separate** restore target database (never restore over production)
- AWS credentials with `s3:GetObject` on the bucket

### 1. Set environment variables

```bash
export PGHOST=restore-host
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=...
export RESTORE_DB_NAME=computrain_restore
export S3_BACKUP_BUCKET=computrain-db-backups
```

### 2. Find the backup to restore

```bash
# List available backups, most recent last
aws s3 ls s3://computrain-db-backups/db-backups/ --recursive \
  | grep '\.sql\.gz$' | sort
```

### 3. Run the restore

```bash
bash scripts/restore-db.sh \
  s3://computrain-db-backups/db-backups/2026/08/11/computrain_20260811_020001.sql.gz
```

The script will:
1. Download the file from S3 to a temporary directory
2. Decompress it
3. Drop and recreate `$RESTORE_DB_NAME`
4. Run `psql` to load the dump
5. Print row counts for `users`, `centers`, `enrollments`, and `payments`

### 4. Verify

Inspect the row counts printed at the end. Cross-check with production if possible:

```bash
psql -h $PGHOST -U $PGUSER -d $RESTORE_DB_NAME \
  -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;"
```

### 5. Cleanup

Drop the restore database when verification is complete:

```bash
psql -h $PGHOST -U $PGUSER -d postgres \
  -c "DROP DATABASE IF EXISTS \"$RESTORE_DB_NAME\";"
```

---

## Automated Weekly Restore Test

`scripts/test-restore.sh` is designed to run on a weekly cron or CI schedule. It:

1. Finds the most recent backup in S3
2. Calls `restore-db.sh`
3. Runs a boolean sanity query (users, centers, enrollments all have rows)
4. Posts PASS or FAIL to the Slack webhook

Example cron (weekly, Sundays at 03:00 UTC):

```cron
0 3 * * 0 postgres /opt/computrain/scripts/test-restore.sh >> /var/log/computrain-restore-test.log 2>&1
```

---

## RTO / RPO Details

**RPO — 24 hours**
A backup is taken every day at 02:00 UTC. In the worst case (failure immediately before the next backup), up to 24 hours of data may be lost.

**RTO — 4 hours**
The restore procedure (download, decompress, `psql` load, verification) is expected to complete within 4 hours for a database up to ~50 GB on a standard instance. For larger databases, provision additional IOPS or a faster instance type and re-validate the target.

To reduce RTO further, consider:
- Keeping a warm standby replica (PostgreSQL streaming replication)
- Using `pg_restore` with `--jobs` for parallel restore of custom-format dumps
- Pre-staging the latest backup on the restore host during the nightly backup run

---

## Troubleshooting

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| `pg_dump: error: connection failed` | Wrong host/port/credentials | Check `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` |
| `aws s3 cp` exits non-zero | Missing IAM permissions or wrong bucket name | Verify IAM policy and `S3_BACKUP_BUCKET` |
| Restore fails with `role does not exist` | Dump references roles not present on restore host | Add `--no-owner --no-acl` to `pg_dump` flags in `backup-db.sh` |
| Sanity query returns false | Tables empty — schema restored but data missing | Check for errors earlier in the `psql` output |
| Slack webhook returns non-200 | Webhook URL expired or revoked | Rotate `SLACK_WEBHOOK_URL` in GitHub Secrets |
