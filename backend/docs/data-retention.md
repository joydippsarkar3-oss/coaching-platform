# Data Retention Policy

**Effective date:** 2026-08-01  
**Classification:** Internal — Engineering Reference  
**Owner:** Head Office, Data Protection Officer

---

## 1. Principles

All data stored by the platform is subject to the following principles:

- **Soft-delete only.** No hard-deletes except by explicit DSAR erasure (DPDP Act 2023 § 13) or automated purge jobs.
- **Audit trail preserved.** `AuditLog` rows are never erased; they are anonymised when the referenced user is erased.
- **Money never deleted.** Financial records (`Payment`, `LedgerEntry`, `Settlement`, `Installment`) are retained for **7 years** per RBI record-keeping norms and GST Act 2017.
- **Paise only.** All monetary amounts are integers in paise; no floats, no strings.

---

## 2. Retention Schedule

| Table | Retention | Trigger | Action after expiry |
|---|---|---|---|
| `AuditLog` | Permanent | — | Keep; anonymise `userId` on DSAR erasure |
| `Certificate` | Permanent | — | Never erased; status may be set to REVOKED |
| `VerificationLog` | Permanent | — | Keep for certificate integrity |
| `Payment` | 7 years | `createdAt` | Archive to cold storage (S3 Glacier); purge DB row |
| `LedgerEntry` | 7 years | `createdAt` | Same |
| `Settlement` | 7 years | `settledAt` | Same |
| `Installment` | 7 years | `dueDate` | Same |
| `WalletTxn` | 7 years | `createdAt` | Same |
| `Enrollment` | 7 years | `completedAt` or `updatedAt` | Archive |
| `Student` (PII fields) | DSAR erasure on request; otherwise 5 years post last activity | — | Nullify name/phone/email; retain UUID and financial FK |
| `Consent` | 3 years after withdrawal or student deletion | `updatedAt` | Purge |
| `ExamAttempt` | 3 years | `submittedAt` | Purge `paperSnapshot` JSON; keep aggregate score |
| `TypingAttempt` | 2 years | `completedAt` | Purge; retain leaderboard aggregate |
| `Notification` | 1 year | `createdAt` | Purge |
| `OtpCode` | 30 days | `createdAt` | Purge |
| `WhatsappWindow` | 90 days after `expiresAt` | `expiresAt` | Purge |
| `Ticket` / `TicketMessage` | 3 years | `resolvedAt` | Purge |
| `Enquiry` / `FollowUp` | 2 years (if not converted) | `createdAt` | Purge |
| `AuditLog` entries referencing purged PII | Permanent | — | Anonymise: set `userId = null`, redact `oldValue`/`newValue` PII fields |

---

## 3. Automated Purge Jobs

Implemented in `src/workers/ledger-reconciliation.worker.ts` and a future dedicated `purge.worker.ts`:

```
Cron: 0 2 * * 0   (Sundays 02:00 IST)
```

Steps:
1. Find `OtpCode` where `createdAt < NOW - 30d` → hard delete.
2. Find `Notification` where `createdAt < NOW - 1y` → hard delete.
3. Find `WhatsappWindow` where `expiresAt < NOW - 90d` → hard delete.
4. Find `TypingAttempt` where `completedAt < NOW - 2y` → hard delete.
5. Find `ExamAttempt` where `submittedAt < NOW - 3y` → nullify `paperSnapshot`, keep scores.
6. Find financial records where `createdAt < NOW - 7y` → export to S3 Glacier, then hard delete.
7. Emit `data_purge_completed` audit log entry with counts.

---

## 4. DSAR — Data Subject Access Requests (DPDP Act 2023)

**Export (§ 11):** Handled by `ConsentService.exportUserData(studentId)`.  
Returns a JSON bundle of all personal data within **30 days** of request.

**Erasure (§ 13):** Handled by `ConsentService.requestErasure(studentId)`.  
- Nullifies `Student.name`, `.email`, `.phone`, `.address`, `.photoUrl`, `.guardianName`, `.guardianPhone`.
- Sets `Student.isActive = false`.
- Anonymises linked `AuditLog` rows.
- Retains UUID and all financial FKs for 7-year compliance.
- Logs erasure in `AuditLog` with `action = 'DSAR_ERASURE'`.
- **Cannot be reversed.**

**Guardian consent (U-18, § 9):** Guardian phone OTP required before any marketing consent for students with `dob` showing age < 18. Implemented in `ConsentService.initiateGuardianConsent` / `verifyGuardianConsent`.

---

## 5. Certificate Permanence

Certificates are **never deleted** even after DSAR erasure, because:
- They are public legal instruments.
- `Certificate.certificateNo` is a permanent, globally unique identifier.
- The student's name in the certificate PDF is part of the issued document; the DB record's `studentId` FK is retained but the `Student` row is anonymised.

---

## 6. Financial Record Archival to S3 Glacier

Before purging any financial row:
1. Export the full row as JSON.
2. Upload to `s3://[BUCKET]/archive/financial/{table}/{year}/{id}.json.gz` with AES-256 server-side encryption.
3. Tag with `retention=7y`, `purpose=rbi_compliance`.
4. Record `AuditLog` entry: `action = 'ARCHIVED_TO_GLACIER'`.
5. Hard delete the DB row.

---

## 7. External Accounts and Regulatory Contacts

| System | Purpose | Retention governed by |
|---|---|---|
| Razorpay / Cashfree | Payment gateway | Their own T&C + RBI norms |
| Firebase (push) | Push notifications | Google ToS; tokens purged from our DB per §2 above |
| AWS S3 | PDF/receipt storage | 7-year lifecycle policy on `financial/` prefix |
| WABA (WhatsApp) | Marketing + inbound | Meta ToS; 24h window tracked locally |

---

## 8. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-08-01 | Initial policy |
