# BizBill Business Type Profile Configuration

This directory holds the canonical definitions of BizBill's **Business Type Profiles** — the server-delivered JSON documents that reshape the single Android app into a niche-specific tool (PRD Section 2). Profiles are **configuration, not code** (FR-2.2): a new niche (salon, optician, ...) is launched by publishing a new JSON document that validates against `profile.schema.json`, with **no Android release**.

## Contents

| Path | Purpose |
|---|---|
| `profile.schema.json` | JSON Schema (draft 2020-12) for the profile document format |
| `profiles/printing.json` | Printing & Custom Jobs (the canonical reference workflow, PRD 2.3) |
| `profiles/kirana.json` | Kirana / Grocery (PRD 2.4) |
| `profiles/pharmacy.json` | Pharmacy / Medical (PRD 2.5) |
| `profiles/fastfood.json` | Fast Food / QSR (PRD 2.6) |
| `profiles/tailor.json` | Tailor / Boutique (PRD 2.7) |
| `profiles/mobile-repair.json` | Mobile & Laptop Repair (PRD 2.7) |
| `profiles/photo-studio.json` | Photo Studio (PRD 2.7) |
| `profiles/laundry.json` | Laundry / Dry-Clean (PRD 2.7) |

## What a profile contains

Per PRD Section 2, a profile is a named bundle of five things, mapped to schema properties as follows:

1. **Module preset** → `modules` (canonical enum: `CUSTOM_ORDER`, `QUICK_SALE`, `CATALOG`, `INVENTORY`, `BATCH_EXPIRY`, `KOT_TOKEN`, `CREDIT_LEDGER`, `DELIVERY`, `APPOINTMENTS`). A starting point, not a lock — merchants toggle modules in Settings afterwards, subject to plan entitlements (FR-2.1, Section 8). `DELIVERY` and `APPOINTMENTS` are Phase 2 and appear in no launch preset.
2. **Home-screen layout** → `home_quick_actions` (ordered tile set, FR-2.11) plus `default_landing` (e.g. Kirana opens straight into Quick Sale).
3. **Catalog schema** → `catalog_field_hints` (unit types, decimal quantities, variants/add-ons, batch tracking, barcode scan, default GST rates, Schedule H/H1 item flags) and `sample_catalog` (starter items seeded at onboarding).
4. **Field pack** → `field_packs`, an array of declarative field definitions (FR-2.4): `key`, `label`, `type` (`text` | `number` | `money` | `select` | `multiselect` | `date` | `photo` | `toggle`), `required`, `options` (selects only), `show_on_customer_copy`, `show_on_shop_copy`. The Android form renderer and the ESC/POS receipt renderer interpret these generically — **no per-niche Kotlin code**.
5. **Display labels & receipt template** → `state_labels` (canonical `CREATED` / `IN_PROGRESS` / `READY` / `COMPLETED` → niche label; optional `CANCELLED` label defaults to "Cancelled") plus `receipt_template` (the ESC/POS template variant bundle covering Customer Copy / Shop Copy / KOT at 58mm and 80mm, FR-2.13). Optional `in_progress_sub_labels` carries cosmetic sub-labels such as "Diagnosing / Repairing" — canonically still one state; the lifecycle never gains states.

`behavior_flags` carries the small set of profile-scoped engine switches the PRD mandates: Kirana's Tracking-QR-off-by-default on quick sales (FR-2.6), QSR's no-instant-complete + auto-complete-at-day-close + 05:00 token reset (FR-2.8, PRD 2.6), pharmacy's 90/30-day expiry alert horizons (FR-2.7), and laundry's auto tag numbers (PRD 2.7).

## Versioning (FR-2.3)

- Every profile has a stable `id` (`profile_id`) and an integer `version` (`profile_version`) starting at 1.
- **Published versions are immutable.** Any change — a new field, a relabeled state, a reordered tile — ships as `version + 1`. The server retains every published version forever.
- **Orders pin the version they were created under.** Each order row stores `profile_id` + `profile_version` next to its `custom_fields` JSONB blob (FR-2.10). Historical receipts, reprints, and read-only views always render with the pinned version's field pack, labels, and receipt template — even years after the profile has moved on (FR-2.3, FR-2.12).
- Field `key`s are the storage contract: keep a key stable across versions for the same logical field; never reuse a retired key for a different meaning.
- Compatibility rule of thumb: adding optional fields, options, tiles, or sample items is a routine version bump; removing or re-typing a field is allowed (old orders still render via their pinned version) but should be called out in the changelog the platform team keeps alongside the config.

## Delivery to the app

- The backend (NestJS, Section 7 owns the API surface) serves profiles read-only, e.g.:
  - `GET /v1/config/profiles` → summary list `[{ id, display_name, version }]` for the onboarding Business Type picker.
  - `GET /v1/config/profiles/{id}` → latest full document.
  - `GET /v1/config/profiles/{id}/versions/{version}` → a specific historical version (needed when a device must render an order pinned to a version it does not have cached).
- Documents are tenant-independent static config: serve with `ETag`/`If-None-Match` and cache aggressively (CDN-friendly; profile payloads are a few KB).
- **Fetch points (FR-2.2):** at onboarding (before the Business Type picker renders) and refreshed on every app start when online. A version change is applied silently; the active profile swap is atomic (write new row, flip the active pointer).
- **Bundled fallback:** the APK ships with a snapshot of all launch profiles (this directory, embedded as assets) so first-run onboarding works with zero connectivity. On first sync the app reconciles: if the server version is newer than the bundled one, the server copy wins.

## Caching in Room (offline-first)

The app caches profiles in a Room table so **all** profile behavior — form rendering, state labels, receipt printing, home layout — works fully offline (FR-2.2):

```
business_type_profile (
  profile_id      TEXT NOT NULL,
  profile_version INTEGER NOT NULL,
  payload_json    TEXT NOT NULL,      -- the raw document, exactly as served/bundled
  source          TEXT NOT NULL,      -- BUNDLED | SERVER
  fetched_at      INTEGER NOT NULL,   -- epoch millis
  PRIMARY KEY (profile_id, profile_version)
)
active_profile ( profile_id TEXT, profile_version INTEGER )  -- single-row pointer
```

- The app stores the **raw JSON payload** and parses on read; this guarantees a pinned old version renders byte-for-byte the way it was published.
- Rows are never deleted while any local order references their `(profile_id, profile_version)` — the cache is also the offline archive for FR-2.12's read-only historical rendering. If an order pinned to an uncached version is opened (e.g. after reinstall), the app fetches that version on demand and falls back to the latest cached version with a "layout may differ" notice while offline.

## How orders use profiles (FR-2.10, FR-2.12)

- On order creation the app copies the **active** `(profile_id, profile_version)` onto the order and stores field-pack values as a JSON blob keyed by field `key` (server side: `custom_fields` JSONB column — never per-niche relational columns).
- Money-typed field values are stored in integer paise, like every amount in the system (FR-3.6); display format is `Rs 1,234.00`.
- On Business Type switch (FR-2.9): non-destructive. The new preset and home layout apply immediately; old orders keep rendering with their pinned version; data of now-disabled modules moves to Settings → "Archived modules" and reactivates intact if the module is re-enabled. SHOPCODE and the Order No sequence (`{SHOPCODE}-{NNNN}`) are unaffected.

## Validation

All documents must validate against `profile.schema.json` (JSON Schema draft 2020-12). CI runs, for every file in `profiles/`:

```bash
npx ajv-cli validate --spec=draft2020 -s profile.schema.json -d "profiles/*.json"
```

CI additionally enforces two constraints the schema cannot express: field `key`s unique within a profile, and quick-action `id`s unique within a profile. Strict JSON only — no comments, no trailing commas.

Schema notes:

- `select`/`multiselect` fields **must** have `options`; all other types must not.
- `photo` fields can never print (thermal printers render text and QR only), so both `show_on_*` flags must be `false`; photos sync to object storage per Section 7.
- `state_labels` requires the four forward states; `CANCELLED` is optional and defaults to "Cancelled". Labels are display-only — the canonical state machine (Section 3.7) is untouched by config.
- The PRD FR-2.4 type list also mentions `phone` and `measurement_set`; the MVP schema ships without them (see decision log in the PRD annex): the tailor profile references a reusable per-customer measurement set by name through a `text` field (`measurement_profile`), with a first-class `measurement_set` type reserved for a future schema revision.

## Adding a new niche

1. Copy the closest existing profile in `profiles/`, set a new `id`, `display_name`, and `version: 1`.
2. Pick the module preset from the PRD 2.1 matrix (or extend the matrix for the new niche).
3. Define the field pack, state labels, quick actions, catalog hints, sample catalog, and receipt template id.
4. Validate against the schema; publish via the config service. The niche is live on next app start — no Android release (FR-2.2). Include it in the next APK's bundled fallback snapshot.
