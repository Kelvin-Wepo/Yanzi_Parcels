# SUPABASE BACKEND DEPLOYMENT GUIDE

## 🚀 OVERVIEW

Supabase provides a managed PostgreSQL database + authentication + real-time features. This guide covers deploying the Yanzi Parcels backend API to Supabase (or Railway/Render with Supabase PostgreSQL).

---

## 📋 DEPLOYMENT OPTIONS

### Option 1: Supabase (Recommended)
- **Database:** Managed PostgreSQL
- **Auth:** Built-in Supabase Auth
- **Real-time:** WebSocket support
- **Features:** RESTful API, GraphQL
- **Cost:** Free tier (500MB DB), pay-as-you-go
- **Setup Time:** ~30 minutes

### Option 2: Railway + Supabase
- **Database:** Supabase PostgreSQL
- **Server:** Railway for Django API
- **Auth:** Supabase Auth
- **Cost:** ~$5-20/month
- **Setup Time:** ~1 hour

### Option 3: Render + Supabase
- **Database:** Supabase PostgreSQL
- **Server:** Render for Django API
- **Auth:** Supabase Auth
- **Cost:** ~$7-25/month
- **Setup Time:** ~1 hour

---

## 🎯 STEP 1: SET UP SUPABASE PROJECT

### 1.1 Create Account & Project

```bash
# Visit https://supabase.com
# Sign up with GitHub (recommended)
# Click "New project"
# Select organization and region (closest to users)
# Name: "yanzi-parcels" or "yanzi-parcels-prod"
# Password: Strong password (save securely)
# Database region: Select region closest to your users
```

### 1.2 Get Connection Details

Once project is created:
1. Go to **Settings → Database**
2. Copy connection string (looks like):
   ```
   postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
   ```
3. Save as `DATABASE_URL` for later

### 1.3 Create Tables & Schema

Option A: Run Django migrations
```bash
export DATABASE_URL="postgresql://..."
python manage.py migrate
```

Option B: Restore from backup (if you have existing data)
```bash
pg_dump sqlite_db.sqlite3 | psql $DATABASE_URL
```

---

## 🔑 STEP 2: GENERATE PRODUCTION CREDENTIALS

### 2.1 Django Secret Key
```bash
python manage.py shell
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
# Copy and save as SECRET_KEY
```

### 2.2 JWT Configuration
Update in deployment settings:
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('SECRET_KEY'),
}
```

### 2.3 CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "https://app.yourdomain.com",
]
```

---

## 📦 STEP 3: DEPLOY BACKEND

### Option A: Railway (Recommended for Beginners)

**1. Connect GitHub Repository**
```bash
# Visit https://railway.app
# Sign in with GitHub
# New Project → GitHub Repo → Select Yanzi_Parcels
```

**2. Add Environment Variables**
- Railway Dashboard → Project → Variables
- Add all variables from `backend/.env.production.example`

**3. Configure Django Service**
- Service: Select Python 3.11+
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn Yanzi.wsgi:application --bind 0.0.0.0:$PORT`
- Port: $PORT (Railway sets this automatically)

**4. Deploy**
```bash
# Railway auto-deploys on git push
# OR click "Deploy Now" button
```

**5. Get API URL**
- Railway Dashboard → Deployments
- Copy domain (e.g., `https://yanzi-api-prod.railway.app`)

---

### Option B: Render.com

**1. Create Web Service**
```bash
# Visit https://render.com
# New Web Service
# Connect GitHub repository
# Select Yanzi_Parcels repo → backend folder
```

**2. Configure Service**
- Name: `yanzi-api-prod`
- Environment: Python 3.11
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn Yanzi.wsgi:application --bind 0.0.0.0:$PORT`

**3. Add Environment Variables**
- Render Dashboard → Environment
- Paste variables from `.env.production.example`

**4. Deploy**
```bash
# Render auto-deploys on git push
```

**5. Get API URL**
- Render Dashboard → Settings
- Copy Service URL (e.g., `https://yanzi-api-prod.onrender.com`)

---

### Option C: Heroku (Legacy)

**Note:** Heroku free tier ended November 2022. Use Railway or Render instead.

---

## 🗄️ STEP 4: DATABASE MIGRATION

### 4.1 Backup Existing Data (SQLite)
```bash
# Export SQLite data
python manage.py dumpdata > data.json

# OR use pg_dump if using PostgreSQL
pg_dump db.sqlite3 > backup.sql
```

### 4.2 Run Migrations on Supabase

```bash
# Set production database
export DATABASE_URL="postgresql://user:pass@db.supabase.co:5432/postgres"

# Run migrations
python manage.py migrate

# Create superuser for admin
python manage.py createsuperuser

# Verify connection
python manage.py dbshell
# psql > SELECT * FROM auth_user; \q
```

### 4.3 Load Existing Data (Optional)

```bash
# If you exported data
python manage.py loaddata data.json

# Verify data loaded
python manage.py shell
>>> from core.models import Customer
>>> Customer.objects.count()
```

---

## 🔐 STEP 5: SECURITY CONFIGURATION

### 5.1 SSL/HTTPS
```python
# settings.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### 5.2 Database Backup

**Supabase Automatic Backups:**
- Settings → Backup → Enable automatic backups
- Default: Daily backups, 7-day retention

**Manual Backup:**
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 5.3 Enable Database Encryption
- Supabase Settings → Security → Encryption
- Enable point-in-time recovery (if available on plan)

### 5.4 Create Read Replica (Optional)
For high-traffic scenarios:
- Settings → Database → Add read replica
- Scale reads independently from writes

---

## 🔗 STEP 6: CONNECT FRONTEND TO BACKEND

Update `frontend/.env.production`:

```env
VITE_API_URL=https://your-api-domain.com
```

Examples:
- Railway: `https://yanzi-api-prod.railway.app`
- Render: `https://yanzi-api-prod.onrender.com`
- Custom Domain: `https://api.yourdomain.com`

---

## 📊 ENVIRONMENT VARIABLES CHECKLIST

### Django Core
- [ ] `SECRET_KEY` - Generate new one
- [ ] `DEBUG` - Set to `False`
- [ ] `ALLOWED_HOSTS` - Set to your API domain
- [ ] `CORS_ALLOWED_ORIGINS` - Add frontend domain
- [ ] `DATABASE_URL` - From Supabase

### Payments
- [ ] `STRIPE_PUBLIC_API_KEY` - Live key
- [ ] `STRIPE_API_SECRET_KEY` - Live key
- [ ] `PAYPAL_MODE` - Set to `live`
- [ ] `PAYPAL_CLIENT_ID` - Live credentials
- [ ] `PAYPAL_CLIENT_SECRET` - Live credentials

### External APIs
- [ ] `GOOGLE_MAP_API_KEY` - Maps API key
- [ ] `GOOGLE_MAPS_API_KEY` - Maps API key (ensure both)
- [ ] `FIREBASE_ADMIN_CREDENTIAL` - Service account JSON path

### AWS S3 (if using)
- [ ] `AWS_ACCESS_KEY_ID` - S3 credentials
- [ ] `AWS_SECRET_ACCESS_KEY` - S3 secret
- [ ] `AWS_STORAGE_BUCKET_NAME` - Bucket name
- [ ] `AWS_S3_REGION_NAME` - Region (e.g., `us-east-1`)

### Email
- [ ] `EMAIL_BACKEND` - Set to `django.core.mail.backends.smtp.EmailBackend`
- [ ] `EMAIL_HOST` - SMTP server (e.g., `smtp.gmail.com`)
- [ ] `EMAIL_PORT` - `587` (TLS) or `465` (SSL)
- [ ] `EMAIL_HOST_USER` - Email address
- [ ] `EMAIL_HOST_PASSWORD` - App password (not main password)
- [ ] `EMAIL_USE_TLS` - `True` if using 587

### Monitoring
- [ ] `SENTRY_DSN` - Error tracking (optional)
- [ ] `LOG_LEVEL` - `INFO` or `WARNING`

---

## 🧪 STEP 7: TEST DEPLOYMENT

### 7.1 Test API Health
```bash
curl https://your-api-domain.com/api/health/
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "version": "1.0.0"
}
```

### 7.2 Test Database Connection
```bash
python manage.py shell
>>> from django.db import connection
>>> connection.ensure_connection()
>>> print("Database connected!")
```

### 7.3 Test API Endpoints
```bash
# Test authentication
curl -X POST https://your-api-domain.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test customer endpoints
curl https://your-api-domain.com/api/customers/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7.4 Check Logs
- **Railway:** Dashboard → Logs
- **Render:** Dashboard → Logs
- **Supabase:** Database → Logs

---

## 📈 MONITORING & MAINTENANCE

### 7.1 Set Up Monitoring
```python
# Install Sentry
pip install sentry-sdk

# Configure in settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN"),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
)
```

### 7.2 Database Monitoring
- **Query Performance:** Supabase → Logs → Slow Queries
- **Storage Usage:** Supabase → Settings → Usage
- **Connections:** Supabase → Database → Connections

### 7.3 Auto-Scaling
- **Railway:** Settings → Auto Deploy → Enable auto-scaling
- **Render:** Settings → Auto-Deploy
- **Supabase:** Database is auto-scaled

### 7.4 Daily Checks
- [ ] Check error logs (Sentry/Logs)
- [ ] Verify API response times
- [ ] Monitor database size
- [ ] Check disk space usage
- [ ] Review failed requests

---

## 🔄 UPDATING DEPLOYMENT

### 7.5 Deploying Updates
```bash
# Make changes locally
git add .
git commit -m "feature: new feature"
git push origin main

# Service auto-deploys
# Check deployment logs
```

### 7.6 Database Migrations
```bash
# Make model changes
# Create migration
python manage.py makemigrations

# Test locally
python manage.py migrate

# Commit changes
git add .
git commit -m "migration: add new field"
git push origin main

# Deployment service auto-runs:
# manage.py migrate
```

---

## 🆘 TROUBLESHOOTING

### Build Fails
```bash
# Check requirements.txt
pip install -r requirements.txt

# Verify Python version
python --version

# Check for syntax errors
python -m py_compile yanzi/settings.py
```

### Database Connection Error
```python
# Test connection
python manage.py dbshell

# Check DATABASE_URL format
postgresql://user:password@host:port/database
#            ^     ^         ^    ^    ^
#          user  pass      host port db

# Verify credentials
psql postgresql://user:pass@host:port/database
```

### API Returns 500 Errors
- Check logs in Railway/Render/Heroku
- Verify environment variables are set
- Check SECRET_KEY is correct
- Verify CORS_ALLOWED_ORIGINS includes frontend

### CORS Errors
```python
# In settings.py, ensure:
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
]

# Test CORS manually
curl -X OPTIONS https://your-api.com/api/customers/ \
  -H "Origin: https://your-frontend.com" \
  -v
```

### Static Files Not Loading
```bash
# Collect static files
python manage.py collectstatic --noinput

# For AWS S3:
python manage.py collectstatic --noinput --no-input

# Verify S3 bucket policies
```

---

## 📞 SUPPORT & RESOURCES

- [Supabase Docs](https://supabase.com/docs)
- [Django Deployment Docs](https://docs.djangoproject.com/en/4.2/howto/deployment/)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Last Updated:** December 2025  
**Version:** 1.0.0
