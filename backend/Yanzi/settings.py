"""
Django settings for Yanzi Parcels API Backend.

This is a REST API backend serving a React frontend.
"""
import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-suhrp7jqr5rjs1fx!yr-1+%gs$k%4a117v1(qp7e6u$$3a3=*_')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ["*"]


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    
    # Local apps
    'core.apps.CoreConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Yanzi.urls'

# Templates (only needed for Django Admin)
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Yanzi.wsgi.application'


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True


# Static files (only needed for Django Admin)
STATIC_URL = '/static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Media files (user uploads)
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'


# =============================================================================
# REST Framework Configuration
# =============================================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# =============================================================================
# CORS Settings (for React frontend)
# =============================================================================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True


# =============================================================================
# Third-Party API Keys
# =============================================================================

# Firebase Admin SDK for push notifications
FIREBASE_ADMIN_CREDENTIAL = os.path.join(BASE_DIR, "yanzi-parcels-firebase-adminsdk-871so-c27093684a.json")

# Stripe Payment
STRIPE_PUBLIC_API_KEY = os.environ.get('STRIPE_PUBLIC_API_KEY', 'pk_test_51OLxrMIhECL0gCBjDJkMCCpbtdvIehnp30mZ8cYfjZgeXV2QsP7uAoisaOK8qSg1epcC9iBWFopI7G8gqv3iCVPV00MkrKBcuE')
STRIPE_API_SECRET_KEY = os.environ.get('STRIPE_API_SECRET_KEY', 'sk_test_51OLxrMIhECL0gCBjBgZSVnVJmCSzfhl7kOxTgJ0N5zsanIjgCUicnJz9h0v631cydfNgMktMXkahB3zXgEyVEXVO00xS7Clr6Z')

# Google Maps API for distance calculation
GOOGLE_MAP_API_KEY = os.environ.get('GOOGLE_MAP_API_KEY', 'AIzaSyDHB4sh9YIhktkXeDXYETgNQCdEZGWJagk')
GOOGLE_MAPS_API_KEY = GOOGLE_MAP_API_KEY  # Alias

# PayPal (for courier payouts)
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'Af8gMF1YL8g-SyYdyaQGyW_IwzPyTdOjnZjkmXB8qwhgSmItVLZ7beKoltcPIdBdF4dbVq-gVUy05pdY')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', 'EITj72I0l1RZzYVc-CZK2m-3jvLQuzKFFv4bH8Dmhxx8xjnQ5WmpxNJnZoE48RcRvF-rGURX9__A1Lgv')
