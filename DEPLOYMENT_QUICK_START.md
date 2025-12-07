# QUICK START: DEPLOYMENT REFERENCE

**TL;DR Version of Deployment Guides**

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
Frontend (Vercel)              Backend (Railway/Render + Supabase)
┌─────────────────┐            ┌──────────────────────────┐
│   yourdomain.com │─────HTTP─→│   api.yourdomain.com     │
│   (React + Vite)  │            │   (Django REST API)       │
│   Vercel.com      │◄──JSON───│   Railway/Render/Heroku  │
└─────────────────┘            └──────────────────────────┘
                                           │
                                           ↓
                                    ┌─────────────┐
                                    │   Supabase  │
                                    │  PostgreSQL │
                                    └─────────────┘
```

---

## ⚡ 30-MINUTE QUICK SETUP

### 1. Generate Production Credentials
```bash
# Django secret key
python manage.py shell
>>> from django.core.management.utils import get_random_secret_key
>>> print(get_random_secret_key())

# Copy output and save as SECRET_KEY
```

### 2. Create Supabase Project
- Go to https://supabase.com
- Create new project
- Copy DATABASE_URL

### 3. Create Vercel Project
- Go to https://vercel.com/new
- Import your GitHub repo
- Add VITE_* environment variables

### 4. Deploy Backend
- Option A: Railway (https://railway.app)
- Option B: Render (https://render.com)
- Option C: Heroku (https://heroku.com)

### 5. Test Deployment
```bash
# Test API
curl https://your-api.com/api/health/

# Test frontend
https://your-frontend.com
```

---

## 🔑 REQUIRED ENVIRONMENT VARIABLES

### Frontend (Vercel)
```
VITE_API_URL=https://api.yourdomain.com
VITE_FRONTEND_URL=https://yourdomain.com
VITE_GOOGLE_MAPS_API_KEY=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Backend (Railway/Render)
```
SECRET_KEY=...
DEBUG=False
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
STRIPE_PUBLIC_API_KEY=pk_live_...
STRIPE_API_SECRET_KEY=sk_live_...
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
GOOGLE_MAP_API_KEY=...
FIREBASE_ADMIN_CREDENTIAL=/path/to/firebase-key.json
```

---

## 📋 DEPLOYMENT CHECKLIST (1-PAGE)

- [ ] Code committed and pushed to `main`
- [ ] `npm run build` succeeds locally
- [ ] `python manage.py check` passes
- [ ] All tests pass (`npm test`, `pytest`)
- [ ] `.env.production` filled with REAL values (not test)
- [ ] `SECRET_KEY` is new and unique
- [ ] All API keys are PRODUCTION keys (not test)
- [ ] Supabase project created with PostgreSQL
- [ ] Database migrations run: `python manage.py migrate`
- [ ] Vercel connected to GitHub
- [ ] Vercel environment variables set
- [ ] Railway/Render connected to GitHub
- [ ] Railway/Render environment variables set
- [ ] Frontend builds and deploys successfully
- [ ] Backend builds and deploys successfully
- [ ] API responds at production URL
- [ ] Frontend loads successfully
- [ ] Test login/signup flow
- [ ] Test payment flow
- [ ] Check Lighthouse score (target: 80+)
- [ ] Enable HTTPS (auto on Vercel/Railway)
- [ ] Set up monitoring (Sentry or similar)
- [ ] Set up backups
- [ ] Create support plan

---

## 🔗 SERVICE LINKS

| Service | Purpose | URL | Cost |
|---------|---------|-----|------|
| Vercel | Frontend hosting | https://vercel.com | Free → $20/mo |
| Supabase | Database (PostgreSQL) | https://supabase.com | Free → $25/mo |
| Railway | API hosting | https://railway.app | Free → $5/mo |
| Stripe | Payments | https://stripe.com | 2.9% + $0.30 per transaction |
| Firebase | Auth & Notifications | https://firebase.google.com | Free tier available |
| Google Maps | Maps & Routing | https://maps.google.com | $5-50/month |
| Sentry | Error tracking | https://sentry.io | Free → $29/mo |
| SendGrid | Email | https://sendgrid.com | Free → $9.95/mo |

---

## 🐛 COMMON ISSUES & FIXES

### Build Fails on Vercel
```bash
# Ensure all dependencies are in package.json
npm install dependency-name --save

# Clear build cache
# In Vercel Dashboard: Settings → Advanced → Clear Build Cache
```

### API Connection Error
```
VITE_API_URL must be absolute URL:
✓ https://api.yourdomain.com
✓ https://yanzi-api.railway.app
✗ /api
✗ http://localhost:8000
```

### CORS Error
```
Backend must include frontend domain:
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

### Database Connection Fails
```
DATABASE_URL format:
postgresql://username:password@host:port/database

Test connection:
psql postgresql://username:password@host:port/database
```

### 500 Error on API
1. Check backend logs (Railway/Render Dashboard)
2. Verify environment variables are set
3. Run locally: `python manage.py runserver`
4. Check Sentry for detailed error

---

## 📊 MONITORING CHECKLIST

### Daily
- [ ] Check error logs (Sentry)
- [ ] Check uptime status
- [ ] Review error rate

### Weekly
- [ ] Check performance metrics
- [ ] Review database size
- [ ] Check API response times
- [ ] Review user feedback

### Monthly
- [ ] Check backup status
- [ ] Review security logs
- [ ] Analyze usage trends
- [ ] Plan improvements

---

## 🔐 SECURITY CHECKLIST

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] `DEBUG = False` in production
- [ ] `SECRET_KEY` is unique and secure
- [ ] Database is not publicly accessible
- [ ] Sensitive data not in logs
- [ ] CORS configured correctly
- [ ] CSRF protection enabled
- [ ] SQL injection prevention (Django ORM)
- [ ] XSS prevention (Django template escaping)
- [ ] Rate limiting configured
- [ ] Backups automated and tested
- [ ] Monitoring configured
- [ ] Error tracking configured

---

## 🆘 EMERGENCY CONTACTS

**Something broke in production?**

1. Check logs immediately (Sentry, Railway/Render logs)
2. Check uptime monitoring
3. Review recent deployments
4. Rollback if critical: Check git log, `git revert`
5. Deploy fix: Push to main, auto-deploy triggers

**Frontend:** Check Vercel logs
**Backend:** Check Railway/Render logs  
**Database:** Check Supabase logs  
**Payments:** Check Stripe/PayPal dashboard

---

## 📚 DETAILED GUIDES

- **Vercel Frontend:** See `VERCEL_DEPLOYMENT_GUIDE.md`
- **Supabase Backend:** See `SUPABASE_DEPLOYMENT_GUIDE.md`
- **Environment Variables:** See `DEPLOYMENT_ENV_GUIDE.md`
- **Full Checklist:** See `PRE_DEPLOYMENT_CHECKLIST.md`

---

## ✅ WHAT'S NEXT?

1. **Week 1:** Prepare code and environments
2. **Week 2:** Set up infrastructure and deploy
3. **Week 3:** Test thoroughly and launch
4. **Week 4+:** Monitor and iterate

**Estimated time:** 2-4 weeks depending on complexity

---

**Version:** 1.0  
**Last Updated:** December 2025
