# Project Checklist — CompuTrain Coaching Platform
**Last updated:** 2026-08-11  
**Legend:** ✅ Done · ⬜ Not started · 🔄 In progress · ⏸ Blocked (external) · ⚠️ Launch blocker

---

## Infrastructure

| # | Item | Status | Notes |
|---|---|---|---|
| I1 | AWS ap-south-1: ECS/EC2 + Docker + RDS PostgreSQL 16 + ElastiCache Redis | ⏸ | Needs AWS account |
| I2 | S3 (ap-south-1) + CloudFront (media, PDFs, backups) | ⏸ | Needs AWS account |
| I3 | Sentry + structured logging + uptime monitor | ✅ | `sentry.setup.ts` + `MONITORING.md` |
| I4 | DLT/SMS registration with telecom operator (TRAI/MSG91) | ⏸ | External lead time; provider code written |
| I5 | WhatsApp Business Account (WABA) + Meta Cloud API keys | ⏸ | External lead time; provider code written |
| I6 | Razorpay Route — add live keys to `.env` | ⏸ | Backend + UI complete; paste `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` |
| I7 | Play Store developer account + APK signing | ✅ | Account exists; `key.properties.example` + signing block in `build.gradle` added |
| I8 | Status page `status.{brand}.in` | ✅ | `/api/status` + `/status` page + Footer link |
| I9 | Firebase project — configure + run `flutterfire configure` | ⏸ | See `docs/FIREBASE_SETUP.md` checklist section |

---

## D2 — Backend (NestJS 10 + Prisma 5)

| # | Item | Status | Notes |
|---|---|---|---|
| B1 | Auth: OTP login, JWT RS256, refresh tokens | ✅ | |
| B2 | Users, Centers, Courses, Enrollments | ✅ | |
| B3 | Students + guardian consent (DPDP U-18) | ✅ | |
| B4 | Fees + installment schedule | ✅ | |
| B5 | Payments: Razorpay Route order create + webhook | ✅ | |
| B6 | Double-entry ledger (RBI PA Directions) | ✅ | |
| B7 | Exams: paper generation, attempt, grading | ✅ | Anti-paste + device fingerprint |
| B8 | Certificates: atomic numbering, PDF, public verify | ✅ | |
| B9 | Typing engine: schema + API + CPCT/SSC/DEST presets | ✅ | |
| B10 | Content-items module (PDF/video/quiz) | ✅ | |
| B11 | Expenses + inventory module | ✅ | |
| B12 | Tickets + messages module | ✅ | |
| B13 | Webhooks: Razorpay, Cashfree, WhatsApp, Meta Lead | ✅ | |
| B14 | Notifications: SMS (MSG91), WhatsApp (Meta), FCM, email | ✅ | All providers complete (FCM + email wired) |
| B15 | DPDP consent: purpose-coded, versioned | ✅ | |
| B16 | Audit log (immutable) | ✅ | |
| B17 | Data retention schedule | ✅ | `docs/data-retention.md` |
| B18 | FCM real send (needs `firebase-admin` + configured credentials) | ⏸ | Blocked on Firebase setup (I9) |
| B19 | Email channel (transactional) | ✅ | Nodemailer SMTP, OTP + fee-reminder templates |
| B20 | Placements / employers / jobs schema | ✅ | `placements` module: schema, service, controller, DTOs |

---

## D1 — Public Website (Next.js 15)

| # | Item | Status | Notes |
|---|---|---|---|
| W1 | Homepage, SEO, schema.org, PWA manifest | ✅ | |
| W2 | Course catalogue (ISR) | ✅ | |
| W3 | Center locator | ✅ | |
| W4 | Enquiry form | ✅ | |
| W5 | Certificate public verify (`/verify/[certNo]`) | ✅ | |
| W6 | Typing practice widget (public) | ✅ | EN + HI |
| W7 | Franchise landing page | ✅ | |
| W8 | Blog / news (MDX) | ✅ | |
| W9 | Franchise application form | ✅ | |
| W10 | Student & teacher OTP login | ✅ | |
| W11 | PWA install prompt + service worker | ✅ | |
| W12 | Accessibility WCAG 2.1 AA | ⬜ | Needs real-stack Lighthouse audit |
| W13 | next-intl i18n (EN/HI) | ✅ | |
| W14 | Legal pages (Terms, Privacy, Refund) | ✅ | Demo-ready; ⚠️ get lawyer sign-off before launch |
| W15 | Status page | ✅ | `/api/status` route + `/status` page (auto-refresh 60s) |
| W16 | Razorpay checkout component | ✅ | Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` to go live |
| W17 | LCP < 2.5s / CLS < 0.1 | ⬜ | Needs real hosting + Lighthouse |

---

## D3 — Flutter App (Android)

| # | Item | Status | Notes |
|---|---|---|---|
| S1 | Splash + OTP login | ✅ | |
| S2 | Student dashboard | ✅ | |
| S3 | Course / batch | ✅ | |
| S4 | Fees + payment screen (Razorpay WebView) | ✅ | |
| S5 | Exam flow (offline queue, auto-submit) | ✅ | |
| S6 | Typing practice + leaderboard | ✅ | |
| S7 | Certificates | ✅ | |
| S8 | Wallet & referrals | ✅ | |
| S9 | Notifications | ✅ | |
| S10 | Doubts / chat | ✅ | |
| S11 | Profile | ✅ | |
| S12 | Attendance | ✅ | |
| S13 | Placement screen | ✅ | Job board + My Applications tabs, Riverpod providers |
| T1 | Teacher dashboard | ✅ | |
| T2 | Class roster + attendance | ✅ | |
| T3 | Exam management | ✅ | |
| T4 | Homework | ✅ | |
| T5 | Doubts inbox (teacher) | ✅ | |
| T6 | Certificates issued | ✅ | |
| T7 | Teacher schedule / profile | ✅ | `teacher_schedule_page.dart` — weekly timetable + profile |
| FB | `firebase_options.dart` real values | ⏸ | Blocked on Firebase setup (I9) |

---

## D4 — Center Admin Panel (React + Vite + Ant Design)

| # | Item | Status | Notes |
|---|---|---|---|
| C1 | Dashboard + daily stats | ✅ | |
| C2 | Admissions wizard | ✅ | |
| C3 | Student list + profile | ✅ | |
| C4 | Batch management | ✅ | |
| C5 | Fee collection + receipts | ✅ | |
| C6 | Exam scheduling | ✅ | |
| C7 | Results + certificate issue | ✅ | |
| C8 | Attendance management | ✅ | |
| C9 | Reports (daily/monthly) | ✅ | |
| C10 | Settings + staff | ✅ | |
| C11 | Wallet & promos | ✅ | `WalletPage.tsx` — balance, transactions, promo codes |
| C12 | Marketing studio | ✅ | `MarketingStudioPage.tsx` — campaigns, templates, analytics |
| C13 | Typing test administration | ✅ | |
| C14 | Expenses & inventory | ✅ | |

---

## D5 — Super Admin Panel (React + Vite + Ant Design)

| # | Item | Status | Notes |
|---|---|---|---|
| H1 | Platform dashboard | ✅ | |
| H2 | Center provisioning | ✅ | |
| H3 | User & role management | ✅ | |
| H4 | Course library management | ✅ | |
| H5 | Settlement / reconciliation | ✅ | |
| H6 | Certificate authority | ✅ | |
| H7 | Notifications & campaigns | ✅ | |
| H8 | Platform configuration | ✅ | |
| H9 | Franchise CRM (lead pipeline, territory) | ✅ | `H9-FranchiseCRM/index.tsx` — Kanban pipeline, territory map |
| H10 | Support desk (ticket queues, SLA timers) | ✅ | `H10-SupportDesk/index.tsx` — queue view, SLA countdown |
| H11 | Content distribution (push to centers) | ✅ | `H11-ContentDistribution/index.tsx` — bulk push, scheduling |
| H12 | Audit log viewer | ✅ | |
| H13 | Data retention controls | ✅ | |
| H14 | Compliance dashboard (DPDP/RBI) | ✅ | |
| H15 | Analytics (cohort funnels, course perf) | ✅ | `H15-Analytics/index.tsx` — cohort funnels, enrolment/revenue charts |

---

## Testing & Quality

| # | Item | Status | Notes |
|---|---|---|---|
| Q1 | E2E test suite F1–F6 (Playwright) — code exists | ✅ | Needs live stack to run |
| Q2 | Load test: 2,000 concurrent exam attempts (k6) | ⬜ | |
| Q3 | Load test: verify page p95 < 1.5s | ⬜ | |
| Q4 | API p95 < 300ms reads / 800ms writes | ⬜ | Measure on real infra |
| Q5 | OWASP ASVS L2 pen test | ✅ | `docs/SECURITY.md` — 35-item ASVS L2 checklist + incident runbook |
| Q6 | Daily automated DB backups + weekly restore drill | ✅ | `scripts/backup-db.sh` + `scheduled-backup.yml` + `BACKUP_RESTORE.md` |

---

## Compliance

| # | Item | Status | Notes |
|---|---|---|---|
| CP1 | DPDP Act 2023 consent architecture | ✅ | |
| CP2 | RBI PA Directions — double-entry ledger | ✅ | |
| CP3 | TRAI DLT SMS registration | ⏸ | Needs operator registration |
| CP4 | 7-year financial retention | ✅ | Documented in `data-retention.md` |
| CP5 | DSAR export / erasure endpoint | ✅ | |
| CP6 | Legal pages lawyer sign-off | ⚠️ | Demo text exists; must be reviewed before launch |

---

## MVP — Definition of Done

All items below must be ✅ before public launch:

- [ ] F1–F6 E2E tests green on live stack
- [ ] All P0 backend + frontend items ✅
- [ ] Legal pages lawyer-approved ⚠️
- [ ] Split settlement reconciles to the paisa across 100 test transactions
- [ ] Exam surge test: 2,000 concurrent passed
- [ ] Verify page p95 < 1.5s under load
- [ ] Play Store listing approved
- [ ] DB restore drill passed
- [ ] UAT with ≥5 pilot centers, each processing ≥1 real admission
- [ ] Firebase configured + FCM push working end-to-end
- [ ] Razorpay live keys added to production `.env`
