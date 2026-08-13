# Remaining Work — PRD v1.0
**Project:** Computer & Vocational Training Platform
**Last updated:** 2026-08-13
**Legend:** ✅ Built & verified · ⬜ Not started · ⏸ Blocked (external) · ⚠️ Launch blocker · `P1` months 4–6 · `P2` months 7–12

**Verification basis:** every ✅ below compiles and, where tests exist, passes.
Current state: backend 79/79 unit tests green and `nest build` clean; website,
center-admin and super-admin all produce production bundles. The Flutter app has
no SDK on this machine, so it is verified structurally (imports resolve, no
missing local files) but not compiled — CI covers it.

---

## Infrastructure (needs AWS account / external setup)

- [ ] ⏸ AWS ap-south-1: ECS/EC2+Docker, RDS PostgreSQL 16, ElastiCache Redis
- [ ] ⏸ S3 (ap-south-1) + CloudFront (media, PDFs, backups)
- [x] ✅ Sentry + structured logging (`common/monitoring/sentry.setup.ts`, `GlobalExceptionFilter`) — DSN still needs to be set per environment
- [x] ✅ Health/readiness probes — unversioned `GET /health` and `GET /health/ready` (DB check), excluded from the `api/v1` prefix so load balancers and uptime monitors can reach them
- [ ] ⏸ DLT/SMS registration (MSG91-class gateway) — external lead time
- [ ] ⏸ WhatsApp Business Account (WABA) + Meta Cloud API setup — external lead time
- [ ] ⏸ Payment gateway keys — **DECIDE: Razorpay Route OR Cashfree Easy Split**, then add to `.env`
- [ ] ⏸ Play Store developer account (brand's own, NOT vendor) — external lead time
- [ ] ⏸ Org document-signer certificate (PKCS#7/PAdES) — external lead time
- [ ] ⬜ Uptime monitor wired to `/health` (needs a public URL) `P1`

---

## D2 Backend

- [x] ✅ Device binding for exam attempts — binds a SHA-256 of the client fingerprint on first `begin`, then rejects `begin`/`saveAnswers`/`submit` from any other device; the auto-submit cron is exempt; unbound attempts stay permissive so in-flight exams are never locked out. 10 unit tests cover it.
- [x] ✅ `typing_tests` / `typing_attempts` schema + API — CPCT/SSC/DEST presets, official WPM formulas, anti-paste hard block, leaderboard, key heatmap
- [x] ✅ `content_items` table + module (course materials: pdf/video/quiz, access rules)
- [x] ✅ `expenses` / `inventory_items` tables + module
- [x] ✅ `tickets` table + module (center→HO support, SLA fields)
- [x] ✅ `placements` / `employers` / `jobs` schema + module
- [x] ✅ Typing API endpoints
- [x] ✅ Webhooks module (payments, WhatsApp delivery/inbound, Meta lead-form) — handlers built; live credentials still pending
- [x] ✅ Test-only fixture module (`/e2e/seed`, `/e2e/teardown`, `/e2e/otp`) — mounted only when `E2E_FIXTURES_ENABLED=true` and `NODE_ENV !== production`, so the Playwright suite can provision logins without an SMS gateway

48 Prisma models, 25 modules.

---

## D1 Public Website

- [ ] ⚠️ **W14 Legal pages — LAUNCH BLOCKER** — Terms, Privacy (bilingual), Refund need **real legal text** (scaffold pages exist and render; hire a lawyer)
- [ ] ⬜ LCP < 2.5s on 4G, CLS < 0.1 — code-side optimisation done; the measurement needs real hosting + a Lighthouse run
- [x] ✅ Brand PWA service worker (next-pwa, 5 runtime-cache rules, InstallPrompt, 8 icons)
- [x] ✅ W15 Status page (`/status`)
- [x] ✅ Single consolidated `next.config.ts` — there were two competing configs (`.js` shadowing `.ts`), which broke the build by initialising next-intl without its request-config path. Merged; dropped `swcMinify`/`optimizeFonts` (removed in Next 15).

---

## D3 Android App

- [x] ✅ `firebase_options.dart` present and wired in `main.dart` — **values are placeholders**; regenerate from the Firebase Console before FCM push will actually deliver
- [x] ✅ **S6** Typing practice/test screen
- [x] ✅ **S8** Wallet & referrals screen
- [x] ✅ **S10** Doubts / batch chat
- [x] ✅ **S13** Placement screen
- [x] ✅ **T4** Homework assign/submissions
- [x] ✅ **T5** Doubts inbox (teacher side)
- [x] ✅ **T7** Teacher schedule/profile
- [x] ✅ Unit tests (money formatter, date utils) — CI ran `flutter test` against no `test/` directory, which fails the job
- [x] ✅ pubspec asset/font declarations no longer point at absent directories (that fails `flutter build`); re-add them alongside the real files

21 screens, 56 Dart files. Not compiled locally — no Flutter SDK on this machine.

---

## D4 Center Admin Panel

- [x] ✅ **C11** Wallet & promos
- [x] ✅ **C12** Marketing studio (topper poster, QR poster, WhatsApp share)
- [x] ✅ **C14** Expenses & inventory
- [x] ✅ Dependencies installable — `node_modules` was never populated; recharts 2.13.3 pinned React ≤18 against this project's React 19, so it is now 2.15.0
- [x] ✅ Auth wired to the real backend contract — the `@/api/endpoints/auth` module was missing entirely; login now calls `POST /auth/otp/request` and `/auth/otp/verify {phone, code}`, then fetches the profile from `GET /users/me` (verify returns tokens only). Logout is client-side; the backend issues stateless JWTs with no revocation route.
- [x] ✅ `/api/v1` prefix centralised in the API client — endpoint modules were inconsistent, two of seventeen hard-coding the prefix while the rest omitted it
- [x] ✅ Blob downloads unwrapped in one `getBlob` helper — nine endpoints returned `AxiosResponse<Blob>` into `URL.createObjectURL`
- [x] ✅ QR rendering moved onto the installed `qrcode` package (`qrcode.react` was imported but never a dependency)

17 page groups. Type-checks clean, production bundle builds.

---

## D5 Super Admin Panel

- [x] ✅ **H9** Franchise CRM (lead pipeline, territory checker)
- [x] ✅ **H10** Support desk (ticket queues, SLA timers, center health score)
- [x] ✅ **H11** Content distribution
- [x] ✅ **H15** Analytics (cohort funnels, course performance, verification analytics)

All 15 H-pages present. Type-checks clean, production bundle builds.

---

## Shared Engines

- [x] ✅ **Typing engine** — backend module + website TypingPractice widget (per-char highlighting, live stats, result modal, Hindi Devanagari) + TypingResultCard; 10 seed passages (5 EN + 5 HI)
- [x] ✅ **Exam engine** — seeded-shuffle paper generation, negative marking, auto-submit cron, device binding
- [x] ✅ **Certificate engine** — issue/bulk-issue, auto-issue per center `plan.auto_issue`, verification + revocation
- [x] ✅ **Fee engine** — installment ladder, receipts, ledger
- [x] ✅ **Communications hub — real channel integration** — WhatsApp 24-hour service window enforced (`whatsapp-window.service.ts` + `@@unique([phone])` schema constraint); per-center cost attribution (`channel-cost.ts`, env-overridable pricing, `costPaise` written on SENT); `GET /notifications/costs` and `GET /notifications/whatsapp-window/:phone` endpoints; daily prune worker (`prune-windows.worker.ts`). 19 new unit tests (window lifecycle, cost calculation). Meta Cloud API call remains a stub pending WABA setup; FCM needs real `firebase_options.dart`; SMS DLT gateway call is a stub pending registration.

---

## End-to-End Flows (UAT — all P0)

Specs exist for all six and now type-check against the real API contract. They
need a live stack to actually run.

- [ ] ⬜ **F1** Enquiry → Admission walkthrough on real stack (≤5 min desk time gate)
- [ ] ⬜ **F2** Fee installment lifecycle (reminder ladder → pay → receipt ≤30s → ledger)
- [ ] ⬜ **F3** Exam → result → certificate → employer verification (<1.5s); revocation test
- [ ] ⬜ **F4** Referral loop (share → friend enquiry → admission → wallet credit) `P1`
- [ ] ⬜ **F5** Franchise onboarding — W9 → H2 provision → first admission (zero-engineer test)
- [ ] ⬜ **F6** Guardian consent — U-18 admission → guardian OTP → marketing hard-blocked

---

## Testing & Quality

- [x] ✅ E2E suite wired into CI — a new `e2e` job boots Postgres + Redis, starts the backend and website, then runs Playwright and uploads the HTML report. The suite previously called `/e2e/seed` (which did not exist) and the wrong auth paths, and tried to log in as an admin that seeding had not yet created.
- [x] ✅ Load test: 2,000 concurrent exam attempts (k6 — `exam-surge.js`, `exam-concurrent.js`)
- [x] ✅ Load test: verify page p95 < 1.5s (`verify-page.js`)
- [x] ✅ Load test: API p95 baseline (`api-baseline.js`)
- [ ] ⬜ Run the load tests against real infra and record the numbers — the scripts assert the thresholds; nothing has executed them yet
- [ ] ⬜ OWASP ASVS L2 pen test (before Phase-2 scale)
- [x] ✅ Daily automated DB backups workflow + documented restore drill (`docs/BACKUP_RESTORE.md`, `scheduled-backup.yml`)
- [ ] ⬜ Actually perform a restore drill in staging
- [x] ✅ Data retention schedule documented (`docs/DATA_RETENTION.md`) — periods per data class, 7-year financial carve-out, and the erasure exemption the code enforces
- [x] ✅ Scheduled purge worker implementing that schedule — `DataRetentionWorker` runs daily at 2 AM, enforces all non-statutory retention periods (OTP 24h, notifications/WhatsApp 18mo, enquiries 24mo, closed tickets 3yr, typing attempts 2yr, closed accounts 90d, audit logs 7yr); 10 unit tests. Financial records and certificates remain exempt (7-year statutory hold).

CI has 6 jobs: backend, website, center-admin, super-admin, e2e, flutter-app.

---

## Fixed during this build pass

Issues that would each have failed a deploy, found while building the above:

- Backend production entrypoint — `nest build` emits `dist/src/main.js`, but both
  `start:prod` and the Dockerfile `CMD` pointed at `dist/main.js`. The container
  would have crash-looped on start.
- Website had two Next configs; the `.js` one shadowed the `.ts` one and
  initialised next-intl without its request-config path, so `next build` failed
  outright.
- center-admin had never had `npm install` succeed (React 19 vs recharts peer
  conflict), and 17 TypeScript errors behind that.
- The Playwright suite targeted endpoints and auth payloads that did not exist.
- Flutter pubspec declared asset and font directories that were absent.

---

## MVP Definition of Done (all must pass before public launch)

- [ ] F1–F6 green in UAT
- [ ] All P0 items above cleared
- [ ] Legal pages live (real text) ⚠️
- [ ] Real `firebase_options.dart` in place and a push delivered end-to-end
- [ ] Split settlement reconciles to the paisa across 100 test transactions
- [ ] Exam surge test: 2,000 concurrent passed
- [ ] Verify page <1.5s under load
- [ ] Play Store listing approved ⏸
- [ ] Restore drill passed
- [ ] UAT with ≥5 pilot centers, each processing ≥1 real admission
