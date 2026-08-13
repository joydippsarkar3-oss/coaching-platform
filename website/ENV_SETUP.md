# Environment Variables for Production Deployment

## Quick Setup Commands

Generate secrets:
```bash
# API secret
openssl rand -base64 32

# Revalidation secret
openssl rand -base64 32
```

## Required Environment Variables

Copy these to your hosting provider (Vercel Dashboard or `.env.production` file):

```bash
# Backend API
NEXT_PUBLIC_API_BASE_URL=https://api.computrain.in/v1

# Server-side secrets (generate with openssl rand -base64 32)
API_SECRET_KEY=your-generated-secret-here
REVALIDATION_SECRET=your-generated-revalidation-secret-here

# CDN (optional - leave empty for now)
CDN_HOSTNAME=

# Contact & Support
NEXT_PUBLIC_HO_WHATSAPP=919876543210

# Google Maps (get from Google Cloud Console)
NEXT_PUBLIC_MAPS_API_KEY=your-google-maps-api-key

# Site URL (your production domain)
NEXT_PUBLIC_SITE_URL=https://computrain.in

# Rate limiting
VERIFY_RATE_LIMIT_RPM=10
```

## Getting Google Maps API Key

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Maps Embed API"
4. Create credentials → API Key
5. Restrict the key to:
   - Application restrictions: HTTP referrers
   - Website restrictions: Add your domain (e.g., `computrain.in/*`)
   - API restrictions: Maps Embed API only

## Backend API URL

Before deploying the website, ensure your backend is accessible at a public URL. You have two options:

### Option A: Deploy backend first
Deploy the NestJS backend to a server or platform (Railway, Render, AWS, etc.) and use that URL.

### Option B: Local tunnel for testing (development only)
```bash
# Using ngrok or similar
ngrok http 3000
# Use the generated URL as NEXT_PUBLIC_API_BASE_URL
```

## Vercel Deployment Steps

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy from website directory:**
   ```bash
   cd engineering/website
   vercel
   ```

3. **Add environment variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables listed above
   - Or use CLI:
     ```bash
     vercel env add NEXT_PUBLIC_API_BASE_URL production
     vercel env add API_SECRET_KEY production
     # ... repeat for all variables
     ```

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```

5. **Add custom domain:**
   - Vercel Dashboard → Domains → Add
   - Follow DNS configuration instructions

## Post-Deployment Verification

- [ ] Visit your production URL
- [ ] Test homepage loads correctly
- [ ] Test language switching (`/` → `/hi/`)
- [ ] Test course catalog page
- [ ] Test centers directory
- [ ] Submit a contact form
- [ ] Verify PWA install prompt appears (mobile)
- [ ] Check `/verify` page works
- [ ] Run Lighthouse audit (should score 90+ on all metrics)
