# Franchise Training Platform — Backend

NestJS + Prisma + PostgreSQL backend for the franchise computer/vocational training platform.

---

## Tech stack

- **NestJS 10** — framework
- **Prisma 5** — ORM + migration runner
- **PostgreSQL 16** — primary database
- **Redis 7** — queue broker (BullMQ) and cache
- **Passport / JWT** — authentication
- **Swagger** — OpenAPI docs at `/api/docs`

---

## Prerequisites

- Node.js >= 20
- Docker and Docker Compose (for local dev database)
- npm >= 10

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd engineering/backend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all required values. At minimum for local dev:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/franchise_training?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="a_secret_at_least_32_characters_long"
JWT_REFRESH_SECRET="another_secret_at_least_32_characters_long"
SMS_PROVIDER_KEY="any_value_for_local_stub"
```

### 3. Start database and Redis with Docker

```bash
docker compose up -d
```

Verify both containers are healthy:

```bash
docker compose ps
```

### 4. Run migrations

```bash
npm run prisma:migrate:dev
```

This creates all tables, indexes, and relations defined in `prisma/schema.prisma`.

### 5. Generate Prisma client

```bash
npm run prisma:generate
```

This step runs automatically after `migrate:dev`, but run it manually whenever you pull schema changes.

---

## Running locally

```bash
# Development (hot reload)
npm run start:dev

# Debug mode
npm run start:debug

# Production build
npm run build
npm run start:prod
```

The API runs on `http://localhost:3000` by default.

Swagger docs: `http://localhost:3000/api/docs`

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default `3000`) | HTTP port |
| `NODE_ENV` | No (default `development`) | `development`, `production`, or `test` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `REDIS_URL` | **Yes** | Redis connection string |
| `JWT_SECRET` | **Yes** | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | **Yes** | Secret for signing refresh tokens (min 32 chars) |
| `SMS_PROVIDER_KEY` | **Yes** | API key for the SMS provider |
| `WABA_TOKEN` | No | WhatsApp Business API token |
| `S3_BUCKET` | No | AWS S3 bucket name for file uploads |
| `AWS_REGION` | No | AWS region (e.g. `ap-south-1`) |
| `AWS_ACCESS_KEY_ID` | No | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | No | AWS secret key |
| `PAYMENT_GATEWAY_KEY` | No | Payment gateway API key |
| `PAYMENT_GATEWAY_SECRET` | No | Payment gateway secret |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

---

## Running migrations in production

```bash
# Deploy pending migrations (non-interactive, safe for CI/CD)
npm run prisma:migrate

# Open Prisma Studio to browse data (dev only)
npm run prisma:studio
```

---

## Project structure

```
src/
  app.module.ts           — Root module, middleware configuration
  main.ts                 — Bootstrap, Swagger setup, global pipes/filters
  common/
    config/               — Config schema and typed access via ConfigService
    prisma/               — PrismaService (global singleton)
    decorators/           — @CurrentUser, @Roles, @TenantId
    guards/               — JwtAuthGuard, RolesGuard
    interceptors/         — TenantInterceptor, AuditLogInterceptor
    middleware/           — TenantContextMiddleware + AsyncLocalStorage
    filters/              — GlobalExceptionFilter (maps Prisma + HTTP errors)
  modules/
    auth/                 — OTP + JWT + TOTP login, token refresh
    centers/              — Franchise center CRUD
    users/                — User management + role assignment
    students/             — Student profiles + consent records
    courses/              — HO-owned course catalog
    center-courses/       — Per-center course grants
    enquiries/            — CRM leads + follow-up logs
    enrollments/          — Enrollment creation + installment generation
    fees/                 — Fee plans + installments + payment collection
    certificates/         — Certificate request / issue / public verify
    exams/                — Exam engine + attempt submission + auto-evaluation
    notifications/        — Multi-channel notification dispatch (stub)
    audit/                — Write-only audit log service + query endpoint
prisma/
  schema.prisma           — Full data model (33+ tables, all relations, RLS notes)
  migrations/             — Generated migration files
```

---

## Authentication

All protected routes require a Bearer JWT in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

**OTP flow (mobile users):**
1. `POST /api/v1/auth/otp/request` — request OTP
2. `POST /api/v1/auth/otp/verify` — verify OTP → get tokens

**Password flow (panel users):**
1. `POST /api/v1/auth/login` — email + password + TOTP (if enabled)

**Token refresh:**
- `POST /api/v1/auth/refresh` — rotate refresh token → new access + refresh tokens

Access tokens expire in **15 minutes**. Refresh tokens expire in **30 days**.

---

## Multi-tenancy

Every request resolves `centerId` from the JWT payload via `TenantContextMiddleware`, which stores it in `AsyncLocalStorage`. The `TenantInterceptor` rejects requests where a route `centerId` param does not match the authenticated center's ID (except SUPER_ADMIN and HO_STAFF).

HO-global records have `centerId = null` and are readable by all centers.

---

## Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full platform access |
| `HO_STAFF` | Head-office operations |
| `CENTER_OWNER` | Manages a single franchise center |
| `CENTER_STAFF` | Front-desk operations |
| `TEACHER` | Batch and exam management |
| `STUDENT` | Student portal access |
| `PARENT` | Read-only guardian access |

---

## Running tests

```bash
npm run test          # unit tests
npm run test:cov      # coverage report
npm run test:e2e      # end-to-end tests
```
