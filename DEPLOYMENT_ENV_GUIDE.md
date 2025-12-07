# 🚀 Deployment Environment Variables Guide

Complete list of all environment variables needed for deploying Yanzi Parcels platform on **Vercel (Frontend)** and **Supabase (Backend)**.

---

## 📍 VERCEL FRONTEND ENVIRONMENT VARIABLES

Add these to your Vercel project settings → **Settings → Environment Variables**

### Core Configuration
```
# API Backend URL (Supabase)
VITE_API_URL=https://your-supabase-project.supabase.co/functions/v1
# OR if using custom backend domain
VITE_API_URL=https://api.yourdomainin.com

# Frontend URL (for redirects after login)
VITE_FRONTEND_URL=https://yourdomain.com
```

### Google Maps API
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDHB4sh9YIhktkXeDXYETgNQCdEZGWJagk
```

### Firebase Configuration (for push notifications)
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Feature Flags / Settings
```
VITE_ENVIRONMENT=production
VITE_APP_NAME=Yanzi Parcels
VITE_APP_VERSION=1.0.0
VITE_LOG_LEVEL=error
```

### Optional: Payment Gateway (if processing on frontend)
```
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```

---

## 🗄️ SUPABASE BACKEND ENVIRONMENT VARIABLES

### 1. Database Connection
```
# Supabase PostgreSQL Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
# Format: postgresql://user:password@host:port/database

# Or use Supabase-specific format:
SUPABASE_DB_URL=postgresql://postgres.xxxxxxxxxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2. Django Core Settings
```
# Django secret key - GENERATE NEW FOR PRODUCTION!
SECRET_KEY=your-very-long-random-secret-key-here-min-50-chars

# Debug mode - MUST BE FALSE in production
DEBUG=False

# Allowed hosts (comma-separated)
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# CORS allowed origins
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. JWT Token Settings (Already in code, verify)
```
# JWT Access Token Lifetime (minutes)
JWT_ACCESS_TOKEN_LIFETIME=60

# JWT Refresh Token Lifetime (days)
JWT_REFRESH_TOKEN_LIFETIME=7
```

### 4. Firebase Admin SDK
```
# Firebase service account key (paste the entire JSON)
# Download from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
FIREBASE_ADMIN_CREDENTIAL={"type":"service_account","project_id":"...","..."}

# Or store as file and use path
FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json
```

### 5. Payment Gateway - Stripe
```
# Stripe API Keys (get from Stripe Dashboard)
STRIPE_PUBLIC_API_KEY=pk_live_your_stripe_public_key
STRIPE_API_SECRET_KEY=sk_live_your_stripe_secret_key

# For testing, use test keys:
# STRIPE_PUBLIC_API_KEY=pk_test_51OLxrMIhECL0gCBjDJkMCCpbtdvIehnp30mZ8cYfjZgeXV2QsP7uAoisaOK8qSg1epcC9iBWFopI7G8gqv3iCVPV00MkrKBcuE
# STRIPE_API_SECRET_KEY=sk_test_51OLxrMIhECL0gCBjBgZSVnVJmCSzfhl7kOxTgJ0N5zsanIjgCUicnJz9h0v631cydfNgMktMXkahB3zXgEyVEXVO00xS7Clr6Z
```

### 6. Google Maps API
```
# Google Maps API Key (for distance calculations, geocoding)
GOOGLE_MAP_API_KEY=AIzaSyDHB4sh9YIhktkXeDXYETgNQCdEZGWJagk
GOOGLE_MAPS_API_KEY=AIzaSyDHB4sh9YIhktkXeDXYETgNQCdEZGWJagk
```

### 7. PayPal Integration (for courier payouts)
```
# PayPal API Credentials
PAYPAL_MODE=live  # or 'sandbox' for testing
PAYPAL_CLIENT_ID=Af8gMF1YL8g-SyYdyaQGyW_IwzPyTdOjnZjkmXB8qwhgSmItVLZ7beKoltcPIdBdF4dbVq-gVUy05pdY
PAYPAL_CLIENT_SECRET=EITj72I0l1RZzYVc-CZK2m-3jvLQuzKFFv4bH8Dmhxx8xjnQ5WmpxNJnZoE48RcRvF-rGURX9__A1Lgv
```

### 8. Email Configuration (for notifications)
```
# Email service (SendGrid, SMTP, etc.)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password  # Use app-specific password, not account password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### 9. M-Pesa Integration (Kenya-specific)
```
# M-Pesa API credentials (for hub payouts)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=123456
MPESA_TILL_NUMBER=your_till_number
```

### 10. AWS S3 Configuration (for media storage)
```
# AWS credentials for file uploads (media storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_STORAGE_BUCKET_NAME=yanzi-parcels-media
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=yourcdn.cloudfront.net
AWS_DEFAULT_ACL=public-read
```

### 11. Logging & Monitoring (Optional)
```
# Sentry error tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# CloudWatch Logs
AWS_CLOUDWATCH_LOG_GROUP=/aws/lambda/yanzi-parcels

# DataDog monitoring
DATADOG_API_KEY=your_datadog_api_key
```

### 12. Feature Flags
```
# Feature toggles
ENABLE_HUB_DELIVERY=true
ENABLE_BUSINESS_PORTAL=true
ENABLE_SCHEDULED_DELIVERIES=true
ENABLE_COD=true
ENABLE_INSURANCE=true

# API Rate limiting
API_RATE_LIMIT=1000/hour
```

---

## 🛠️ SUPABASE SETUP STEPS

### 1. Create Supabase Project
```bash
# Go to https://supabase.com and create new project
# Note down:
- Project ID
- Database URL
- Anon Key
- Service Role Key
```

### 2. Create `.env.production` for Backend
```bash
cp backend/.env backend/.env.production
# Edit with production values
```

### 3. Deploy Database Migrations to Supabase
```bash
# Connect to Supabase PostgreSQL
psql postgresql://postgres:PASSWORD@HOST:PORT/postgres -f backend/core/migrations/*.sql

# Or use Django migrations:
python manage.py migrate --database=supabase
```

### 4. Set Up Environment Variables in Supabase
- Supabase Dashboard → Project Settings → Database
- Store credentials in your CI/CD (GitHub Actions, Vercel, etc.)

---

## 🚀 VERCEL DEPLOYMENT STEPS

### 1. Connect GitHub Repository
- Vercel Dashboard → New Project → Import Git Repo
- Select `Yanzi_Parcels` repository

### 2. Configure Build Settings
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3. Add Environment Variables
- Go to Settings → Environment Variables
- Add all `VITE_*` variables from this guide
- Set different values for Preview and Production environments

### 4. Configure API Proxy (if needed)
Create `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend-url/api/$1"
    }
  ]
}
```

### 5. Set Domain
- Settings → Domains
- Add your custom domain
- Update DNS records

---

## 🔐 SECURITY CHECKLIST

- [ ] Never commit `.env` files to Git
- [ ] Use strong SECRET_KEY (50+ random characters)
- [ ] Rotate API keys regularly
- [ ] Enable 2FA on Firebase, Stripe, PayPal, AWS accounts
- [ ] Use separate keys for development and production
- [ ] Set `DEBUG=False` in production
- [ ] HTTPS enabled everywhere
- [ ] CORS properly configured (not `*`)
- [ ] Firebase service account key kept secret
- [ ] Database backups enabled
- [ ] Rate limiting configured
- [ ] API authentication enforced

---

## 🧪 TESTING ENVIRONMENT VARIABLES

### Vercel Preview (Staging)
Use test API keys and staging database:
```
VITE_API_URL=https://staging-api.yourdomain.com
STRIPE_PUBLIC_KEY=pk_test_xxx
```

### Supabase Staging Database
```
DATABASE_URL=postgresql://postgres:PASSWORD@staging-host:5432/postgres
DEBUG=True  # Enable for debugging
```

---

## 📋 VARIABLE SUMMARY TABLE

| Variable | Vercel | Supabase | Type | Required |
|----------|--------|----------|------|----------|
| VITE_API_URL | ✅ | - | String | Yes |
| VITE_GOOGLE_MAPS_API_KEY | ✅ | - | String | Yes |
| DATABASE_URL | - | ✅ | String | Yes |
| SECRET_KEY | - | ✅ | String | Yes |
| DEBUG | - | ✅ | Boolean | Yes |
| STRIPE_PUBLIC_API_KEY | - | ✅ | String | No |
| STRIPE_API_SECRET_KEY | - | ✅ | String | No |
| PAYPAL_CLIENT_ID | - | ✅ | String | No |
| PAYPAL_CLIENT_SECRET | - | ✅ | String | No |
| FIREBASE_ADMIN_CREDENTIAL | - | ✅ | JSON | No |
| AWS_ACCESS_KEY_ID | - | ✅ | String | No |
| AWS_SECRET_ACCESS_KEY | - | ✅ | String | No |

---

## 🆘 TROUBLESHOOTING

### "API endpoint not found"
- Check `VITE_API_URL` is correct
- Ensure backend is deployed and running
- Check CORS settings in Django

### "Firebase credentials error"
- Verify `FIREBASE_ADMIN_CREDENTIAL` is valid JSON
- Check service account has required permissions
- Ensure file path is correct

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check firewall allows connections from Vercel/Lambda IPs
- Ensure database user has permissions

### "Static files not loading"
- Verify AWS S3 bucket configuration
- Check CloudFront distribution is active
- Ensure file permissions are public-read

---

## 📞 REFERENCE LINKS

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Django Settings](https://docs.djangoproject.com/en/4.2/ref/settings/)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Firebase Docs](https://firebase.google.com/docs)
- [PayPal Developer](https://developer.paypal.com)

---

**Last Updated:** December 2025  
**Version:** 1.0.0
