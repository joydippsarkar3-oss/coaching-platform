# Center Admin Panel (D4)

Production-ready React + Vite + Ant Design admin panel for a franchise computer/vocational training platform.

## Tech Stack

| Layer | Library | Version |
|-------|---------|---------|
| UI framework | React | 19.1.0 |
| Build tool | Vite | 5.4.10 |
| Component library | Ant Design | 5.22.7 |
| Layout shell | @ant-design/pro-layout | 7.22.1 |
| Routing | React Router v7 | 7.2.0 |
| State management | Zustand | 5.0.3 |
| Data fetching | SWR | 2.3.0 |
| HTTP client | Axios | 1.7.9 |
| Forms | react-hook-form + zod | 7.54.2 / 3.24.1 |
| Dates | dayjs (IST timezone) | 1.11.13 |
| i18n | i18next + react-i18next | 23.16.8 / 15.4.0 |
| Styling | Tailwind CSS (utilities) | 3.4.17 |
| Language | TypeScript (strict) | 5.6.2 |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL (no trailing slash) | `http://localhost:8080` |
| `VITE_APP_NAME` | App name shown in browser tab | `Center Admin` |

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Type-check
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  main.tsx              — App entrypoint, AntD ConfigProvider
  router/
    index.tsx           — React Router v7 route tree
    PrivateRoute.tsx    — JWT auth guard
  store/
    auth.store.ts       — Zustand persisted auth (user, tokens)
    tenant.store.ts     — Zustand persisted center context
  api/
    client.ts           — Axios instance with JWT + refresh interceptors
    endpoints/          — Typed API functions per domain
  pages/
    auth/LoginPage      — Phone OTP login (6-digit auto-submit)
    dashboard/          — C1: KPI cards + action feed (30s polling)
    enquiries/          — C2: Stage-tabbed table + add drawer
    admissions/         — C3: 5-step wizard (OTP consent, UPI QR)
    students/           — C4: Roster + 360 detail (8 lazy tabs)
    batches/            — C5: Batch management
    attendance/         — C6: Daily register per batch
    fees/               — C7: Dues aging + installment collector
    exams/              — C8: Schedule + Lab Mode monitor
    certificates/       — C9: Eligibility table + bulk request
    staff/              — C10: Staff profiles + roles
    microsite/          — C13: CMS editor
    reports/            — C15: CSV exports
    settings/           — C16: Center profile + KYC status
  components/
    layout/             — AppLayout (ProLayout), Header, Sidebar
    shared/             — MoneyDisplay, StatusBadge, StatCard, etc.
  hooks/
    useAuth.ts          — Login/logout helpers
    useTenant.ts        — Center context loader
    useApi.ts           — SWR wrapper (useApi, usePollingApi)
  utils/
    money.ts            — paise <-> rupee, Indian number formatting
    dates.ts            — dayjs IST helpers
    validation.ts       — Zod schemas
  types/
    api.ts              — All API request/response types
    models.ts           — Domain model types
  i18n/
    en.json, hi.json    — English / Hindi translations
```

## Key Conventions

### Money
All amounts are stored and transmitted as **paise** (integer). Always render through `<MoneyDisplay paise={v} />` which formats as `₹1,23,456`.

### Dates
All dates use **IST (Asia/Kolkata)**. Use helpers from `src/utils/dates.ts` (`nowIST()`, `toIST()`, `formatDate()`, etc.) — never use raw `new Date()`.

### Auth
- JWT stored in `localStorage` (`accessToken`, `refreshToken`)
- Axios interceptor auto-attaches Bearer token
- On 401 → refresh → retry original request
- On refresh failure → clear tokens → redirect to `/login`

### Destructive Actions
Every delete/close/drop action uses `confirmAction()` from `src/components/shared/ConfirmModal.tsx` which wraps AntD `Modal.confirm`.

### Exports
Every data table includes `<ExportButton>` that downloads a CSV blob.

## Authentication Flow

1. User enters 10-digit mobile number
2. OTP sent to mobile via `/auth/otp/send`
3. 6-digit OTP auto-submits on last digit via `/auth/otp/verify`
4. JWT pair stored; user redirected to `/dashboard`

## i18n

Toggle language (EN/HI) via the globe icon in the header. Language persisted in `localStorage` as `lang`.

To add a new language:
1. Add a JSON file in `src/i18n/`
2. Import and register it in `src/i18n/index.ts`
3. Add the toggle option in `src/components/layout/Header.tsx`
