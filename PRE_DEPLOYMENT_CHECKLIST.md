# YANZI PARCELS - PRE-DEPLOYMENT CHECKLIST

**Project:** Yanzi Parcels  
**Deployment Targets:** Vercel (Frontend) + Supabase (Backend)  
**Date:** December 2025  
**Version:** 1.0.0

---

## ✅ PHASE 1: CODE PREPARATION (Week 1)

### Frontend
- [ ] **Code Quality**
  - [ ] Run `npm run lint` - zero errors
  - [ ] Run `npm run build` - success
  - [ ] Test build output in `dist/`
  - [ ] Remove console.log statements
  - [ ] Remove test/debug code
  - [ ] Verify no hardcoded URLs (use env vars)
  
- [ ] **Environment Configuration**
  - [ ] Copy `.env.production.example` to `.env.production`
  - [ ] Fill in all `VITE_*` variables
  - [ ] Verify Firebase config is correct
  - [ ] Verify Google Maps API key is valid
  - [ ] Test all API endpoints locally with production env

- [ ] **Testing**
  - [ ] Test login/signup flow
  - [ ] Test customer job creation
  - [ ] Test courier job acceptance
  - [ ] Test payment flow (test cards)
  - [ ] Test real-time features (job updates)
  - [ ] Test all user roles (customer, courier, admin)
  - [ ] Test mobile responsiveness (use Vercel preview)
  - [ ] Test error handling and error messages

- [ ] **Security**
  - [ ] Remove API keys from code (use env vars only)
  - [ ] Remove Firebase config from code (use env vars)
  - [ ] Check for XSS vulnerabilities
  - [ ] Check for sensitive data in localStorage
  - [ ] Verify HTTPS is enforced
  - [ ] Test CORS headers

- [ ] **Performance**
  - [ ] Measure Lighthouse score (target: 80+)
  - [ ] Check bundle size (target: <300KB gzipped)
  - [ ] Enable code splitting for routes
  - [ ] Optimize images and assets
  - [ ] Enable gzip compression
  - [ ] Test with slow network (Chrome DevTools)

- [ ] **Git & Commit**
  - [ ] Create `main` branch
  - [ ] Ensure all code is committed
  - [ ] No uncommitted changes
  - [ ] Verify `.gitignore` excludes `.env.production`
  - [ ] Tag release: `git tag -a v1.0.0 -m "Production release"`

### Backend
- [ ] **Code Quality**
  - [ ] Run `python manage.py check` - zero errors
  - [ ] Run `python manage.py test` - all tests pass
  - [ ] Run linter: `pylint core/`
  - [ ] Remove print statements and debugging code
  - [ ] Remove test data from models
  - [ ] Review and document API endpoints

- [ ] **Environment Configuration**
  - [ ] Copy `.env.production.example` to `.env.production`
  - [ ] Fill in all required variables (SECRET_KEY, DATABASE_URL, etc.)
  - [ ] Generate new `SECRET_KEY` (security requirement)
  - [ ] Verify all API keys are for PRODUCTION (not test)
  - [ ] Update `ALLOWED_HOSTS` with production domain
  - [ ] Update `CORS_ALLOWED_ORIGINS` with frontend domain

- [ ] **Database**
  - [ ] Test migrations locally: `python manage.py migrate`
  - [ ] Verify all models are migrated
  - [ ] Check for missing migrations: `python manage.py makemigrations --check`
  - [ ] Create data backup if migrating from existing DB
  - [ ] Test database connection string format
  - [ ] Verify database supports UUID and JSON fields

- [ ] **Testing**
  - [ ] Test authentication endpoints (login, register, logout)
  - [ ] Test customer endpoints (create job, list jobs, update job)
  - [ ] Test courier endpoints (list available jobs, accept job)
  - [ ] Test payment endpoints (Stripe, PayPal)
  - [ ] Test third-party integrations (Firebase, Google Maps)
  - [ ] Test error responses and edge cases
  - [ ] Test with Postman/Insomnia collections

- [ ] **Security**
  - [ ] Set `DEBUG = False` in production settings
  - [ ] Remove API keys from code (use env vars only)
  - [ ] Set secure headers (HSTS, CSP, X-Frame-Options)
  - [ ] Enable HTTPS only (SSL redirect)
  - [ ] Set CSRF protection
  - [ ] Set secure session cookies
  - [ ] Test SQL injection prevention
  - [ ] Verify authentication is required for protected endpoints
  - [ ] Check password hashing (argon2 or bcrypt)

- [ ] **Performance**
  - [ ] Enable database query caching
  - [ ] Optimize slow queries
  - [ ] Set up database indexes for frequently queried fields
  - [ ] Implement pagination for list endpoints
  - [ ] Add rate limiting (django-ratelimit or similar)
  - [ ] Monitor response times

- [ ] **Logging**
  - [ ] Configure error logging (Sentry or similar)
  - [ ] Set appropriate log levels (WARNING or ERROR in production)
  - [ ] Test that errors are logged correctly
  - [ ] Remove sensitive data from logs

- [ ] **Git & Commit**
  - [ ] All code committed to `main` branch
  - [ ] No uncommitted changes
  - [ ] Verify `.gitignore` excludes `.env.production`
  - [ ] Verify `.gitignore` excludes `db.sqlite3`
  - [ ] Tag release: `git tag -a v1.0.0 -m "Production release"`

---

## ✅ PHASE 2: INFRASTRUCTURE SETUP (Week 1-2)

### Supabase Setup
- [ ] **Create Project**
  - [ ] Sign up at https://supabase.com
  - [ ] Create new project (production-ready region)
  - [ ] Name: `yanzi-parcels-prod` or similar
  - [ ] Save database password securely

- [ ] **Database Configuration**
  - [ ] Copy PostgreSQL connection string (`DATABASE_URL`)
  - [ ] Test connection: `psql $DATABASE_URL`
  - [ ] Create required database schema (run migrations)
  - [ ] Set up backups (automatic daily backups)
  - [ ] Enable encryption if available on plan

- [ ] **Authentication**
  - [ ] Configure JWT settings (if using Supabase Auth)
  - [ ] Set token expiration times
  - [ ] Configure OAuth providers (Google, GitHub if needed)

### Vercel Setup
- [ ] **Connect Repository**
  - [ ] Sign up at https://vercel.com
  - [ ] Connect GitHub account
  - [ ] Import Yanzi_Parcels repository
  - [ ] Configure frontend as root project

- [ ] **Build Configuration**
  - [ ] Framework: Vite
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `dist`
  - [ ] Install command: `npm install`

### Payment Gateways
- [ ] **Stripe (Production)**
  - [ ] Create production Stripe account
  - [ ] Generate live API keys (not test keys)
  - [ ] Configure webhook endpoints
  - [ ] Test payment flow with live cards
  - [ ] Set up payout schedule

- [ ] **PayPal (Production)**
  - [ ] Create production PayPal account
  - [ ] Generate live API credentials
  - [ ] Configure webhook endpoints
  - [ ] Test payout flow

### Firebase (Production)
- [ ] **Create Production Project**
  - [ ] Go to https://firebase.google.com
  - [ ] Create new project
  - [ ] Name: `yanzi-parcels-prod`
  - [ ] Enable Analytics (optional)

- [ ] **Authentication**
  - [ ] Enable Email/Password authentication
  - [ ] Enable Google Sign-In
  - [ ] Configure OAuth redirect URIs
  - [ ] Test authentication flow

- [ ] **Cloud Messaging**
  - [ ] Enable Firebase Cloud Messaging (FCM)
  - [ ] Get server credentials
  - [ ] Test push notifications
  - [ ] Configure courier push notifications

- [ ] **Storage**
  - [ ] Enable Cloud Storage
  - [ ] Create storage buckets
  - [ ] Configure security rules
  - [ ] Test file uploads

### Domain & DNS
- [ ] **Purchase Domain**
  - [ ] Register domain (if not already owned)
  - [ ] Registrar: Namecheap, GoDaddy, AWS Route53, etc.

- [ ] **Configure DNS**
  - [ ] Frontend domain → Vercel (add A/CNAME records)
  - [ ] Backend domain (optional) → Railway/Render (add A/CNAME records)
  - [ ] Wait for DNS propagation (can take up to 48 hours)
  - [ ] Verify DNS with `nslookup` or `dig`

- [ ] **SSL/HTTPS**
  - [ ] Vercel auto-provisions Let's Encrypt certificate
  - [ ] Backend service auto-provisions HTTPS certificate
  - [ ] Test HTTPS connection: `curl -I https://yourdomain.com`

---

## ✅ PHASE 3: ENVIRONMENT VARIABLES (Week 2)

### Vercel Environment Variables
Create in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL = https://your-backend-domain.com
VITE_FRONTEND_URL = https://your-frontend-domain.com
VITE_GOOGLE_MAPS_API_KEY = [Production Google Maps API Key]
VITE_FIREBASE_API_KEY = [Firebase API Key]
VITE_FIREBASE_AUTH_DOMAIN = [Firebase Auth Domain]
VITE_FIREBASE_PROJECT_ID = [Firebase Project ID]
VITE_FIREBASE_STORAGE_BUCKET = [Firebase Storage Bucket]
VITE_FIREBASE_MESSAGING_SENDER_ID = [Firebase Messaging Sender ID]
VITE_FIREBASE_APP_ID = [Firebase App ID]
VITE_FIREBASE_MEASUREMENT_ID = [Firebase Measurement ID]
VITE_ENVIRONMENT = production
VITE_LOG_LEVEL = error
```

- [ ] All variables filled in
- [ ] No test/staging values
- [ ] Verified correct values for each variable

### Railway/Render Backend Variables
Create in deployment service → Variables:

```
SECRET_KEY = [New production secret key]
DEBUG = False
ALLOWED_HOSTS = your-backend-domain.com
CORS_ALLOWED_ORIGINS = https://your-frontend-domain.com
DATABASE_URL = [Supabase PostgreSQL URL]

STRIPE_PUBLIC_API_KEY = [Live Stripe key]
STRIPE_API_SECRET_KEY = [Live Stripe secret]

PAYPAL_MODE = live
PAYPAL_CLIENT_ID = [Live PayPal ID]
PAYPAL_CLIENT_SECRET = [Live PayPal secret]

GOOGLE_MAP_API_KEY = [Production Google Maps key]
GOOGLE_MAPS_API_KEY = [Production Google Maps key]

FIREBASE_ADMIN_CREDENTIAL = /path/to/firebase-adminsdk.json

AWS_ACCESS_KEY_ID = [AWS credentials]
AWS_SECRET_ACCESS_KEY = [AWS secret]
AWS_STORAGE_BUCKET_NAME = yanzi-parcels-prod
AWS_S3_REGION_NAME = us-east-1

EMAIL_BACKEND = django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_HOST_USER = your-email@gmail.com
EMAIL_HOST_PASSWORD = [Gmail app password]
EMAIL_USE_TLS = True

SENTRY_DSN = [Optional error tracking]
LOG_LEVEL = INFO
```

- [ ] All variables filled in
- [ ] No test/staging values
- [ ] Database URL verified
- [ ] All API keys are production keys
- [ ] Email credentials verified

---

## ✅ PHASE 4: DATABASE MIGRATION (Week 2)

### Backup Existing Data
- [ ] Backup SQLite database: `cp db.sqlite3 db.sqlite3.backup`
- [ ] Export data (if needed): `python manage.py dumpdata > data.json`
- [ ] Store backup securely (encrypted, off-site)

### Run Migrations
- [ ] Set `DATABASE_URL` to Supabase PostgreSQL
- [ ] Run migrations: `python manage.py migrate`
- [ ] Verify all migrations completed
- [ ] Create admin superuser: `python manage.py createsuperuser`

### Verify Migration
- [ ] Connect to production database: `psql $DATABASE_URL`
- [ ] Verify all tables created: `\dt` (in psql)
- [ ] Verify no migration errors
- [ ] Test database queries work

---

## ✅ PHASE 5: DEPLOYMENT (Week 2-3)

### Backend Deployment

#### Option A: Railway
- [ ] Push code to GitHub main branch
- [ ] Railway detects changes and builds
- [ ] Build succeeds (check logs)
- [ ] Deployment succeeds
- [ ] Service starts successfully
- [ ] Check logs for errors

#### Option B: Render
- [ ] Push code to GitHub main branch
- [ ] Render detects changes and builds
- [ ] Build succeeds (check logs)
- [ ] Deployment succeeds
- [ ] Service starts successfully
- [ ] Check logs for errors

### Frontend Deployment
- [ ] Push code to GitHub main branch
- [ ] Vercel detects changes and builds
- [ ] Build succeeds (check logs)
- [ ] Deployment succeeds
- [ ] Site is live at domain
- [ ] Check logs for errors

### Verification
- [ ] Frontend loads successfully
- [ ] API endpoints respond
- [ ] Database connection works
- [ ] All third-party APIs working (Stripe, Firebase, etc.)

---

## ✅ PHASE 6: POST-DEPLOYMENT TESTING (Week 3)

### Full End-to-End Testing
- [ ] **Authentication Flow**
  - [ ] User can sign up
  - [ ] User receives verification email
  - [ ] User can log in
  - [ ] User can log out
  - [ ] Tokens are set correctly

- [ ] **Customer Flow**
  - [ ] Customer can create job
  - [ ] Job appears in job list
  - [ ] Job details page loads
  - [ ] Customer can view active jobs
  - [ ] Customer can view completed jobs
  - [ ] Customer can cancel job
  - [ ] Customer can rate courier

- [ ] **Courier Flow**
  - [ ] Courier can view available jobs
  - [ ] Courier can accept job
  - [ ] Courier can view current jobs
  - [ ] Courier can update job status
  - [ ] Courier can complete job
  - [ ] Courier can view earnings/payouts

- [ ] **Payment Flow**
  - [ ] Customer can add payment method
  - [ ] Customer can pay for job (Stripe)
  - [ ] Payment is processed correctly
  - [ ] Receipt is sent via email
  - [ ] Courier can request payout (PayPal)
  - [ ] Payout is processed correctly

- [ ] **Real-time Features**
  - [ ] Job status updates in real-time
  - [ ] Push notifications send to courier
  - [ ] Courier location updates in real-time
  - [ ] Chat messages update in real-time (if applicable)

- [ ] **Third-Party Integrations**
  - [ ] Google Maps shows route correctly
  - [ ] Firebase authentication works
  - [ ] Firebase push notifications work
  - [ ] Stripe payments process correctly
  - [ ] PayPal payouts process correctly

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] No N+1 query problems
- [ ] Lighthouse score > 80

### Security Testing
- [ ] HTTPS enforced
- [ ] No mixed content warnings
- [ ] CORS headers correct
- [ ] No exposed API keys
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Authentication required for protected endpoints
- [ ] Users can only access their own data

### Cross-Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (latest)
- [ ] Mobile Safari (latest)

---

## ✅ PHASE 7: MONITORING & ALERTS (Week 3)

### Error Tracking
- [ ] Set up Sentry (or similar)
- [ ] Configure error alerts
- [ ] Test error tracking (trigger test error)
- [ ] Verify errors are logged

### Performance Monitoring
- [ ] Set up Datadog/New Relic (or similar)
- [ ] Monitor API response times
- [ ] Monitor database performance
- [ ] Monitor error rates
- [ ] Set up performance alerts

### Logging
- [ ] Verify logs are being recorded
- [ ] Check log format is appropriate
- [ ] Verify no sensitive data in logs
- [ ] Set up log rotation/retention

### Uptime Monitoring
- [ ] Set up UptimeRobot or similar
- [ ] Monitor frontend uptime
- [ ] Monitor API uptime
- [ ] Configure uptime alerts
- [ ] Test alert notifications

---

## ✅ PHASE 8: LAUNCH PREPARATION (Week 3-4)

### Documentation
- [ ] Create user documentation (PDF or wiki)
- [ ] Create admin guide
- [ ] Document API endpoints
- [ ] Document troubleshooting guide
- [ ] Create FAQ

### Communication
- [ ] Prepare launch announcement
- [ ] Create social media posts
- [ ] Send email to early users
- [ ] Update website/landing page
- [ ] Prepare press release (if applicable)

### Support
- [ ] Set up support email/form
- [ ] Prepare FAQ
- [ ] Set up chat support (Intercom, Zendesk, etc.)
- [ ] Train support team
- [ ] Create troubleshooting guide

### Backup & Disaster Recovery
- [ ] Test database backup and restore
- [ ] Create disaster recovery plan
- [ ] Document recovery procedures
- [ ] Test recovery procedures
- [ ] Set up automated backups

---

## ✅ PHASE 9: GO-LIVE (Week 4)

### Final Checks (24 Hours Before)
- [ ] All tests passing
- [ ] No active errors in logs
- [ ] Performance metrics acceptable
- [ ] Monitoring systems operational
- [ ] Support team trained and ready
- [ ] Documentation complete

### Launch Day
- [ ] Monitor logs closely
- [ ] Check uptime monitoring
- [ ] Monitor error tracking
- [ ] Monitor performance
- [ ] Be available for support
- [ ] Communicate status to stakeholders

### Post-Launch (First Week)
- [ ] Monitor closely for issues
- [ ] Be responsive to user feedback
- [ ] Fix critical bugs immediately
- [ ] Provide support to users
- [ ] Document any issues and fixes
- [ ] Plan improvements based on feedback

---

## 📊 SIGN-OFF

### Development Team
- [ ] Frontend lead sign-off: _________________ Date: _______
- [ ] Backend lead sign-off: _________________ Date: _______
- [ ] QA lead sign-off: _________________ Date: _______

### Management
- [ ] Product manager sign-off: _________________ Date: _______
- [ ] CTO/Technical director sign-off: _________________ Date: _______

---

## 📞 DEPLOYMENT TEAM CONTACTS

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Project Lead | [Your Name] | [Email] | [Phone] |
| DevOps Engineer | [Your Name] | [Email] | [Phone] |
| Backend Lead | [Your Name] | [Email] | [Phone] |
| Frontend Lead | [Your Name] | [Email] | [Phone] |
| QA Lead | [Your Name] | [Email] | [Phone] |
| Support Lead | [Your Name] | [Email] | [Phone] |

---

## 🆘 ROLLBACK PROCEDURE

If critical issues occur post-launch:

1. **Immediate (0-5 minutes)**
   - Switch traffic to previous version
   - Notify stakeholders
   - Begin investigation

2. **Short-term (5-30 minutes)**
   - Identify root cause
   - Check database integrity
   - Review recent deployments

3. **Long-term**
   - Deploy fix to staging
   - Test thoroughly
   - Re-deploy to production
   - Monitor closely
   - Post-mortem analysis

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Next Review:** [TBD]
