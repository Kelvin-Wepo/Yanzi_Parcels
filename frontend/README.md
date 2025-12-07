# Yanzi Parcels - Full Stack Application

A parcel delivery platform built with **Django REST Framework** backend and **React** frontend.

## Project Structure

```
Yanzi_Parcels/
├── core/                    # Django app
│   ├── api/                 # REST API endpoints
│   │   ├── auth.py         # Authentication APIs
│   │   ├── customer.py     # Customer APIs
│   │   ├── courier.py      # Courier APIs
│   │   └── urls.py         # API URL routing
│   ├── serializers.py      # DRF Serializers
│   ├── models.py           # Database models
│   └── ...
├── frontend/                # React application
│   ├── src/
│   │   ├── pages/          # Page components
│   │   │   ├── auth/       # Login, Register
│   │   │   ├── customer/   # Customer pages
│   │   │   └── courier/    # Courier pages
│   │   ├── layouts/        # Layout components
│   │   ├── stores/         # Zustand state management
│   │   ├── services/       # API & WebSocket services
│   │   └── App.jsx         # Main app component
│   └── package.json
├── Yanzi/                   # Django project settings
└── manage.py
```

## Features

### Customer Features
- User registration and authentication
- Profile management
- Multi-step job creation wizard
- Payment method management (Stripe)
- View current and archived jobs
- Real-time job status updates

### Courier Features
- Browse available jobs
- Accept and manage deliveries
- Photo proof of pickup and delivery
- Earnings tracking
- PayPal payout method setup

## Setup Instructions

### Backend (Django)

1. **Create and activate virtual environment:**
   ```bash
   cd Yanzi_Parcels
   python -m venv virtual
   source virtual/bin/activate  # On Windows: virtual\Scripts\activate
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Create a superuser:**
   ```bash
   python manage.py createsuperuser
   ```

5. **Start the Django server:**
   ```bash
   python manage.py runserver
   ```

   The API will be available at `http://localhost:8000/api/`

### Frontend (React)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The React app will be available at `http://localhost:5173`

### Redis (for WebSockets)

For real-time features, you need Redis running:

```bash
# Install Redis (Ubuntu/Debian)
sudo apt install redis-server

# Start Redis
sudo systemctl start redis

# Or using Docker
docker run -d -p 6379:6379 redis
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get tokens
- `POST /api/auth/logout/` - Logout (blacklist token)
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user info
- `POST /api/auth/change-password/` - Change password

### Customer
- `GET/PUT /api/customer/profile/` - Profile management
- `GET/DELETE /api/customer/payment-method/` - Payment method
- `GET /api/customer/jobs/` - List jobs (query: status=current|archived)
- `GET /api/customer/jobs/<id>/` - Job details
- `POST /api/customer/jobs/<id>/cancel/` - Cancel job
- `GET/POST/DELETE /api/customer/job/create/` - Job creation wizard

### Courier
- `GET/PUT /api/courier/profile/` - Profile management
- `GET/PUT /api/courier/payout-method/` - PayPal payout
- `GET /api/courier/jobs/available/` - Available jobs
- `GET/POST /api/courier/jobs/available/<id>/` - View/Accept job
- `GET /api/courier/jobs/current/` - Current active job
- `POST /api/courier/jobs/current/<id>/update/` - Upload photos
- `GET /api/courier/jobs/archived/` - Completed jobs
- `POST /api/courier/location/` - Update location
- `POST /api/courier/fcm-token/` - Update FCM token

## Environment Variables

Create a `.env` file in the root directory:

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True

# Stripe
STRIPE_PUBLIC_API_KEY=pk_test_xxx
STRIPE_API_SECRET_KEY=sk_test_xxx

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Firebase
FIREBASE_ADMIN_CREDENTIAL=path/to/firebase-credentials.json

# PayPal (optional)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
```

## Tech Stack

### Backend
- Django 3.2
- Django REST Framework
- Simple JWT (authentication)
- Django Channels (WebSockets)
- Stripe (payments)
- Firebase Admin SDK (push notifications)

### Frontend
- React 18
- Vite (build tool)
- React Router v6
- Zustand (state management)
- Tailwind CSS (styling)
- Axios (HTTP client)
- Stripe React SDK

## Development Notes

- The frontend proxies `/api` requests to Django backend (configured in `vite.config.js`)
- JWT tokens are stored in localStorage via Zustand persist
- Token refresh is handled automatically by axios interceptors
- WebSocket connections are used for real-time job status updates

## License

MIT License
