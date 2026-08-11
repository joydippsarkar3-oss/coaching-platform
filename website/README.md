# CompuTrain — Public Website (D1)

Production-ready Next.js 15 SSR website for the CompuTrain franchise computer/vocational training platform.

## Tech Stack

- **Framework:** Next.js 15.3.3 (App Router, SSR)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 3.4
- **i18n:** next-intl 3.26 (English default, Hindi at `/hi/`)
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Project Structure

```
app/                    # Next.js App Router pages
  layout.tsx            # Root layout: fonts, i18n, PWA meta
  page.tsx              # W1 Home
  courses/              # W2 Courses catalog + W3 Course detail
  centers/              # W4 Centers directory
  c/[centerSlug]/       # W5 Center microsite + W5b Center×Course landing
  apply/                # W6 Admission / Apply
  results/              # W7 Results lookup
  verify/               # W8 Verification portal + QR landing
  franchise/            # W9 Franchise
  about/                # W10 About
  student-corner/       # W11 Student Corner
  blog/                 # W12 Blog index + blog post
  contact/              # W13 Contact
  legal/                # W14 Terms, Privacy, Refund
  api/                  # Route handlers (proxies to backend)
components/             # React components
  ui/                   # Primitives: Button, Card, Badge, Input, Modal
  layout/               # Header, Footer, WhatsAppFloatingButton
  home/                 # All home page sections
  courses/              # CourseCard, CourseFilters
  centers/              # CenterCard, CentersMap
  verify/               # VerificationResult, CertificateResult, StudentResult, CenterResult
  shared/               # EnquiryForm, SchemaOrg, PWAInstallPrompt
lib/
  api.ts                # Typed API client
  i18n.ts               # next-intl config
  metadata.ts           # generateMetadata helpers
  schema-org.ts         # Typed JSON-LD builders
  utils.ts              # cn(), formatNumber(), buildWhatsAppUrl()
messages/
  en.json               # English strings
  hi.json               # Hindi strings
middleware.ts           # i18n routing + security headers
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### 1. Clone and install

```bash
cd engineering/website
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL (e.g. `https://api.example.com/v1`) |
| `API_SECRET_KEY` | Server-side only secret for backend auth |
| `CDN_HOSTNAME` | CDN hostname for Next.js Image optimization |
| `NEXT_PUBLIC_HO_WHATSAPP` | HO WhatsApp fallback number (digits only, e.g. `919876543210`) |
| `NEXT_PUBLIC_MAPS_API_KEY` | Google Maps Embed API key (for center map embeds) |
| `NEXT_PUBLIC_SITE_URL` | Full site URL used for canonical tags (e.g. `https://www.computrain.in`) |
| `REVALIDATION_SECRET` | Secret for ISR on-demand revalidation webhooks |
| `VERIFY_RATE_LIMIT_RPM` | Rate limit for verify endpoint (requests/min/IP) |

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Type check

```bash
npm run type-check
```

### 5. Build for production

```bash
npm run build
npm start
```

## i18n

- **English** is the default locale — no URL prefix (e.g. `/courses`)
- **Hindi** uses the `/hi/` prefix (e.g. `/hi/courses`)
- All user-facing strings are in `messages/en.json` and `messages/hi.json`
- The Hindi/English toggle in the `Header` component swaps the locale prefix

## PWA

- Root manifest at `/public/manifest.json`
- Per-center dynamic manifests served at `/c/[centerSlug]/manifest.json`
- PWA icons are placeholders in `/public/icons/` — replace before launch

## Security Headers

Applied in `middleware.ts` to every response:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (no inline scripts, no ad trackers on minor pages)
- `Permissions-Policy`

## API Routes

| Route | Description |
|---|---|
| `POST /api/enquiries` | Proxies enquiry to backend; validates phone server-side |
| `GET /api/verify/[certNo]` | Proxies cert verification; p95 target <1.5s |

The `API_SECRET_KEY` is added server-side only — never reaches the browser.

## Schema.org / SEO

- Every page has `generateMetadata` with title, description, OG image, canonical
- JSON-LD injected via `<SchemaOrg>` component (WebSite, Course, LocalBusiness, Article, FAQ, BreadcrumbList)
- Course detail pages target "DCA course in {city}" search pattern

## Launch Blockers

Search for `LAUNCH BLOCKER` comments in the codebase before going live:

```bash
grep -r "LAUNCH BLOCKER" app/
```

Found in:
- `app/legal/terms/page.tsx` — needs legal review
- `app/legal/privacy/page.tsx` — must comply with DPDP Act 2023
- `app/legal/refund/page.tsx` — confirm terms with operations team

Also search for `[DECIDE]` for items pending business decisions:
```bash
grep -r "\[DECIDE\]" .
```

## Environment-specific Replacements

Before launch, replace all placeholders:

- `[Hero photo — replace before launch]` in `HeroSection.tsx` with actual photograph
- `[Replace with actual logos]` in `AboutPage` with official accreditation logos
- `[Replace with actual team profiles]` with real leadership bios
- Center map embeds: configure `NEXT_PUBLIC_MAPS_API_KEY`
- PWA icons: generate proper icons in `/public/icons/` using a tool like `pwa-asset-generator`

## Deployment

Tested with Vercel. For other platforms, ensure:

1. Environment variables are set in the deployment environment
2. Node.js 20+ runtime
3. The build output directory (`.next/`) is served correctly
4. ISR (Incremental Static Regeneration) is supported if using `revalidate`
