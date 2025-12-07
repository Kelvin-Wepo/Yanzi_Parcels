# Yanzi Parcels 🚚

A modern parcel delivery platform for Kenya, connecting customers with courier riders for fast and reliable deliveries.

## Architecture

This is a **decoupled** application with:
- **Backend**: Django REST Framework API (`/backend`)
- **Frontend**: React + Vite application (`/frontend`)

## Project Structure

```
Yanzi_Parcels/
├── backend/                    # Django REST API
│   ├── core/                   # Main Django app
│   │   ├── api/                # REST API endpoints
│   │   │   ├── auth.py         # Authentication (register, login, logout)
│   │   │   ├── customer.py     # Customer endpoints (jobs, profile)
│   │   │   ├── courier.py      # Courier endpoints (available jobs, deliveries)
│   │   │   └── urls.py         # API URL routing
│   │   ├── models.py           # Database models
│   │   ├── serializers.py      # DRF serializers
│   │   └── admin.py            # Django admin configuration
│   ├── Yanzi/                  # Django project settings
│   ├── media/                  # User uploaded files
│   ├── requirements.txt        # Python dependencies
│   └── manage.py
│
├── frontend/                   # React Application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── customer/       # Customer dashboard, job creation
│   │   │   └── courier/        # Courier dashboard, job management
│   │   ├── components/         # Reusable components
│   │   ├── layouts/            # Page layouts
│   │   ├── services/           # API client, Firebase
│   │   ├── stores/             # Zustand state management
│   │   └── App.jsx             # Main app with routing
│   ├── public/                 # Static assets
│   ├── package.json            # Node dependencies
│   └── vite.config.js          # Vite configuration
│
└── README.md
```

## Features

### For Customers
- 📦 Create delivery jobs with parcel details
- 📍 Specify pickup and delivery locations
- 🗺️ Real-time courier tracking on map
- 💳 Payment processing (Stripe)
- 📱 Push notifications for delivery updates

### For Couriers
- 🔍 Browse available delivery jobs
- ✅ Accept and manage deliveries
- 📸 Photo verification at pickup/delivery
- 💰 Earnings tracking and PayPal payouts
- 🔔 Real-time job notifications (Firebase)

## Tech Stack

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework** - API development
- **SimpleJWT** - JWT authentication
- **Firebase Admin** - Push notifications
- **Stripe** - Payment processing
- **SQLite/PostgreSQL** - Database

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **Google Maps** - Location & tracking
- **Firebase** - Push notifications

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/refresh/` - Refresh JWT token

### Customer
- `GET /api/customer/profile/` - Get profile
- `PUT /api/customer/profile/` - Update profile
- `GET /api/customer/jobs/` - List jobs
- `GET /api/customer/jobs/<id>/` - Job details
- `POST /api/customer/job/create/` - Create job (multi-step)
- `GET /api/customer/jobs/<id>/courier-location/` - Track courier

### Courier
- `GET /api/courier/profile/` - Get profile
- `GET /api/courier/jobs/available/` - Available jobs
- `POST /api/courier/jobs/available/<id>/` - Accept job
- `GET /api/courier/jobs/current/` - Current job
- `POST /api/courier/jobs/current/<id>/update/` - Update job status
- `POST /api/courier/location/` - Update location

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
STRIPE_PUBLIC_API_KEY=pk_test_xxx
STRIPE_API_SECRET_KEY=sk_test_xxx
GOOGLE_MAP_API_KEY=your-google-maps-key
```

### Frontend (.env)
```
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## License

MIT License
