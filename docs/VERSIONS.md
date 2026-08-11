# Version History — CompuTrain Coaching Platform

> Semantic versioning: `MAJOR.MINOR.PATCH`  
> All dates in IST (Asia/Kolkata).

---

## v0.9.0 — 2026-08-11 (Current — Pre-launch)

### Backend (NestJS 10 + Prisma 5)
- **New modules:** `content-items`, `expenses`, `inventory`, `tickets`, `webhooks`
- **Schema additions:** `InventoryItem`, `WhatsappWindow`, `TicketMessage`; `deviceFingerprint` on `ExamAttempt`; `deletedAt` soft-delete on `Ticket` and `Expense`
- **Notifications:** Real MSG91 DLT SMS provider (`route=4`); Real Meta Cloud API v19+ WhatsApp provider; `dispatch()` wired to both channels
- **Webhooks:** Razorpay HMAC-SHA256 + `timingSafeEqual`; Cashfree HMAC-SHA256 with timestamp prefix; WhatsApp 24h service-window upsert; Meta Lead Form handler
- **Payments:** Razorpay Route order creation + settlement split (basis points); webhook reconciliation; `finalizePayment` double-entry ledger flow
- **Typing engine:** `TypingPassage` / `TypingTest` / `TypingAttempt` schema; CPCT/SSC/DEST presets; official WPM formula; anti-paste hard block; leaderboard; 10 seed passages (5 EN + 5 HI)
- **Compliance:** Data retention schedule (`docs/data-retention.md`); DPDP consent architecture; 7-year financial retention; DSAR export/erasure

### Website (Next.js 15)
- **Legal pages:** Terms, Privacy (EN/HI bilingual), Refund — demo-ready, LAUNCH BLOCKER banners removed
- **Typing widget:** `TypingPractice` (per-char highlighting, live stats, result modal, Hindi Devanagari); `TypingResultCard` (PASS/FAIL badge, share button)
- **Payment UI:** `RazorpayCheckout` component (loads `checkout.js`, handles success/failure/dismiss, TEST MODE badge)
- **PWA:** `next-pwa` service worker, 5 cache rules, `InstallPrompt`, 8 placeholder icons

### Flutter App (Android)
- **New screens:** S6 Typing practice + leaderboard; S8 Wallet; S10 Student doubts; T4 Homework; T5 Teacher doubts inbox
- **Payment screen:** `PaymentPage` — WebView-based Razorpay checkout, JS↔Flutter channel
- **Navigation:** `AppRoutes` extended with 5 new routes; GoRouter shells updated
- **API models:** `WalletBalance`, `WalletTransaction`, `TypingLeaderboardEntry`, `Doubt`, `HomeworkAssignment`; 9 new API service methods
- **Firebase:** `firebase_options.dart` stub with `PLACEHOLDER_*` — ready for `flutterfire configure`

### Android Build
- `key.properties.example` added; `build.gradle` signing block (release keystore with debug fallback)
- `docs/PLAY_STORE.md` — full release guide

### E2E Tests (Playwright)
- 6 spec files: F1 student login, F2 course enrollment, F3 fee payment, F4 exam flow, F5 certificate, F6 center admin admission
- Global setup, seed/teardown helpers, API client

---

## v0.8.0 — 2026-08 (Backend foundation)

- Auth module: OTP login, JWT RS256, refresh tokens
- Core modules: users, centers, courses, enrollments, students, fees, exams, certificates
- Double-entry ledger: `LedgerEntry`, `Settlement`, `WalletTxn`
- DPDP consent: purpose-coded, versioned, guardian OTP for U-18
- Certificate: atomic sequence numbering (advisory lock + Postgres sequence per year); PDF; public verify endpoint
- Exam: seeded Fisher-Yates shuffle (djb2 + LCG); anti-paste keystroke validation
- Multi-tenancy: `TenantContextMiddleware` + `AsyncLocalStorage`; `center_id` on all tables

---

## v0.7.0 — 2026-08 (Website & Admin panels)

- Next.js 15 website: homepage, course catalogue (ISR), center locator, enquiry form, franchise landing, blog (MDX)
- Center-admin panel: React + Vite + Ant Design; screens C1–C10, C13
- Super-admin panel: React + Vite + Ant Design; screens H1–H8, H12–H14
- next-intl i18n (EN/HI); per-center PWA manifests; schema.org structured data

---

## Planned

### v1.0.0 — MVP Launch
- All P0 checklist items cleared
- Legal pages signed off by lawyer
- Razorpay Route live keys in production `.env`
- Firebase configured (`firebase_options.dart` with real values)
- Play Store listing approved (Android)
- UAT with ≥5 pilot centers
- E2E suite green on real stack

### v1.1.0 — Phase 1 (Month 4–6)
- Super-admin: franchise CRM (H9), support desk (H10), content distribution (H11), analytics (H15)
- Center-admin: wallet & promos (C11), marketing studio (C12), expenses & inventory (C14)
- Flutter: placement screen (S13), teacher schedule (T7)
- Status page `status.{brand}.in`
- Load test: 2,000 concurrent exams green

### v2.0.0 — Phase 2 (Month 7–12)
- iOS app
- Advanced analytics + cohort funnels
- Employer API (bulk certificate verification)
- Multi-language content (regional Indian languages)
