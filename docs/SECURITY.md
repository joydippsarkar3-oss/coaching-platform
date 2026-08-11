# CompuTrain Security Checklist & Pen Test Guide

> OWASP ASVS Level 2 — Last reviewed: 2026-08-12

---

## 1. OWASP ASVS Level 2 Checklist

### V1 — Architecture & Multi-Tenancy

| # | Check | Status |
|---|-------|--------|
| 1.1 | Every API route enforces `center_id` binding via `TenantContextMiddleware` — no cross-tenant data leakage possible | Review |
| 1.2 | Tenant context is injected server-side from the verified JWT claim, never from a client-supplied query param or header | Review |
| 1.3 | Database queries for tenant-scoped resources always include a `WHERE center_id = :tenantId` predicate via Prisma scope | Review |
| 1.4 | Super-admin endpoints are segregated behind a separate route prefix (e.g. `/admin/*`) and guarded by an explicit `SUPER_ADMIN` role check | Review |
| 1.5 | Architectural threat model document exists and identifies trust boundaries between student app, teacher app, center admin panel, and super-admin | Review |

### V2 — Authentication

| # | Check | Status |
|---|-------|--------|
| 2.1 | OTP codes are single-use: once verified the code is immediately invalidated in the database | Review |
| 2.2 | OTP replay window is enforced: codes older than 10 minutes are rejected regardless of validity | Review |
| 2.3 | OTP brute-force: after 5 consecutive failures the code is invalidated and rate limiting triggers | Review |
| 2.4 | JWTs are signed with RS256 (asymmetric): private key never leaves the auth service; public key is used for verification everywhere else | Review |
| 2.5 | JWT `kid` header is validated against a known key registry — unknown `kid` values are rejected outright | Review |
| 2.6 | Refresh token rotation is implemented: each refresh invalidates the old token and issues a new one | Review |
| 2.7 | Refresh tokens are stored as hashed values (HMAC or bcrypt) in the database — plaintext is never persisted | Review |

### V3 — Session Management

| # | Check | Status |
|---|-------|--------|
| 3.1 | Access tokens have a short TTL (≤ 15 minutes recommended) | Review |
| 3.2 | Logout invalidates the refresh token server-side (token is removed from the whitelist / added to blacklist) | Review |
| 3.3 | Concurrent session policy is defined: either all sessions are valid, or a new login invalidates prior sessions per role | Review |
| 3.4 | Exam sessions have a separate, stricter token scope that cannot be used to call non-exam endpoints | Review |

### V4 — Access Control (RBAC)

| # | Check | Status |
|---|-------|--------|
| 4.1 | Role hierarchy (`STUDENT < TEACHER < CENTER_ADMIN < SUPER_ADMIN`) is enforced server-side; the client role claim is not trusted for authorization decisions | Review |
| 4.2 | A STUDENT cannot access another student's exam results, even within the same center | Review |
| 4.3 | A TEACHER can only manage courses/exams belonging to their own center | Review |
| 4.4 | A CENTER_ADMIN cannot create or modify other centers' data — cross-center mutation is impossible | Review |
| 4.5 | SUPER_ADMIN actions (center creation, plan changes) are logged in an immutable audit trail | Review |
| 4.6 | Horizontal privilege escalation test: authenticated STUDENT cannot reach TEACHER-only endpoints by manipulating the request | Review |

### V5 — Input Validation

| # | Check | Status |
|---|-------|--------|
| 5.1 | All incoming request bodies are validated against typed DTOs using `class-validator` before reaching business logic | Review |
| 5.2 | `whitelist: true` and `forbidNonWhitelisted: true` are set on the global `ValidationPipe` to strip unexpected fields | Review |
| 5.3 | All database access goes through Prisma's parameterized query builder — no raw SQL string interpolation | Review |
| 5.4 | File upload endpoints validate MIME type server-side (not just the `Content-Type` header) and enforce maximum size | Review |

### V6 — Cryptography

| # | Check | Status |
|---|-------|--------|
| 6.1 | Webhook signatures use HMAC-SHA256; `timingSafeEqual` is used for comparison to prevent timing attacks | Review |
| 6.2 | No use of MD5 or SHA-1 for any security-sensitive purpose (password hashing, token signing, integrity checks) | Review |
| 6.3 | RS256 private key is stored in an environment secret (AWS Secrets Manager / GCP Secret Manager) and not committed to the repository | Review |
| 6.4 | Secrets are rotated on a documented schedule; stale secrets do not persist in `.env` files in version control | Review |

### V7 — Error Handling & Logging

| # | Check | Status |
|---|-------|--------|
| 7.1 | Production API responses never include a stack trace, internal file paths, or raw database error messages | Review |
| 7.2 | A global exception filter maps all unhandled errors to a generic `{ "message": "Internal server error" }` response | Review |
| 7.3 | Errors are logged server-side with enough context (request ID, user ID, endpoint) for incident investigation | Review |

### V8 — Data Protection (DPDP Act)

| # | Check | Status |
|---|-------|--------|
| 8.1 | PII fields (phone number, email, name) are masked or omitted in application logs | Review |
| 8.2 | DPDP consent records are immutable: consent grants and withdrawals are appended, never overwritten | Review |
| 8.3 | Data-at-rest encryption is enabled for the primary database and any object storage bucket containing student PII | Review |
| 8.4 | Soft-delete is enforced platform-wide — hard deletes require an explicit SUPER_ADMIN action and are logged | Review |

### V9 — Communication Security

| # | Check | Status |
|---|-------|--------|
| 9.1 | All endpoints are served over HTTPS only; HTTP traffic is redirected (301) or rejected | Review |
| 9.2 | HSTS header (`Strict-Transport-Security: max-age=31536000; includeSubDomains`) is set on all responses | Review |
| 9.3 | Content-Security-Policy header is configured to restrict script sources and prevent XSS via injected scripts | Review |
| 9.4 | TLS 1.2 minimum is enforced; TLS 1.0 and 1.1 are disabled at the load balancer | Review |

### V10 — Malicious Code & Dependencies

| # | Check | Status |
|---|-------|--------|
| 10.1 | `npm audit` (or `pnpm audit`) runs in CI and breaks the build on high/critical severity findings | Review |
| 10.2 | Snyk or Dependabot is configured to open PRs for dependency CVEs automatically | Review |
| 10.3 | No unused or abandoned dependencies remain in `package.json` | Review |

### V13 — API Security

| # | Check | Status |
|---|-------|--------|
| 13.1 | OTP request endpoint is rate-limited (e.g. max 3 requests per phone number per 10 minutes) | Review |
| 13.2 | Exam start endpoint is rate-limited to prevent automated exam farming | Review |
| 13.3 | Answer submission / verify endpoint has per-user rate limiting to prevent brute-forcing | Review |
| 13.4 | Payment webhook endpoint validates the `X-Razorpay-Signature` header before processing any state change | Review |

---

## 2. Pre-Pen-Test Preparation Checklist

### Staging Environment Setup

- [ ] Provision a staging environment that mirrors production infrastructure (same NestJS version, same database engine, same reverse proxy config)
- [ ] Populate staging with synthetic data only — no real student PII, no live payment credentials
- [ ] Point the payment gateway to the Razorpay/Stripe test mode — confirm webhooks fire against staging, not production
- [ ] Disable outbound SMS/email in staging or redirect to a test sink so OTP codes do not reach real users
- [ ] Confirm staging has its own RS256 keypair — do not reuse production keys
- [ ] Give the pen test team network access to staging endpoints only; firewall off production

### Test Accounts to Create

| Account | Role | Purpose |
|---------|------|---------|
| `pentest-student-1@test.local` | STUDENT | Baseline student flow, exam taking |
| `pentest-student-2@test.local` | STUDENT | Cross-user isolation tests |
| `pentest-teacher@test.local` | TEACHER | Course/exam management tests |
| `pentest-center-admin@test.local` | CENTER_ADMIN | Center-scoped admin tests |
| `pentest-super-admin@test.local` | SUPER_ADMIN | Platform-wide admin tests |
| Second center accounts (duplicate set) | All roles | Cross-tenant isolation tests |

### 10 Most Sensitive Endpoints to Test

1. `POST /auth/send-otp` — OTP rate limiting, enumeration
2. `POST /auth/verify-otp` — OTP replay, brute force
3. `POST /auth/refresh` — Refresh token rotation, token reuse
4. `POST /exams/:id/start` — Exam session isolation, concurrent-session abuse
5. `POST /exams/:id/submit` — Answer tampering, re-submission after deadline
6. `GET /students/:id/results` — Horizontal privilege escalation (student A reading student B)
7. `PATCH /centers/:id` — Cross-tenant mutation (CENTER_ADMIN modifying another center)
8. `POST /webhooks/payment` — Signature bypass, replay of old webhook events
9. `GET /admin/centers` — SUPER_ADMIN endpoint reachable by lower roles?
10. `POST /courses/:id/enroll` — Enrollment without valid subscription / payment bypass

### What to Exclude

- **Production environment**: all `*.computrain.in` (or equivalent prod domain) traffic is out of scope
- **Live payment processing**: do not send real transactions; use test-mode credentials only
- **Real student data**: the pen test team must not be given access to any database containing actual student records
- **Denial-of-service testing**: volumetric load tests require a separate written agreement
- **Social engineering / phishing**: out of scope for this engagement

---

## 3. Known Security Controls Already Implemented

The following controls are present in the codebase and should be verified (not re-implemented) during the pen test:

| Control | Location / Detail |
|---------|------------------|
| **JWT RS256** | Access tokens are signed with an RSA private key; verification uses the corresponding public key only |
| **TenantContextMiddleware** | Injected on every authenticated route; extracts `center_id` from the verified JWT and attaches it to the request context — no route can skip this without explicit opt-out |
| **`timingSafeEqual` on webhook signatures** | All incoming webhook handlers compare the computed HMAC-SHA256 against the header value using Node's `crypto.timingSafeEqual`, preventing timing oracle attacks |
| **Anti-paste keystroke validation** | Exam answer inputs reject clipboard paste events and validate that keystrokes arrive with human-plausible timing, reducing automated answer injection |
| **Prisma parameterized queries** | All database access uses Prisma's query builder; there is no raw SQL string interpolation surface for classic SQL injection |
| **DPDP consent architecture** | Consent grants/withdrawals are stored as an append-only event log; consent state is derived from the log, never from a mutable flag |
| **Soft-delete only** | `DELETE` operations set a `deletedAt` timestamp and filter records out of normal queries; no database rows are permanently destroyed by application code |

---

## 4. Recommended Security Tools

### Dependency Scanning
- **Snyk** (`snyk test`, `snyk monitor`) — integrates with GitHub/GitLab CI; reports CVEs with fix guidance and opens PRs for remediation
- **`npm audit` / `pnpm audit`** — built-in Node.js CVE check; run as a required CI step with `--audit-level=high`

### Active Scanning
- **OWASP ZAP** (Zed Attack Proxy) — open-source; run the automated spider + active scan against the staging API to catch common OWASP Top 10 issues automatically before a manual pen test

### Manual Pen Test
- **Burp Suite Professional** — intercept and manipulate HTTP/S traffic, test authentication flows, replay tokens, and fuzz parameters; recommended for the main engagement
- **JWT Editor (Burp extension)** — specifically useful for testing RS256 key confusion attacks (`alg: none`, RS256 → HS256 downgrade)

### Secrets Scanning
- **Gitleaks** or **TruffleHog** — scan the git history for accidentally committed secrets (API keys, private keys, `.env` values)

---

## 5. Incident Response Runbook

### Who to Contact

| Role | Responsibility | Contact |
|------|---------------|---------|
| Engineering Lead | Coordinate technical response, decide on service isolation | [fill in] |
| DevOps / Infra | Rotate secrets, deploy hotfixes, pull logs | [fill in] |
| Legal / DPO | DPDP breach notification, regulator communication | [fill in] |
| CEO / Management | Stakeholder communication, business decisions | [fill in] |

### How to Revoke All Active JWTs (RS256 Keypair Rotation)

1. Generate a new RS256 keypair:
   ```bash
   openssl genrsa -out new_private.pem 4096
   openssl rsa -in new_private.pem -pubout -out new_public.pem
   ```
2. Update the secret store (AWS Secrets Manager / environment secret) with the new private key value.
3. Update the public key used by all verification services.
4. Restart all auth service and API service instances to pick up the new keys.
5. All previously issued JWTs are now invalid because they were signed with the old private key — users will be forced to re-authenticate.
6. Revoke and re-issue all active refresh tokens in the database:
   ```sql
   UPDATE refresh_tokens SET revoked_at = NOW() WHERE revoked_at IS NULL;
   ```
7. Monitor auth logs for anomalous re-authentication spikes that may indicate the attacker attempting to re-establish sessions.

### How to Disable a Compromised Center

1. Set `center.status = 'SUSPENDED'` in the database for the affected `center_id`.
2. The `TenantContextMiddleware` checks this status on every request — all users of the suspended center will receive a `403 Forbidden` immediately without requiring a deployment.
3. Revoke all refresh tokens associated with users of that center:
   ```sql
   UPDATE refresh_tokens
   SET revoked_at = NOW()
   WHERE revoked_at IS NULL
     AND user_id IN (SELECT id FROM users WHERE center_id = :compromisedCenterId);
   ```
4. Preserve all data in read-only form for forensic investigation — do not delete or soft-delete until the investigation is complete.
5. Notify the center administrator via out-of-band communication (phone/email outside the platform).

### DPDP Breach Notification Timeline

India's Digital Personal Data Protection Act (DPDP Act, 2023) imposes the following obligations:

| Milestone | Deadline | Action |
|-----------|----------|--------|
| Internal detection | T+0 | Engineering lead confirms breach scope and affected data categories |
| Management notified | T+4 hours | Brief CEO and DPO with preliminary impact assessment |
| Notification to Data Protection Board (PDPB) | **T+72 hours** | Submit formal breach notification including: nature of breach, categories of personal data affected, approximate number of data principals affected, likely consequences, measures taken or proposed |
| Notification to affected data principals | As directed by PDPB or without undue delay | Individual notice to each affected student/user with plain-language description and remediation steps |
| Post-incident report | T+30 days | Full root-cause analysis submitted internally and to PDPB if required |

> Note: The 72-hour clock starts from the moment the organisation becomes aware of the breach, not from confirmed forensic analysis. File a preliminary notification if the full scope is not yet known, and supplement it as investigation progresses.
