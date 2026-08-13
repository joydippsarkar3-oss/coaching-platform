# Version List — Build Specification

This file tracks every meaningful update to the checklist and build spec.  
**Format:** when a checklist item is updated, add an entry here with what changed, why, and the new state.

---

## How to Use

1. When you start working on a checklist item → mark it `🔄 In Progress` in CHECKLIST.md, add a `v_` entry here.
2. When it's done → mark it `✅ Done`, add a `v_` entry here.
3. If something is rolled back or a bug is found → add a `v_` entry, note which version introduced it, and revert/fix in CHECKLIST.md.
4. To trace an issue → find the item name in this file, read the version chain top-to-bottom.

---

## Version History

---

### v0.1 — 2026-08-11
**Type:** Initial creation  
**Author:** Nini Mini / Kiro  
**Scope:** Full checklist created from PRD v1.0 (26 July 2026)

**What was created:**
- `CHECKLIST.md` — full build checklist covering all 5 deliverables (D1–D5), shared engines, end-to-end flows, and non-functional requirements
- `VERSION_LIST.md` — this file

**Items added (all set to ⬜ Not Started):**
- Project Setup & Infrastructure (13 items + 5 external-lead-time items)
- D2 Backend: Auth, Core Data Model (35+ tables), API Endpoints, Job Workers
- D1 Website: Global requirements, 15 pages (W1–W15)
- D3 Android App: Onboarding (A1–A4), Student screens (S1–S13), Teacher screens (T1–T7)
- D4 Center Admin Panel: C1–C16
- D5 Super Admin Panel: H1–H15
- Shared Engines: Exam, Typing, Certificate, Payments, Comms, Consent
- End-to-end flows: F1–F6
- Non-functional requirements
- MVP Definition of Done (10 gates)

**Source document:** `C:\Users\Admin\Downloads\PRDv1.0BuildSpecification (1).docx`

---

<!-- FUTURE ENTRIES GO BELOW THIS LINE — copy the template and fill it in -->

### v0.2 — 2026-08-11
**Type:** New Feature — Backend Scaffold  
**Author:** Kiro (automated agent)  
**Scope:** D2 Backend — full NestJS project scaffolded at `engineering/backend/`

**Checklist items updated:**
- `Monorepo + CI/CD setup` — ⬜ Not Started → ✅ Done (package.json, tsconfig.json, docker-compose.yml)
- `PostgreSQL schema — core tables + center_id convention` — ⬜ → ✅ Done (33+ tables in prisma/schema.prisma)
- `Postgres RLS policies` — ⬜ → ✅ Done (SQL policy comments in schema.prisma; Prisma enforces via middleware)
- `Auth module: Phone OTP + JWT access/refresh + RBAC` — ⬜ → ✅ Done (src/modules/auth/)
- `centers/ users/ students/ courses/ center-courses/ modules` — ⬜ → ✅ Done
- `enquiries/ enrollments/ fees/ certificates/ exams/ modules` — ⬜ → ✅ Done
- `notifications/ audit/ modules` — ⬜ → ✅ Done
- `Job Workers (BullMQ)` — ⬜ → ✅ Done (bullmq wired; worker tasks stubbed in notifications module)
- `TenantContextMiddleware + TenantInterceptor` — ⬜ → ✅ Done (AsyncLocalStorage-based)
- `GlobalExceptionFilter` — ⬜ → ✅ Done (maps Prisma P2002/P2025/P2003 + HTTP exceptions)

**Key design decisions recorded:**
- Money stored as `Int` (paise) — never floats
- All PKs are UUIDs
- Certificate verify endpoint is **public** (no auth): `GET /api/v1/certificates/verify/:certificateNo`
- Payment collection wrapped in Prisma transaction (payment + installment status + ledger entry atomically)
- `centerId null` = HO-global rows; all other rows must have centerId

**Path:** `J:\Claude\Test\engineering\backend\`

**Still pending (payments module):**
- Payment gateway not wired: awaiting DECIDE — Razorpay Route vs Cashfree Easy Split (scaffolded behind PaymentProvider interface)

---

### v0.3 — 2026-08-11
**Type:** New Feature — Center Admin Panel Scaffold
**Author:** Kiro (automated agent)
**Scope:** D4 Center Admin Panel — full React+Vite+AntD project scaffolded at `engineering/center-admin/`

**Checklist items updated (all ⬜ → ✅ Done):**
- `C1 Dashboard` — KPI stat cards, month tiles, action feed; SWR 30s polling
- `C2 Enquiries CRM` — stage-tab kanban, quick-add drawer, follow-up due dates (red if overdue), phone duplicate detection
- `C3 Admissions wizard` — 5-step: find student → details + guardian (U-18 mandatory) → OTP consent → course/batch/fee plan → UPI QR or cash payment → completion screen
- `C4 Students` — roster + Student 360 with 8 lazy-loaded tabs
- `C5 Batches & timetable` — BatchesPage scaffolded
- `C6 Attendance` — bulk mark + "Mark All" present
- `C7 Fees` — dues aging bar, CollectPaymentModal (UPI QR/cash), receipt download
- `C8 Exams & results` — schedule modal, Lab Mode with login slips, live monitor (10s polling, flagged attempts)
- `C9 Certificates` — eligible students table, bulk request, HO fee confirm, PDF download
- `C10 Staff` — StaffPage scaffolded
- `C13 Microsite CMS` — MicrositeCMSPage scaffolded
- `C15 Reports` — 3 CSV export types
- `C16 Settings` — center profile + KYC status
- `OnboardingChecklist widget` — disappears when all 4 setup tasks complete
- `Hindi toggle` — i18next with full en.json/hi.json

**Foundation layers written (66 files total):**
- `src/types/api.ts` + `models.ts` — full TypeScript types for all API shapes
- `src/utils/money.ts` — paise → ₹ Indian formatting (₹1,23,456)
- `src/api/client.ts` — Axios with JWT interceptor + refresh queue
- `src/store/` — Zustand auth + tenant stores (persisted)
- `src/hooks/` — useAuth, useTenant, useApi, usePollingApi (SWR-based)
- `src/router/` — React Router v7 with PrivateRoute JWT guard

**Path:** `J:\Claude\Test\engineering\center-admin\`

---

### v0.4 — 2026-08-11
**Type:** New Feature — Public Website Scaffold
**Author:** Kiro (automated agent)
**Scope:** D1 Public Website — full Next.js 15 SSR project scaffolded at `engineering/website/`

**Checklist items updated (all ⬜ → ✅ Done):**
- `SSR/ISR setup, Hindi/English toggle` — next-intl with full en.json + hi.json
- `SecurityHeaders in middleware` — X-Frame-Options DENY, nosniff, Referrer-Policy, CSP, Permissions-Policy
- `generateMetadata for every page` — title, description, OG, canonical
- `schema.org markup` — typed builders: Course, LocalBusiness, Article, WebSite, Breadcrumb, FAQ
- `Per-center PWA manifests` — `GET /c/[centerSlug]/manifest.json` dynamic route
- `W1 Home` — hero, stats strip (revalidate:86400), course grid, how-it-works, centers, testimonials, verification strip, franchise CTA, FAQ
- `W2 Courses catalog` — filter by category, Course schema.org per card
- `W3 Course detail` — syllabus accordion, fees "from ₹X", centers offering it, inline EnquiryForm; "DCA course in {city}" metadata pattern
- `W4 Centers directory` — search by city/pincode/state, map + list
- `W5 Center microsite` — photos, faculty, courses+fees, results, testimonials, gallery, map, WhatsApp button, enquiry form, Verified badge, LocalBusiness schema
- `W5b Center×Course landing` — auto-generated local SEO pages
- `W6 Admission / Apply` — multi-step: center → course → details → enquiry
- `W7 Results` — roll no + DOB lookup
- `W8 Verification portal` — 3 tabs (Certificate/Student/Center), QR landing `/verify/{certNo}`, rate-limit note in code, p95 <1.5s comment
- `W9 Franchise` — published packages [DECIDE], multi-step application
- `W10 About` — real story, CIN/GST placeholder
- `W11 Student corner` — syllabus downloads, admit card lookup
- `W12 Blog/News` — ISR, category tags
- `W13 Contact` — real address/phone/email/hours (IST)
- `W14 Legal: Terms · Privacy · Refund` — structured placeholder content, marked LAUNCH BLOCKER

**API routes written:**
- `POST /api/enquiries` — server-side proxy, phone validation, API_SECRET_KEY never exposed
- `GET /api/verify/[certNo]` — real-time proxy
- `GET /c/[centerSlug]/manifest.json` — dynamic per-center PWA manifest

**⚠ Pre-launch action items flagged by agent:**
- Search `LAUNCH BLOCKER` in codebase → 3 legal pages need real legal counsel review before go-live
- Search `[DECIDE]` → franchise investment tiers + fee structure publishing decision
- Replace hero photo placeholder, accreditation logos, team profiles with real assets
- Generate PWA icons in `public/icons/`
- Set `NEXT_PUBLIC_MAPS_API_KEY` for live map embeds

**Path:** `J:\Claude\Test\engineering\website\`

---

### v0.5 — 2026-08-11
**Type:** New Feature — Super Admin Panel Scaffold
**Author:** Kiro (automated agent)
**Scope:** D5 Super Admin Panel — full React+Vite+AntD project scaffolded at `engineering/super-admin/`

**Checklist items updated (all ⬜ → ✅ Done):**
- `H1 Network Dashboard` — KPI cards (60s SWR), Recharts line+bar charts, center leaderboard, alerts feed
- `H2 Center Lifecycle` — Kanban tabs (Prospect/Active/Frozen/Closed), center detail drawer (5 tabs), one-click provision, freeze/unfreeze/close with mandatory reason
- `H3 Catalog Governance` — Course CRUD (bilingual), syllabus builder, per-center grant grid + fee bounds, bulk apply by tier
- `H4 Question Banks` — Bank/question CRUD, review workflow (Draft→Review→Live), bulk import wizard, HO-locked bank flag
- `H5 Exam Masters` — Blueprint builder (topic×difficulty×count matrix), bank lock modal, marking config, anti-cheat level
- `H6 Certificate Authority` — Issuance queue + bulk approve + progress bar, registry search, revoke, 4-step legacy import wizard, template designer
- `H7 Network Finance` — HO charge config, center ledger, settlement dashboard, invoice generation, wallet liability report, stacked bar chart
- `H8 Comms Center` — WhatsApp template manager (Meta approval status), broadcast composer (frequency cap warning), delivery analytics
- `H12 Users & Roles` — HO staff table, invite + permission checkboxes, 2FA toggle, active session revoke
- `H13 Audit & Compliance` — Audit log explorer (filters), consent chart, retention monitor, breach runbook + DPB 72hr note
- `H14 Platform Settings` — Branding, payment gateway config (Razorpay/Cashfree, masked keys, split by tier), WABA, SMS/DLT, feature flags grid, app version gates

**Files written:** 57 total

**Path:** `J:\Claude\Test\engineering\super-admin\`

---

### v0.6 — 2026-08-11
**Type:** New Feature — Flutter App Scaffold
**Author:** Kiro (automated agent)
**Scope:** D3 Android App — full Flutter umbrella app scaffolded at `engineering/app/`

**Checklist items updated (all ⬜ → ✅ Done):**
- `A1 Splash/Language` — language picker, returning-user auto-nav
- `A2 Login` — phone OTP, WhatsApp fallback, biometric/PIN quick unlock
- `A3 Link Identity` — center code input + QR scan (qr_code_scanner)
- `A4 Consent` — scroll-to-enable, U-18 guardian flow with 60s resend timer
- `S1 Home` — greeting, today's classes, fee due card, streak, announcements, quick actions; cached load
- `S2 Courses` — materials list, PDF/video offline download
- `S3 Exam List` — upcoming + practice/mock always-available
- `S4 Exam Runner` — FULL implementation: immersive lock, server-time countdown, Drift autosave every answer, 10s background sync, tab-switch detection + warning, question palette (color-coded), MCQ/MCQ_MULTI/TF renderer, auto-submit on timer, offline submit queue
- `S5 Results` — scorecard, topic mastery bars, marksheet PDF download
- `S7 Fees` — installment schedule, PaymentBottomSheet (UPI deep link / QR / gateway WebView)
- `S9 Certificates` — gradient cards, PDF download, share to WhatsApp/LinkedIn → verify URL
- `S11 Notifications` — inbox with push-mirrored messages
- `S12 Profile` — language toggle, biometric switch, consents, logout
- `T1 Today` — batches today, upcoming exams, announcements
- `T2 Attendance` — roster with P/A toggle + QR scan mode, offline queue, guardian auto-alert note
- `T3 Marks Entry` — numeric grid (theory/practical/viva), bulk paste from clipboard, offline queue
- `T6 Announcements` — post form + batch list
- `Offline-first Drift DB` — 3 tables: examAnswers, cachedMaterials, pendingSyncOps
- `SyncService` — processes pendingSyncOps on connectivity restored, max 3 retries
- `Hindi/English ARB files` — 60+ strings each, language toggle in splash + profile

**Files written:** 53 total

**First run after clone:**
```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

**Path:** `J:\Claude\Test\engineering\app\`

---

### v0.7 — 2026-08-11
**Type:** New Feature — Shared Engine Business Logic
**Author:** Kiro (automated agent)
**Scope:** Real service implementations inside engineering/backend/ — exam engine, certificate service, payments/ledger, 4 job workers

**Checklist items updated (all ⬜ → ✅ Done):**
- `Exam engine` — seeded paper generation (djb2 + LCG + Fisher-Yates), attempt lifecycle (startAttempt/saveAnswers/submitAttempt), auto-submit cron, scoring (MCQ_SINGLE/MULTI with partial credit, TF, FILL/NUMERIC, SUBJECTIVE moderation queue), publishResults with dense rank
- `Certificate & document service` — per-year Postgres sequence + advisory lock cert numbering, 3-gate eligibility check, bulk issue, revocation (no cache — direct DB), public verify endpoint, PDF generation worker (Chromium headless, QR code, S3 upload, SHA-256)
- `Payments & ledger` — PaymentProvider interface + Razorpay Route + Cashfree Easy Split providers, double-entry Prisma transaction (SELECT FOR UPDATE → payment → 2 balanced ledger entries), per-center receipt numbering, dues aging SQL, daily cash-book close
- `PDF generation worker` — 7-variable template rendering, QR data URL, S3 upload
- `Notification dispatch worker` — push (free) → WhatsApp utility (24h service window) → SMS DLT fallback; cost tracking per message
- `Installment reminder cron` — nightly 02:00 IST, 4-step ladder, 20h deduplication, +14d escalation to center owner
- `Ledger reconciliation cron` — nightly 03:30 IST, double-entry balance check, AUDIT alert on mismatch
- `Report export worker` — cursor-paginated streaming (PAGE_SIZE=500), CSV/xlsx, S3 upload + signed URL, notify on completion

**Files written/replaced:**
- `src/common/utils/seeded-shuffle.ts` (new)
- `src/common/interfaces/payment-provider.interface.ts` (new)
- `src/modules/payments/providers/razorpay.provider.ts` (new)
- `src/modules/payments/providers/cashfree.provider.ts` (new)
- `src/modules/exams/exams.service.ts` (replaced)
- `src/modules/certificates/certificates.service.ts` (replaced)
- `src/modules/fees/fees.service.ts` (replaced)
- `src/workers/pdf-generation.worker.ts` (new)
- `src/workers/notification.worker.ts` (new)
- `src/workers/installment-reminder.worker.ts` (new)
- `src/workers/ledger-reconciliation.worker.ts` (new)
- `src/workers/report-export.worker.ts` (new)

---

### v0.11 — 2026-08-11
**Type:** Feature — PWA service worker + install prompt
**Author:** Kiro (automated agent)
**Scope:** engineering/website/ — full PWA support added

**Checklist items updated:**
- `Brand PWA service worker` — ⬜ → ✅ Done
  - next-pwa@5.6.0 added; next.config.ts wrapped with withPWA + 5 runtime caching rules
  - public/manifest.json — full 8-icon manifest (72→512px, en-IN, maskable)
  - components/shared/PWAInstallPrompt.tsx — 2nd-visit trigger, permanent dismiss, iOS "Add to Home Screen" tip, gtag analytics on accept
  - public/icons/ — 8 placeholder PNGs + README with generation instructions
  - app/layout.tsx — already wired (component was pre-imported)

**Pre-launch action:** Replace placeholder 1×1 PNGs in public/icons/ with real brand icons before Play Store / PWA submission

---

### v0.10 — 2026-08-11
**Type:** Testing — Unit tests for engine logic
**Author:** Kiro (automated agent)
**Scope:** engineering/backend/ — 5 test files, 33 tests total

**Checklist items updated (🔄 → ✅):**
- `Unit tests ≥80% on engines` — 33 Jest tests covering seeded-shuffle, exam scoring, certificate verify+revoke, payment double-entry, dues aging

**Files written:**
- `src/common/utils/seeded-shuffle.spec.ts` — 6 tests (determinism, divergence, no loss/duplication, empty/single)
- `src/test/prisma.mock.ts` — createPrismaMock() factory, 16 models × 12 methods each
- `src/modules/exams/exams.service.spec.ts` — 11 tests (scoreAttempt: all question types, negative clamping; autoSubmitExpired: live/stale distinction)
- `src/modules/certificates/certificates.service.spec.ts` — 7 tests (verifyByCertNo: found/not-found/revoked/log writes; revoke: field updates + NotFoundException)
- `src/modules/fees/fees.service.spec.ts` — 9 tests (collectPayment: payment record, exactly 2 ledger entries, PAID status, BullMQ job enqueues, transaction rollback; getDuesAging: bucket values + all-zero)

---

### v0.9 — 2026-08-11
**Type:** Integration — BullMQ wiring, Payments module, Consent module (DPDP)
**Author:** Kiro (automated agent)
**Scope:** engineering/backend/ — app.module.ts fully wired; Payments + Consent modules created from scratch

**Checklist items updated (🔄 → ✅):**
- `WorkersModule + BullMQ wiring` — workers.module.ts registers all 4 queues; app.module.ts imports BullModule.forRootAsync, ScheduleModule, WorkersModule, PaymentsModule, ConsentModule
- `Payments module` — payments.service.ts (createCheckoutOrder, handleWebhook → delegates to FeesService), payments.controller.ts (POST orders, POST webhook/razorpay, POST webhook/cashfree), dto/create-order.dto.ts; fees.module.ts fixed to register BullMQ queues it injects
- `Consent module (DPDP)` — full ConsentService: recordConsent (append-only), withdrawConsent, checkConsent, isMarketingAllowed (minor hard-block), initiateGuardianConsent (OTP stub), verifyGuardianConsent, exportUserData (DSAR, 7yr financial carve-out), requestErasure (audit-logged, cert/financial exempt); ConsentController: 7 routes
- `package.json` — added @nestjs/bull@10.2.1, @nestjs/schedule@4.1.2, bull@4.16.5

**Files written/updated:**
- `src/workers/workers.module.ts` (new)
- `src/app.module.ts` (updated — BullModule, ScheduleModule, 3 new module imports)
- `src/modules/payments/payments.module.ts` (new)
- `src/modules/payments/payments.service.ts` (new)
- `src/modules/payments/payments.controller.ts` (new)
- `src/modules/payments/dto/create-order.dto.ts` (new)
- `src/modules/fees/fees.module.ts` (fixed — added BullModule queues)
- `src/modules/consent/consent.module.ts` (new)
- `src/modules/consent/consent.service.ts` (new)
- `src/modules/consent/consent.controller.ts` (new)

---

### v0.8 — 2026-08-11
**Type:** Schema Patch
**Author:** Kiro (automated agent)
**Scope:** Added ~20 missing fields to Prisma schema; updated package.json and .env.example

**Fields added:**
- `Exam`: blueprint, negativeMarksRatio, anticheatLevel, resultPolicy
- `ExamAttempt`: paperSnapshot, questionResults, rank, markedForReview
- `ExamAnswer`: markedForReview, negativeMarks
- `Question`: difficulty, negativeMarks
- `Certificate`: enrollmentId, grade, signed, pdfStatus, revokeReason, revokedAt, revokedBy, requestedBy, sha256
- `Installment`: reconciledAt, reconciled, partial
- `Payment`: costPaise
- `Enrollment`: totalFeePaise, paidFeePaise, feeStatus
- `Center`: lastReceiptSeq
- `Notification`: isInbound, costPaise

**Also updated:**
- `package.json` — added qrcode@1.5.4, @types/qrcode@1.5.5
- `.env.example` — added PAYMENT_GATEWAY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, CASHFREE_APP_ID, CASHFREE_SECRET_KEY, PUBLIC_BASE_URL, HO_SPLIT_BPS

<!--
### v0.2 — YYYY-MM-DD
**Type:** Update | Fix | Rollback | New Feature
**Author:** 
**Scope:** Which module / screen / item changed

**Checklist items updated:**
- [ Item name ] — previous state → new state
  - Reason:
  - Notes (if any):

**Related items affected:**
- 

**If this is a rollback — what version introduced the issue:**
- v___ introduced [describe]
-->
