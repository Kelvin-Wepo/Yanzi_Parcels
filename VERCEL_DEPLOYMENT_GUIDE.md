# VERCEL DEPLOYMENT CHECKLIST & CONFIGURATION

## 📋 Pre-Deployment Checklist

### Frontend Configuration
- [ ] Update `VITE_API_URL` to Supabase backend URL
- [ ] Update `VITE_FRONTEND_URL` to your domain
- [ ] Add Firebase configuration variables
- [ ] Add Google Maps API key
- [ ] Verify all environment variables in `.env.production.example`
- [ ] Run `npm run build` locally to verify build succeeds
- [ ] Test all features with production-like environment

### Backend Configuration (Supabase)
- [ ] Create Supabase project and PostgreSQL database
- [ ] Generate new `SECRET_KEY` for production
- [ ] Configure database in Supabase
- [ ] Set up all environment variables in Supabase settings
- [ ] Run database migrations on Supabase
- [ ] Test API endpoints

### Domain & SSL
- [ ] Purchase custom domain
- [ ] Configure DNS for Vercel
- [ ] Enable SSL/HTTPS
- [ ] Update CORS_ALLOWED_ORIGINS in backend

---

## 🚀 STEP-BY-STEP VERCEL DEPLOYMENT

### 1. Connect GitHub Repository to Vercel

```bash
# Visit: https://vercel.com/new
# Click "Import Git Repository"
# Select your GitHub account and Yanzi_Parcels repository
```

### 2. Configure Project Settings

**Framework:** Vite  
**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Install Command:** `npm install`  
**Environment:** Node.js 18+

### 3. Set Environment Variables

Go to **Project Settings → Environment Variables** and add:

```
VITE_API_URL=https://[SUPABASE_PROJECT].supabase.co/functions/v1
VITE_FRONTEND_URL=https://yourdomain.com
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDHB4sh9YIhktkXeDXYETgNQCdEZGWJagk
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
[... other Firebase vars ...]
```

**Set different values for:**
- **Preview:** Staging API URLs, test credentials
- **Production:** Live API URLs, production credentials

### 4. Configure Domain

1. Go to **Settings → Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Configure DNS provider (Vercel will provide CNAME/A records)

### 5. Deploy

```bash
# Automatic deployment on push to main branch
git push origin main

# Or manually deploy from Vercel Dashboard
# → Deployments → Redeploy
```

### 6. Verify Deployment

```bash
# Test frontend
https://yourdomain.com

# Check API connectivity
https://yourdomain.com/api/status

# Verify environment variables
https://yourdomain.com/_debug (if available)
```

---

## 🔧 VERCEL.JSON CONFIGURATION

If you need API rewriting or custom headers, create `vercel.json` in frontend root:

```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend-url/api/$1"
    }
  ]
}
```

---

## 📊 VERCEL ENVIRONMENT VARIABLES TABLE

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| VITE_API_URL | Yes | - | Backend API endpoint |
| VITE_FRONTEND_URL | Yes | - | Frontend domain for redirects |
| VITE_GOOGLE_MAPS_API_KEY | Yes | - | Google Maps API key |
| VITE_FIREBASE_API_KEY | Yes | - | Firebase API key |
| VITE_FIREBASE_AUTH_DOMAIN | Yes | - | Firebase auth domain |
| VITE_FIREBASE_PROJECT_ID | Yes | - | Firebase project ID |
| VITE_FIREBASE_STORAGE_BUCKET | Yes | - | Firebase storage bucket |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Yes | - | Firebase sender ID |
| VITE_FIREBASE_APP_ID | Yes | - | Firebase app ID |
| VITE_FIREBASE_MEASUREMENT_ID | No | - | Firebase GA measurement ID |
| VITE_ENVIRONMENT | No | production | Environment name |
| VITE_APP_NAME | No | Yanzi Parcels | App name |
| VITE_LOG_LEVEL | No | error | Logging level |

---

## 🔐 SECURITY CONFIGURATION

### Content Security Policy
Add to Vercel headers:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' *.firebase.com; connect-src 'self' *.supabase.co *.googleapis.com"
}
```

### Enable Preview Protection
- Settings → Security → Password protect preview deployments
- Require authentication for preview URLs

### Environment Variable Security
- Use different secrets for Preview and Production
- Rotate credentials every 90 days
- Never log sensitive values

---

## 📈 MONITORING & LOGGING

### Vercel Analytics
- Dashboard → Analytics
- Monitor page load times
- Check error rates

### Error Tracking
- Set up Sentry integration
- Configure error boundaries in React
- Monitor Firebase performance

### Performance Optimization
- Enable automatic compression
- Use image optimization
- Implement lazy loading
- Monitor bundle size

```bash
# Check bundle size locally
npm run build
# Analyze output in dist/ folder
```

---

## 🆘 TROUBLESHOOTING

### Build Fails
```bash
# Check build logs in Vercel Dashboard
# Ensure all dependencies are in package.json
# Clear node_modules and reinstall
npm ci
npm run build
```

### API Connection Errors
- Verify VITE_API_URL is correct
- Check CORS settings in backend
- Ensure backend is deployed and running
- Test API manually with curl

### Firebase Configuration Issues
- Verify Firebase keys are correct
- Check Firebase rules allow access from your domain
- Test Firebase connection in browser console

### Environment Variables Not Loading
- Verify variables are set in Vercel Dashboard
- Rebuild project after adding variables
- Check variable names match code (case-sensitive)
- Restart dev server locally

---

## 📝 GIT WORKFLOW

```bash
# Create production deployment
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v1.0.0

# Update version numbers
npm version patch/minor/major

# Commit and push
git add .
git commit -m "release: version 1.0.0"
git push origin release/v1.0.0

# Create pull request
# After merge to main, Vercel auto-deploys to production
```

---

## 🔄 CONTINUOUS DEPLOYMENT

### GitHub Actions Workflow
Create `.github/workflows/vercel.yml`:

```yaml
name: Vercel Deployment

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📞 SUPPORT

- [Vercel Docs](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Environment Variables Best Practices](https://vercel.com/docs/build-output-api/v3/overview)

---

**Last Updated:** December 2025  
**Version:** 1.0.0
