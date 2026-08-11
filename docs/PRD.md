# Product Requirements Document
## CompuTrain — Computer & Vocational Training Franchise Platform

**Version:** 1.0  
**Last updated:** 2026-08-11  
**Status:** Active Development · Phase 1 (MVP)  
**Author:** Nini Mini (Founder / Head Office)

---

## 1. Executive Summary

CompuTrain is a franchise-model computer and vocational training platform operating across multiple centers in India. The platform digitises every operational touchpoint — admissions, fee collection, exams, certificates, communications, and analytics — under a unified multi-tenant SaaS architecture.

The system is built for:
- **Franchise centers** that deliver training locally
- **Students** who enroll in courses and appear for exams
- **Teachers** who conduct classes and grade students
- **Head Office (HO)** that sets curriculum, issues certificates, and earns a revenue split from every enrollment

---

## 2. Problem Statement

India's vocational training sector is fragmented. Most franchise networks run on paper-based or disconnected systems resulting in:
- Revenue leakage from untracked enrollments and fee collections
- Manual certificate issuance vulnerable to fraud
- No standardised exam delivery or WPM/typing verification
- Slow admissions funnel (center walks away from leads)
- No consolidated analytics for the franchisor

---

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Fast admissions | Time from walk-in to enrollment | ≤ 5 minutes |
| Revenue integrity | Fee remittance accuracy | 100% to the paisa |
| Certificate trust | Employer verify page p95 latency | < 1.5 s |
| Exam scale | Concurrent exam attempts | 2,000 |
| Compliance | DPDP Act 2023 / RBI PA Directions | Full |

---

## 4. Users & Personas

| Persona | Key Needs |
|---|---|
| **Student** | Enroll, pay in installments, appear for exams, download certificates, practice typing |
| **Teacher** | Mark attendance, assign homework, answer doubts, view class roster |
| **Center Admin** | Manage admissions, collect fees, view reports, raise support tickets |
| **Super Admin (HO)** | Franchise CRM, content distribution, settlement reports, platform config |
| **Employer / Verifier** | Verify certificate authenticity via a public URL (no login) |

---

## 5. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Clients                                                     │
│  Next.js 15 website  ·  React+Vite center-admin             │
│  React+Vite super-admin  ·  Flutter app (Android)           │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTPS / REST + JSON
┌─────────────────────────▼────────────────────────────────────┐
│  NestJS 10 API (TypeScript)                                  │
│  JWT auth · TenantContextMiddleware · AsyncLocalStorage      │
│  BullMQ workers (5): notifications, certs, ledger,          │
│                       reminders, reports                     │
└───────────┬─────────────────────────┬────────────────────────┘
            │                         │
    ┌───────▼──────┐         ┌────────▼──────┐
    │ PostgreSQL 16 │         │  Redis 7       │
    │ Prisma 5 ORM  │         │  BullMQ cache  │
    └───────────────┘         └───────────────┘
```

**Key design decisions:**
- Multi-tenancy: `center_id` column on every table; `TenantContextMiddleware` injects from JWT
- Money: all amounts stored as `Int` in **paise** — never float, never string
- PKs: UUID everywhere; soft-delete only (`deletedAt DateTime?`)
- Compliance: double-entry ledger, DPDP consent architecture, 7-year financial retention
- Anti-fraud: seeded Fisher-Yates exam shuffle, anti-paste keystroke validation, device fingerprint binding

---

## 6. Feature Modules

### D1 — Public Website (Next.js 15)
| ID | Feature |
|---|---|
| W1 | Homepage with SEO, schema.org, per-center PWA manifest |
| W2 | Course catalogue (ISR) |
| W3 | Center locator |
| W4 | Enquiry form → backend lead |
| W5 | Certificate public verification (`/verify/[certNo]`) |
| W6 | Typing practice (public) |
| W7 | Franchise landing page |
| W8 | Blog / news (MDX) |
| W9 | Franchise application form |
| W10 | Student & teacher login (OTP) |
| W11 | PWA install prompt + service worker |
| W12 | Accessibility: WCAG 2.1 AA |
| W13 | next-intl i18n (EN/HI) |
| W14 | Legal pages (Terms, Privacy, Refund) |
| W15 | Status page |

### D2 — Backend API (NestJS)
| Module | Description |
|---|---|
| `auth` | OTP login, JWT RS256, refresh tokens |
| `users` | Profile, roles (STUDENT/TEACHER/CENTER_ADMIN/SUPER_ADMIN) |
| `centers` | Franchise center CRUD, settings |
| `courses` | Course + batch management |
| `center-courses` | Link courses to centers, pricing override |
| `enrollments` | Student → batch enrollment lifecycle |
| `students` | Student profile, guardian consent |
| `fees` | Installment schedule, collection, receipts |
| `payments` | Razorpay Route integration, order create, webhook |
| `exams` | Paper generation (seeded shuffle), attempt, grading |
| `certificates` | Issuance, atomic numbering, PDF, public verify |
| `typing` | TypingPassage/Test/Attempt, CPCT/SSC/DEST presets, leaderboard |
| `content-items` | Course materials (PDF/video/quiz), access rules |
| `notifications` | SMS (MSG91/DLT), WhatsApp (Meta Cloud API), FCM push, email |
| `webhooks` | Razorpay, Cashfree, WhatsApp, Meta Lead |
| `expenses` | Center expense tracking + inventory |
| `tickets` | Center→HO support tickets with messages |
| `consent` | DPDP Act purpose-coded consent versioning |
| `audit` | Immutable audit log |
| `enquiries` | Lead capture and conversion tracking |

### D3 — Flutter App (Android)
| ID | Screen |
|---|---|
| S1 | Splash + OTP login |
| S2 | Student dashboard |
| S3 | Course / batch |
| S4 | Fees & payments |
| S5 | Exam flow (offline queue, auto-submit) |
| S6 | Typing practice + leaderboard |
| S7 | Certificates |
| S8 | Wallet & referrals |
| S9 | Notifications |
| S10 | Doubts / chat |
| S11 | Profile |
| S12 | Attendance |
| S13 | Placement (P2) |
| T1 | Teacher dashboard |
| T2 | Class roster + attendance |
| T3 | Exam management |
| T4 | Homework |
| T5 | Doubts inbox |
| T6 | Certificates issued |
| T7 | Schedule / profile (P2) |

### D4 — Center Admin Panel (React + Vite + Ant Design)
| ID | Feature |
|---|---|
| C1 | Dashboard + daily stats |
| C2 | Admissions wizard |
| C3 | Student list + profile |
| C4 | Batch management |
| C5 | Fee collection + receipts |
| C6 | Exam scheduling |
| C7 | Results + certificate issue |
| C8 | Attendance management |
| C9 | Reports (daily/monthly) |
| C10 | Settings + staff |
| C11 | Wallet & promos (P1) |
| C12 | Marketing studio (P1) |
| C13 | Typing test administration |
| C14 | Expenses & inventory (P1) |

### D5 — Super Admin Panel (React + Vite + Ant Design)
| ID | Feature |
|---|---|
| H1 | Platform dashboard |
| H2 | Center provisioning |
| H3 | User & role management |
| H4 | Course library management |
| H5 | Settlement / reconciliation |
| H6 | Certificate authority |
| H7 | Notifications & campaigns |
| H8 | Platform configuration |
| H9 | Franchise CRM (P1) |
| H10 | Support desk (P1) |
| H11 | Content distribution (P1) |
| H12 | Audit log viewer |
| H13 | Data retention controls |
| H14 | Compliance dashboard (DPDP/RBI) |
| H15 | Analytics (P1→P2) |

---

## 7. Compliance & Regulatory

| Requirement | How met |
|---|---|
| **DPDP Act 2023** | Purpose-coded consent at collection, versioned records, guardian OTP for U-18, DSAR export/erasure endpoint, 30-day response SLA |
| **RBI PA Directions Sep 2025** | Center never pools student money at HO; double-entry ledger; Razorpay Route for direct settlement |
| **TRAI DLT mandate** | All transactional SMS sent via MSG91 DLT-registered template IDs; route=4 |
| **Income Tax / GST** | 7-year financial record retention; soft-delete only on ledger tables |
| **Play Store** | Play App Signing; privacy policy URL required on listing |

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | API p95 < 300 ms reads, < 800 ms writes; verify page p95 < 1.5 s |
| **Scale** | 2,000 concurrent exam attempts |
| **Availability** | 99.5% uptime (Phase 1); status page at `status.{brand}.in` |
| **Security** | OWASP ASVS L2; JWT RS256; HMAC-SHA256 webhook signatures; timingSafeEqual; no secrets in logs |
| **Backup** | Daily automated DB backup; weekly restore drill |
| **Observability** | Structured JSON logging; Sentry error tracking; uptime monitor |

---

## 9. Out of Scope (Phase 1)

- iOS app
- Live/video classes
- PKCS#7 organisational signing certificate
- Placement module (reserved schema, UI in P2)
- Desktop admin Electron app

---

## 10. Milestones

| Phase | Timeline | Key Deliverables |
|---|---|---|
| **Phase 0 — Foundation** | Month 1–3 | Backend API complete, website live, center-admin functional |
| **Phase 1 — MVP** | Month 4–6 | Flutter app live on Play Store, all P0 flows UAT-cleared, ≥5 pilot centers |
| **Phase 2 — Scale** | Month 7–12 | Super-admin analytics, franchise CRM, marketing studio, placement, performance hardening |
