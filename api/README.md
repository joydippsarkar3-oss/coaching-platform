# BizBill API — Contract & Conventions

This directory is the **source of truth** for the BizBill `/v1` HTTP API. The NestJS backend
(`apps/api`), all three web apps, and the Android sync client are built against
[`openapi.yaml`](./openapi.yaml) (OpenAPI 3.1). If code and this contract disagree, the
contract wins; change the contract first, then the code.

A copy of both files lives in the repo at `bizbill/docs/api/` — keep the two locations
identical (CI diff-checks them).

- PRD Section 7 (architecture, data model, sync protocol, API surface) is the primary spec;
  Sections 3 (billing engine), 5 (web apps), 6 (auth), and 8 (monetization) fill in behavior.

---

## 1. Naming

| Layer | Convention | Example |
|---|---|---|
| URL paths | kebab-case, plural resource nouns, versioned under `/v1` | `/v1/tenant/business-profile` |
| JSON properties | **camelCase**, always | `totalAmount`, `balanceDue`, `clientUpdatedAt` |
| SQL columns | snake_case (never leaks into JSON) | `total_amount`, `advance_paid` |
| Enums | SCREAMING_SNAKE_CASE values | `IN_PROGRESS`, `CUSTOM_ORDER` |
| Error codes | SCREAMING_SNAKE_CASE | `STATE_REGRESSION` |
| Operation IDs | lowerCamelCase verb-first | `transitionOrderState` |

Canonical enums (must match **verbatim** across API, DB, Android, and web):

- **Order states:** `CREATED, IN_PROGRESS, READY, COMPLETED, CANCELLED`
- **Payment status:** `UNPAID, PARTIAL, PAID` (always derived, never set directly)
- **Payment methods:** `CASH, UPI, CARD, OTHER`
- **Modules:** `CUSTOM_ORDER, QUICK_SALE, CATALOG, INVENTORY, BATCH_EXPIRY, KOT_TOKEN, CREDIT_LEDGER, DELIVERY, APPOINTMENTS`
- **Plans:** `FREE, PRO, GROWTH` — subscription lifecycle states are lowercase
  (`trialing, active, past_due, suspended, cancelled`) per PRD 8.3.

## 2. Data types

| Concept | Wire format | Notes |
|---|---|---|
| Money | **integer paise** | `133400` = Rs 1,334.00. Never floats, never strings. Negative only for correction payments. |
| Quantity | decimal **string**, ≤ 3 places | `"1.250"` — avoids IEEE-754 drift for kg/metre sales. |
| Timestamps | RFC 3339 UTC | `2026-07-31T13:12:42Z`. Client-observed fields (`clientUpdatedAt`, `paidAt`, `occurredAt`) carry the device clock; server tolerates ±5 min skew, beyond that it substitutes server time and flags the op. |
| Dates (reports) | `YYYY-MM-DD`, interpreted in **IST** | The merchant's business day. |
| IDs | UUID (client-creatable entities use **client-generated UUIDv7**) | Orders, order items, payments, customers, credit-ledger entries. Server never rewrites client ids, `orderNo`, or `trackingToken` (FR-3.14). |
| Order No | `{SHOPCODE}-{NNNN}` | e.g. `PRNT-0231`; zero-padded 4 digits, expands past 9999. |
| Tracking token | 22 chars of `A–Z a–z 0–9 - _` | Client-generated (SecureRandom, ~131 bits). Tracking URL: `https://track.bizbill.app/t/{token}`. |
| Payment QR | `upi://pay?pa={vpa}&pn={shop}&am={balance}&tn={orderNo}` | Generated on device; never stored server-side. |

## 3. Authentication

1. Client authenticates with Firebase (Phone OTP or Google Sign-In).
2. `POST /v1/auth/exchange` — the **only** endpoint that accepts a Firebase ID token —
   returns a backend JWT pair: **15-min access token** + **30-day rotating refresh token**,
   plus the user's tenant memberships.
3. All other authenticated calls send `Authorization: Bearer {accessToken}`.
4. `POST /v1/auth/refresh` rotates the pair. Reuse of a rotated-out refresh token revokes the
   device session (`REFRESH_REUSED`).

Access-token claims: `sub` (user id), `tenant_id`, `role` (`OWNER` in Phase 1).
Admin tokens (Super Admin panel) carry `admin_role` and **no** `tenant_id`; admin endpoints
additionally require a TOTP-verified session and an IP allowlist, and every access is
audit-logged. Impersonation tokens (`POST /v1/admin/tenants/{id}/impersonate`) are read-only
and expire after 30 minutes.

Every non-admin, non-public request is tenant-scoped by the JWT's `tenant_id`; Postgres RLS
is the second line of defense.

## 4. Pagination (cursor)

List endpoints use **opaque cursors** — never offset/limit:

```
GET /v1/orders?limit=25            → { "data": [...], "nextCursor": "c_0000A3F1" }
GET /v1/orders?limit=25&cursor=c_0000A3F1
```

- `nextCursor: null` ⇒ no more pages.
- Cursors are opaque; clients must not parse or construct them.
- Default page size 25, max 100 (exception: `GET /v1/sync/changes` — max 500 rows,
  `hasMore` flag, cursor `"0"` for the initial full pull).

## 5. Idempotency

- `POST /v1/sync` **requires** an `Idempotency-Key` header — canonically
  `sha256(deviceId + ":" + batchSeq)` hex. Replays return the stored per-op results with
  `replayed: true` and apply nothing. Same key + different body ⇒ `409 IDEMPOTENCY_KEY_CONFLICT`.
  Keys are retained 90 days.
- **Append-only entities** (payments, credit-ledger entries) are idempotent by client id:
  posting a duplicate `id` returns the previously stored row (200) instead of creating.
- Batches: max **200 ops**, applied in order in one transaction, per-op results
  `APPLIED | REJECTED{reason} | SUPERSEDED`. `batchSeq` is monotonic per device.

## 6. Conflict rules (mirror of PRD FR-7.11)

| Entity class | Rule |
|---|---|
| Order content, products, customers | Last-write-wins by `clientUpdatedAt` (±5 min skew tolerated) |
| Order state | Server-enforced monotonic forward; regressions ⇒ `REJECTED`/`409 STATE_REGRESSION` with the winning state in `details.currentState` |
| Payments, credit-ledger entries | Append-only, immutable; corrections are new negative-amount `OTHER` rows with a mandatory note |
| `balanceDue`, `paymentStatus`, `balanceAfter` | Always server-derived; client-supplied values ignored |
| Deletes | Tombstones (`deletedAt`), GC'd server-side after 180 days |

## 7. Errors

Every non-2xx response is the shared **ErrorEnvelope**:

```json
{
  "error": {
    "code": "STATE_REGRESSION",
    "message": "Order is already COMPLETED; backward transitions are not permitted.",
    "traceId": "1b6f0a83c92d47e0",
    "details": { "currentState": "COMPLETED" }
  }
}
```

`code` is stable and machine-readable; `message` is for developers (never PII, never shown
raw to end users); `traceId` correlates with structured logs and OTel traces.

### Error code table

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Malformed body/params; `details.fields[]` lists per-field errors |
| 401 | `UNAUTHENTICATED` | Missing/expired/invalid access token |
| 401 | `FIREBASE_TOKEN_INVALID` | Firebase ID token failed verification (exchange only) |
| 401 | `REFRESH_REUSED` | Rotated-out refresh token replayed; session revoked |
| 403 | `PLAN_FEATURE_LOCKED` | Feature/limit gated by plan (e.g. GST export on Free) |
| 403 | `MODULE_DISABLED` | Endpoint's module is off in the business profile |
| 403 | `IMPERSONATION_READ_ONLY` | Write attempted with an impersonation token |
| 403 | `TENANT_SUSPENDED` | Merchant API access blocked (tracking pages stay live) |
| 403 | `ADMIN_SCOPE_REQUIRED` | Non-admin token on an `/v1/admin/*` endpoint |
| 404 | `NOT_FOUND` | Not found within the caller's tenant scope (also the uniform public-tracking miss) |
| 409 | `DUPLICATE_ORDER_NO` | Order number already exists for the tenant |
| 409 | `DUPLICATE_SKU` | Product SKU already exists for the tenant |
| 409 | `TOKEN_COLLISION` | Tracking token already exists platform-wide (retriable — regenerate) |
| 409 | `STATE_REGRESSION` | Backward/invalid order-state transition |
| 409 | `ORDER_TERMINAL` | Content edit or cancel on a COMPLETED/CANCELLED order |
| 409 | `STALE_WRITE` | Lost last-write-wins; refetch and reapply |
| 409 | `IDEMPOTENCY_KEY_CONFLICT` | Key reused with a different body |
| 422 | `AMOUNT_MISMATCH` | Money fields fail the deterministic FR-3.6 recomputation |
| 422 | `OVERPAYMENT` | Payment would exceed `balanceDue` |
| 422 | `GSTIN_REQUIRED` | GST report requested with no valid GSTIN on file |
| 422 | `BATCH_TOO_LARGE` | Sync batch over 200 ops |
| 422 | `SHOPCODE_TAKEN` | Offline-reserved SHOPCODE collided at first sync |
| 429 | `RATE_LIMITED` | Endpoint-class rate limit exceeded; honor `Retry-After` |

Sync per-op `reason` values reuse the same codes (`STATE_REGRESSION`, `VALIDATION_FAILED`,
`AMOUNT_MISMATCH`, `DUPLICATE_ORDER_NO`, `TOKEN_COLLISION`, `UNKNOWN_ENTITY`).

## 8. Rate limits

Enforced at the gateway (Redis sliding window), keyed by JWT — or IP where unauthenticated.
Every response carries `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
(epoch seconds); 429s add `Retry-After`.

| Endpoint class | Limit |
|---|---|
| Auth exchange/refresh | 10/min per IP |
| Tenant & profile | 60/min |
| Catalog | 120/min |
| Orders, payments, customers | 300/min |
| Sync | 60/min, 200 ops/batch |
| Public tracking | 60/min per IP (+ CDN bot filtering) |
| Reports | 30/min (read replica) |
| Subscription | 30/min |
| Admin | 120/min + IP allowlist |

## 9. Caching (public tracking)

`GET /v1/public/track/{token}` responds with:

```
Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=300
X-Robots-Tag: noindex
```

Resolution: CDN edge → API pod → Redis `track:{token}` (TTL 60 s) → Postgres index-only scan.
Every state/payment change purges Redis + CDN for `/t/{token}` (< 5 s p95). Not-found
responses are byte-identical across malformed/unknown/banned-tenant tokens.

## 10. Versioning & compatibility

- Everything lives under `/v1`. **Breaking** changes (removing/renaming fields, changing
  types or semantics, tightening request validation, removing enum values) require `/v2`.
- **Additive** changes are allowed in-place: new endpoints, new optional request fields,
  new response fields, new enum values on **output-only** fields.
- Clients MUST ignore unknown response fields, and MUST NOT treat unknown output enum values
  as fatal (render a fallback).
- The Android app writes **only** through `POST /v1/sync` (FR-7.15); direct order/catalog
  REST writes exist for the web panels. Keep it that way — one write path, one conflict engine.

## 11. Out-of-contract surfaces

Deliberately **not** in `openapi.yaml`:

- `POST /v1/webhooks/billing` — Razorpay webhook (signature-verified, provider-shaped payload;
  documented in `apps/api` alongside its stub).
- FCM push payloads (delta-pull nudges, subscription events) — documented in the Android app.
- Static profile JSONs under `config/profiles/` — served via CDN, schema in
  `engineering/config/profile.schema.json`.

## 12. Validating the contract

No network installs in this environment; when tooling is available run:

```bash
npx @redocly/cli lint engineering/api/openapi.yaml
# or
npx @apidevtools/swagger-parser validate engineering/api/openapi.yaml
```

CI must fail on: invalid YAML, unresolved `$ref`s, enum drift against
`packages/shared` constants, and divergence between `engineering/api/` and `bizbill/docs/api/`.
