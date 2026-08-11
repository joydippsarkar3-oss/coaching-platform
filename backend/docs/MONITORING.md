# Monitoring Setup — CompuTrain Backend

## Sentry Error Tracking

### 1. Create a Sentry project

1. Go to [sentry.io](https://sentry.io) and sign in (or create a free account).
2. Click **Projects → Create Project**.
3. Select **Node.js** as the platform.
4. Name the project (e.g. `computrain-backend`) and choose your team.
5. Click **Create Project**.

### 2. Copy the DSN

After creation, Sentry shows a DSN on the "Getting Started" page. It looks like:

```
https://abc123xyz@o123456.ingest.sentry.io/789012
```

Copy it.

### 3. Set the environment variable

In your production environment (server, Docker, CI/CD secret store):

```
SENTRY_DSN=https://abc123xyz@o123456.ingest.sentry.io/789012
```

In `.env.example` the key is already present as a reminder. Never commit a real DSN to version control.

### 4. Deploy

`initSentry()` is called at process start in `src/main.ts`. Errors with HTTP status >= 500 are captured automatically by `GlobalExceptionFilter`. No further code changes are needed.

---

## UptimeRobot Free-Tier Setup

UptimeRobot's free tier supports up to 50 monitors, checked every 5 minutes.

### Steps

1. Create an account at [uptimerobot.com](https://uptimerobot.com).
2. Click **Add New Monitor**.
3. Fill in the form:

   | Field | Value |
   |---|---|
   | Monitor Type | HTTP(s) |
   | Friendly Name | CompuTrain API Health |
   | URL | `https://api.{domain}/health` |
   | Monitoring Interval | 5 minutes |

4. Click **Create Monitor**.

### Alert contacts

1. Go to **My Settings → Alert Contacts**.
2. Click **Add Alert Contact**.
3. Choose **E-mail**, enter the on-call address, save.
4. Back in the monitor settings, add that contact under **Alert Contacts** so it receives down/up notifications.

---

## Key Metrics to Watch

### Error rate (Sentry)

- **Dashboard → Issues**: watch the volume of new issues and regressions after each deploy.
- Set a **Sentry Alert Rule**: `error.rate > 1%` over 5 minutes → email/Slack.
- Spike in 500s after a deploy is the primary signal to roll back.

### p95 Latency

- Enable **Sentry Performance** (already configured via `tracesSampleRate: 0.1`).
- **Performance → Transactions**: sort by p95. Target < 500 ms for API calls.
- Flag any transaction regularly exceeding 2 s for optimisation.

### Memory

- Monitor Node.js heap via the host's metrics (PM2 `pm2 monit`, Docker stats, or a cloud provider dashboard).
- Heap consistently above ~80 % of the container limit indicates a memory leak.
- Restart policy should be configured to auto-restart on OOM.

### Database connection pool

- Prisma uses a fixed connection pool (default: `connection_limit` in `DATABASE_URL`).
- Watch for `Timed out fetching a connection from the connection pool` errors in Sentry — this means the pool is saturated.
- Typical fix: increase `connection_limit` in `DATABASE_URL` or reduce query latency.
- Example `DATABASE_URL` with explicit pool size:
  ```
  postgresql://user:pass@host:5432/db?schema=public&connection_limit=10
  ```
