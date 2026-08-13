# Data Retention Schedule

**Scope:** all personal and transactional data held by the platform (backend
Postgres, S3 objects, backups, logs).

This document records *how long* each class of data is kept and *what happens*
at the end of that period. The code that enforces the financial carve-out lives
in `backend/src/modules/consent/consent.service.ts` — an erasure request never
deletes rows that fall under a statutory hold.

---

## Retention periods

| Data class | Examples (tables / stores) | Retention | End-of-life action |
|---|---|---|---|
| Financial records | `Payment`, `Installment`, `LedgerEntry`, `Settlement`, receipt PDFs in S3 | **7 years** from transaction date | Purge after the statutory period; exempt from subject erasure until then |
| Certificates & exam evidence | `Certificate`, `ExamAttempt`, `ExamAnswer`, `VerificationLog` | **7 years** from issue date | Retained for employer verification; exempt from erasure |
| Student master data | `Student`, `Enrollment`, `Consent` | Active enrollment **+ 3 years** | Anonymised (name, phone, email, photo cleared); enrollment history kept in aggregate |
| Guardian / consent records | `Consent`, `ConsentRequest` | Same as the student record they authorise | Deleted with the student record |
| Auth and account data | `User`, `RoleAssignment` | Until account closure **+ 90 days** | Hard delete after the grace period |
| OTP codes | `OtpCode` | **15 minutes** (expiry), rows pruned at **24 hours** | Hard delete |
| Marketing / comms logs | `Notification`, `WhatsappWindow`, `MessageTemplate` sends | **18 months** | Hard delete; per-center cost aggregates retained |
| Enquiries (non-converted) | `Enquiry`, `FollowUp` | **24 months** from last contact | Hard delete |
| Support tickets | `Ticket`, `TicketMessage` | **3 years** from close | Hard delete |
| Audit logs | `AuditLog` | **7 years** | Immutable for the period, then purged |
| Typing attempts | `TypingAttempt` | **2 years** | Hard delete; personal-best rows retained without keystroke detail |
| Database backups | S3 backup bucket | **35 days** (see `BACKUP_RESTORE.md`) | Lifecycle-expired by S3 |
| Application logs | CloudWatch / Sentry | **90 days** | Provider-side expiry |

---

## Statutory basis for the 7-year holds

Indian tax and companies legislation requires books of account and supporting
vouchers to be preserved for eight financial years in some cases; the platform
standardises on **7 years from the end of the relevant financial year**, which is
the longest period any of the financial data classes above needs. Certificates
carry the same period so that an employer verification never resolves against a
record that has been deleted while still being cited on a CV.

**Consequence for subject rights:** a data-subject erasure request is honoured
for everything *except* the rows above. `requestErasure` records the request,
notifies HO for review, and states the carve-out explicitly rather than silently
retaining data.

---

## Enforcement

- **Erasure carve-out:** enforced in code (`consent.service.ts`); financial
  queries filter on `paidAt >= sevenYearsAgo`.
- **Backup expiry:** enforced by the S3 lifecycle policy in `BACKUP_RESTORE.md`.
- **Everything else:** currently manual. A scheduled purge worker is the
  outstanding piece — the periods above are the specification it should
  implement, one job per data class, each writing an `AuditLog` entry recording
  how many rows it removed.

---

## Review

Re-read this schedule whenever a new table holding personal data is added. A
table with no row in the matrix above has no defined retention, which is itself
a compliance gap.
