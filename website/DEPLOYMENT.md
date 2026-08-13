# Website Deployment Guide

## Vercel Deployment

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy from website directory

```bash
cd engineering/website
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account/team
- Link to existing project? **N** (first time)
- What's your project's name? **computrain-production** (or your choice)
- In which directory is your code located? **./** (press Enter)
- Want to override settings? **N**

### 4. Configure Environment Variables

After the first deployment, add environment variables via Vercel Dashboard or CLI:

```bash
vercel env add NEXT_PUBLIC_API_BASE_URL production
vercel env add API_SECRET_KEY production
vercel env add CDN_HOSTNAME production
vercel env add NEXT_PUBLIC_HO_WHATSAPP production
vercel env add NEXT_PUBLIC_MAPS_API_KEY production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add REVALIDATION_SECRET production
vercel env add VERIFY_RATE_LIMIT_RPM production
```

#### Required Values:

| Variable | Example Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.computrain.in/v1` | Backend API URL |
| `API_SECRET_KEY` | Generate with `openssl rand -base64 32` | Server-side auth secret |
| `CDN_HOSTNAME` | Leave empty for now | Optional CDN hostname |
| `NEXT_PUBLIC_HO_WHATSAPP` | `919876543210` | Head office WhatsApp number (digits only) |
| `NEXT_PUBLIC_MAPS_API_KEY` | Get from Google Cloud Console | Google Maps Embed API key |
| `NEXT_PUBLIC_SITE_URL` | `https://computrain.in` | Production domain URL |
| `REVALIDATION_SECRET` | Generate with `openssl rand -base64 32` | ISR webhook secret |
| `VERIFY_RATE_LIMIT_RPM` | `10` | Rate limit per IP per minute |

### 5. Production Deployment

After configuring environment variables:

```bash
vercel --prod
```

### 6. Custom Domain Setup

In Vercel Dashboard:
1. Go to Project Settings → Domains
2. Add your domain (e.g., `computrain.in`, `www.computrain.in`)
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` to match your domain

## Alternative: Deploy to Your Own Server

### Prerequisites
- Node.js 20+ server
- Nginx or similar reverse proxy
- SSL certificate (Let's Encrypt)

### Build

```bash
cd engineering/website
npm run build
```

### Start Production Server

```bash
PORT=3000 npm start
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name computrain.in www.computrain.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name computrain.in www.computrain.in;

    ssl_certificate /etc/letsencrypt/live/computrain.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/computrain.in/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Post-Deployment Checklist

- [ ] Website loads at production URL
- [ ] All pages render correctly (home, courses, centers, etc.)
- [ ] i18n routing works (`/` English, `/hi/` Hindi)
- [ ] API endpoints respond correctly
- [ ] Forms submit successfully (contact, enquiry)
- [ ] PWA installs on mobile devices
- [ ] Certificate verification works at `/verify`
- [ ] Schema.org structured data validates (Google Rich Results Test)
- [ ] Lighthouse scores: Performance 90+, Accessibility 100, Best Practices 100, SEO 100
- [ ] Update `NEXT_PUBLIC_SITE_URL` in backend `.env` if needed for CORS

## Monitoring

- Set up Vercel Analytics (included in Vercel deployment)
- Configure Sentry for error tracking (when `SENTRY_DSN` is added)
- Monitor Core Web Vitals via Vercel dashboard
