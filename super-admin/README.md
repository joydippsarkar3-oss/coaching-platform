# Binary Brain — Super Admin Panel (D5)

Head Office control plane for the Binary Brain franchise computer/vocational training platform.

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values, then start the dev server
npm run dev
```

The app runs on http://localhost:5173 by default.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `VITE_API_BASE_URL` | Backend REST API base URL | Yes |
| `VITE_APP_VERSION` | App version string (displayed in UI) | No |
| `VITE_MAPS_API_KEY` | Google Maps API key for network map view | No |

## Role Required

Access is restricted to two roles:

- **SUPER_ADMIN** — Full unrestricted access to all modules and settings
- **HO_STAFF** — Access scoped by permission presets configured by a SUPER_ADMIN

## Available Routes

| Path | Module | Description |
|---|---|---|
| `/login` | Login | Email + password + optional 2FA OTP |
| `/` | — | Redirects to `/dashboard` |
| `/dashboard` | H1 — Network Dashboard | KPIs, charts, leaderboard, alerts |
| `/centers` | H2 — Center Lifecycle | Prospect/Active/Frozen/Closed pipeline, provision |
| `/catalog` | H3 — Catalog Governance | Courses, syllabus builder, per-center grants |
| `/question-banks` | H4 — Question Banks | CRUD, bulk import, review workflow |
| `/exam-masters` | H5 — Exam Masters | Exam config, blueprint builder, bank lock |
| `/certificates` | H6 — Certificate Authority | Issuance queue, registry, legacy import, templates |
| `/finance` | H7 — Network Finance | HO charges, ledger, settlements, invoices |
| `/comms` | H8 — Comms Center | WhatsApp templates, broadcasts, analytics |
| `/users` | H12 — Users & Roles | HO staff, permissions, 2FA, sessions |
| `/audit` | H13 — Audit & Compliance | Logs, consent registry, retention, breach runbook |
| `/settings` | H14 — Platform Settings | Branding, payment, WABA, SMS, flags, versioning |

## Architecture

### Tech Stack
- **React 18 + Vite 5** — Build tooling
- **TypeScript 5.7** — Strict mode
- **Ant Design 5** — UI component library
- **Zustand** — Auth state (persisted to localStorage)
- **SWR** — Data fetching with 60s revalidation on dashboard KPIs
- **Axios** — HTTP client with Bearer auth + refresh queue
- **react-hook-form + zod** — All form validation
- **Recharts** — Line/Bar charts on dashboard and finance pages
- **i18next** — English / Hindi toggle (persisted in localStorage)
- **Tailwind CSS** — Utility classes alongside Ant Design

### Key Patterns

**Money:** All amounts are stored as paise (integer). Use `formatMoney(paise)` → `₹1,23,456` for display. `formatMoneyCompact(paise)` for dashboard cards.

**Dates:** All dates use IST (Asia/Kolkata) via dayjs. Helpers in `src/utils/dates.ts`.

**API Client:** `src/api/client.ts` — Bearer JWT auth, automatic refresh token queue on 401, AuditLogInterceptor that logs every POST/PUT/PATCH/DELETE to sessionStorage.

**Pagination:** All list endpoints use cursor-based pagination matching backend convention via `CursorParams`.

**Audit:** Every mutating API call is automatically logged by the interceptor in `api/client.ts`. The audit log can also be viewed in `H13-AuditCompliance`.

**Destructive actions:** Every freeze/close/revoke/delete requires a confirmation modal with a mandatory reason field (min 10 chars).

### Project Structure

```
src/
  api/
    client.ts             # Axios + Bearer auth + refresh queue + audit interceptor
    endpoints/            # auth, centers, catalog, questions, exams, certificates,
                          # finance, comms, users, audit, settings, dashboard
  components/
    layout/AppLayout.tsx  # Collapsible sidebar + header with lang toggle
    shared/               # StatCard, MoneyDisplay, StatusBadge, PageHeader,
                          # ExportButton, DataTable
  hooks/
    useAuth.ts            # Login/logout wrapper
    useApi.ts             # SWR wrapper
    usePollingApi.ts      # SWR with configurable refresh interval
  pages/
    Login.tsx
    H1-NetworkDashboard/
    H2-CenterLifecycle/
    H3-CatalogGovernance/
    H4-QuestionBanks/
    H5-ExamMasters/
    H6-CertificateAuthority/
    H7-NetworkFinance/
    H8-CommsCenter/
    H12-UsersRoles/
    H13-AuditCompliance/
    H14-PlatformSettings/
  router/
    index.tsx             # Full route tree
    PrivateRoute.tsx      # Admin JWT guard
  store/
    auth.store.ts         # Zustand, persisted to localStorage
  types/
    api.ts                # PaginatedResponse, ApiResponse, ApiError, CursorParams
    models.ts             # All domain model types
  utils/
    money.ts              # paise ↔ ₹ formatting
    dates.ts              # IST dayjs helpers
  i18n/
    index.ts              # i18next init
    en.json               # English translations
    hi.json               # Hindi translations
  App.tsx                 # ConfigProvider + SWRConfig + i18n
  main.tsx                # ReactDOM.createRoot
```

## Building for Production

```bash
npm run build
# Output in dist/
```

## Type Checking

```bash
npm run typecheck
```
