# Website Performance Optimization

**Target:** Core Web Vitals passing scores  
**Standard:** LCP < 2.5s, CLS < 0.1, FID < 100ms  
**Date:** 2026-08-12

---

## Implemented Optimizations

### 1. Next.js Configuration

**File:** `next.config.js`

✅ **SWC Minification** — Faster builds and smaller bundles  
✅ **Image Optimization** — AVIF/WebP, responsive sizes, 60s cache  
✅ **Compression** — Gzip/Brotli enabled  
✅ **Font Optimization** — Automatic font subsetting  
✅ **Modular Imports** — Tree-shaking for lucide-react  
✅ **Security Headers** — HSTS, CSP, X-Frame-Options

**Bundle Size:**
- Modular imports reduce lucide-react from ~600KB to only imported icons
- optimizePackageImports for framer-motion, react-hook-form

---

### 2. Image Optimization

**Strategy:**
- Use Next.js `<Image>` component everywhere
- Serve modern formats (AVIF → WebP → fallback)
- Lazy load below-the-fold images
- Set explicit width/height to prevent CLS

**Example:**
```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Students learning"
  width={1200}
  height={600}
  priority  // LCP image
  quality={85}
/>

<Image
  src="/feature.jpg"
  alt="Feature"
  width={400}
  height={300}
  loading="lazy"  // Below fold
/>
```

---

### 3. Font Loading Strategy

**File:** `app/layout.tsx`

✅ **System Fonts** — Using `next/font/google` with `display: 'swap'`  
✅ **Preload Critical Fonts** — Automatic via Next.js  
✅ **Subset Fonts** — Only Latin characters loaded

**Implementation:**
```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
```

**Impact:** Eliminates FOIT (Flash of Invisible Text), reduces CLS

---

### 4. Code Splitting

✅ **Route-based Splitting** — Automatic in Next.js App Router  
✅ **Dynamic Imports** — Heavy components lazy-loaded  
✅ **Modular Imports** — Tree-shaking for icon libraries

**Example:**
```tsx
// Heavy component not needed on initial load
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Spinner />,
  ssr: false, // Client-only if needed
});
```

---

### 5. API Route Optimization

**Strategy:**
- Use ISR (Incremental Static Regeneration) for slow-changing data
- Cache API responses with proper headers
- Minimize data transferred

**Example:**
```tsx
// app/courses/page.tsx
export const revalidate = 3600; // 1 hour ISR

export async function generateStaticParams() {
  const courses = await fetchCourses();
  return courses.map((course) => ({ slug: course.slug }));
}
```

---

### 6. Critical CSS

✅ **Inline Critical CSS** — Automatic in Next.js  
✅ **Purge Unused CSS** — Tailwind's JIT mode  
✅ **Minimal Global CSS** — Only resets and utilities

**Tailwind Config:**
```js
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // JIT mode automatically enabled in v3+
};
```

---

### 7. JavaScript Optimization

**Bundle Analysis:**
Run `ANALYZE=true npm run build` to see bundle composition.

**Key Optimizations:**
- ✅ Tree-shaking enabled (automatic)
- ✅ Dead code elimination (SWC minifier)
- ✅ Dynamic imports for non-critical code
- ✅ No polyfills for modern browsers (target ES2020)

---

### 8. Caching Strategy

**Static Assets:**
- Images: 1 year (immutable with hash)
- JS/CSS: 1 year (immutable with hash)
- Fonts: 1 year (immutable)

**Dynamic Content:**
- Homepage: ISR 1 hour
- Course pages: ISR 1 hour
- Verify page: SSR (always fresh)
- API routes: Custom Cache-Control headers

**Example:**
```tsx
// app/api/courses/route.ts
export async function GET() {
  const courses = await fetchCourses();
  return NextResponse.json(courses, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

---

### 9. Third-Party Scripts

**Strategy:**
- Load analytics scripts with `next/script` strategy="lazyOnload"
- Defer non-critical scripts
- Self-host when possible

**Example:**
```tsx
import Script from 'next/script';

<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
  strategy="lazyOnload"
/>
```

---

### 10. Prefetching & Preloading

✅ **Automatic Link Prefetch** — Next.js prefetches visible `<Link>` components  
✅ **DNS Prefetch** — Added in headers for external domains  
✅ **Preconnect** — For critical external resources

**Example:**
```tsx
// app/layout.tsx
<link rel="dns-prefetch" href="https://api.example.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
```

---

## Measuring Performance

### Local Development

**Lighthouse:**
```bash
cd website
npm run build
npm start

# Open Chrome DevTools → Lighthouse → Generate Report
```

**Target Scores:**
- Performance: ≥90
- Accessibility: ≥90
- Best Practices: ≥90
- SEO: ≥90

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

### Production Monitoring

**Tool:** Google Search Console → Core Web Vitals

**Setup:**
1. Verify domain ownership in GSC
2. Wait 28 days for data collection
3. Monitor "Core Web Vitals" report

**Targets:**
- ≥75% of page loads pass all three metrics
- Zero "Poor" URLs

---

## Performance Budget

**JavaScript:**
- Initial bundle: < 200 KB (gzipped)
- Total page weight: < 1 MB

**Requests:**
- First load: < 25 requests
- Subsequent navigations: < 10 requests

**Monitoring:**
```bash
# Check bundle size
npm run build

# Output shows:
# ├ /                  12.3 kB   ← Initial JS
# ├ /_app             45.2 kB   ← Shared chunks
```

---

## Lighthouse CI (Automated)

**File:** `.github/workflows/lighthouse.yml`

Runs on every PR to `main` and enforces:

```yaml
thresholds:
  performance: 0.8
  accessibility: 0.9
  best-practices: 0.9
  seo: 0.9
assertions:
  - largest-contentful-paint: ['error', { maxNumericValue: 2500 }]
  - cumulative-layout-shift: ['error', { maxNumericValue: 0.1 }]
  - first-contentful-paint: ['error', { maxNumericValue: 1800 }]
```

**Setup:**
```bash
npm install --save-dev @lhci/cli
```

**Run locally:**
```bash
npx lhci autorun
```

---

## Known Performance Bottlenecks

### 1. Google Maps Embed
**Issue:** Large JS bundle (~400 KB)  
**Solution:** Lazy load below fold, use static image placeholder

### 2. Razorpay Checkout
**Issue:** External script blocks rendering  
**Solution:** Load on-demand only when payment button clicked

### 3. Hero Images
**Issue:** Large LCP image  
**Solution:** Use priority loading, optimize to < 100 KB, serve AVIF

---

## Checklist Before Production Deploy

- [ ] Run `npm run build` — verify no build errors
- [ ] Check bundle sizes — ensure < 200 KB initial JS
- [ ] Run Lighthouse on build — verify scores ≥90
- [ ] Test on slow 3G — ensure LCP < 4s
- [ ] Verify images use AVIF/WebP formats
- [ ] Check all `<Image>` components have width/height
- [ ] Verify fonts load with `display: swap`
- [ ] Test CLS — no layout shifts on load
- [ ] Add CDN (CloudFront/Cloudflare) in production
- [ ] Enable HTTP/2 on server
- [ ] Set up performance monitoring (Vercel Analytics or Sentry)

---

## Production Deployment Checklist

### CDN Configuration

**Vercel (Recommended):**
- Automatic edge caching
- Automatic Brotli compression
- Automatic image optimization
- Global CDN included

**Self-hosted:**
```nginx
# Nginx configuration for performance
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Cache HTML with revalidation
location / {
  expires 1h;
  add_header Cache-Control "public, must-revalidate";
}
```

---

## Real User Monitoring (RUM)

**Option 1: Vercel Analytics**
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Option 2: Google Analytics 4**
```tsx
import Script from 'next/script';

<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="afterInteractive"
/>
```

---

## Performance Testing Commands

```bash
# Build for production
npm run build

# Start production server
npm start

# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Check bundle size
npx next build --profile

# Analyze bundle composition
ANALYZE=true npm run build
```

---

## Quick Wins (Already Implemented)

✅ Enable Next.js Image Optimization  
✅ Use `next/font` for font loading  
✅ Enable SWC minification  
✅ Implement modular imports for icons  
✅ Add security headers  
✅ Enable compression  
✅ Use ISR for slow-changing pages  
✅ Lazy load below-the-fold content  
✅ Prefetch visible links automatically  
✅ Tree-shake unused CSS with Tailwind JIT

---

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

**Status:** ✅ All optimizations implemented  
**Next Steps:** Deploy to production and measure real user metrics  
**Owner:** Engineering Team
