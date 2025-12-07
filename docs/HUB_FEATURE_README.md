# 🎯 Micro-Hub Network - Feature Overview

## What We Built

A hyper-local delivery network that partners with local shops, kiosks, and pharmacies as parcel pickup/dropoff points, reducing last-mile delivery costs and providing faster customer access.

## Architecture

### Backend (Django)
```
/backend/core/
├── models.py (5 new models)
│   ├── Hub - Local pickup points
│   ├── HubDelivery - Parcels at hubs
│   ├── HubTransaction - Financial records
│   ├── HubRating - Customer feedback
│   └── HubPayout - Partner payouts
├── serializers.py (6 new serializers with distance calculation)
└── api/
    ├── hubs.py (5 ViewSets with 20+ endpoints)
    └── urls.py (registered all hub routes)
```

### Frontend (React)
```
/frontend/src/
├── services/
│   └── hubAPI.js - Complete REST API service
├── components/hub/
│   ├── HubFinder.jsx - Search nearby hubs
│   ├── HubDashboard.jsx - Partner portal
│   └── HubRegistration.jsx - Partner signup
└── pages/
    ├── HubPartnerPortal.jsx - Main hub portal
    ├── HubRegistrationPage.jsx - Registration page
    └── HubFinderPage.jsx - Hub search page
```

## Key Features

### 🏪 Hub Partner Portal
- Real-time dashboard with KPIs
- 8-digit pickup code verification
- Pending deliveries management
- Earnings tracking
- M-Pesa payout integration

### 📍 Hub Finder
- Location-based search
- Distance filtering (2km, 5km, 10km, 20km)
- Hub type icons and ratings
- Operating hours display
- Availability status

### 📝 Hub Registration
- Multi-step form
- GPS location capture
- Hub type selection (6 types)
- Operating hours config
- M-Pesa payment setup
- Storage capacity setting

## Database Schema

```sql
-- Hub table
CREATE TABLE hub (
    id UUID PRIMARY KEY,
    partner_id UUID REFERENCES user(id),
    hub_name VARCHAR(255),
    hub_type VARCHAR(50),
    hub_code VARCHAR(8) UNIQUE,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    address TEXT,
    city VARCHAR(100),
    area VARCHAR(100),
    contact_info JSONB,
    operating_hours JSONB,
    storage_capacity INTEGER,
    current_occupancy INTEGER DEFAULT 0,
    commission_percentage DECIMAL(5,2) DEFAULT 7.00,
    mpesa_number VARCHAR(15),
    status VARCHAR(20) DEFAULT 'pending',
    average_rating DECIMAL(3,2),
    total_earnings DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- HubDelivery table
CREATE TABLE hub_delivery (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES job(id),
    hub_id UUID REFERENCES hub(id),
    recipient_info JSONB,
    pickup_code VARCHAR(8),
    status VARCHAR(20) DEFAULT 'pending',
    arrived_at_hub TIMESTAMP,
    picked_up_at TIMESTAMP,
    is_cod BOOLEAN DEFAULT FALSE,
    cod_amount DECIMAL(10,2),
    hub_commission DECIMAL(10,2),
    photos JSONB,
    created_at TIMESTAMP
);
```

## API Endpoints

### Hub Management
```
GET    /api/hubs/                          # List all hubs
POST   /api/hubs/                          # Register new hub
GET    /api/hubs/{id}/                     # Hub details
PUT    /api/hubs/{id}/                     # Update hub
DELETE /api/hubs/{id}/                     # Delete hub
GET    /api/hubs/nearby/                   # Find nearby hubs
       ?lat={latitude}&lng={longitude}&radius={km}
GET    /api/hubs/{id}/dashboard/           # Hub metrics
POST   /api/hubs/{id}/verify-pickup/       # Verify pickup code
       body: { "pickup_code": "12345678" }
```

### Hub Deliveries
```
GET    /api/hub-deliveries/                # List deliveries
POST   /api/hub-deliveries/                # Create delivery
GET    /api/hub-deliveries/{id}/           # Delivery details
GET    /api/hub-deliveries/my-deliveries/  # Hub's deliveries
POST   /api/hub-deliveries/{id}/mark-arrived/ # Mark arrived
```

### Hub Transactions
```
GET    /api/hub-transactions/              # List transactions
GET    /api/hub-transactions/{id}/         # Transaction details
```

### Hub Ratings
```
POST   /api/hub-ratings/                   # Submit rating
       body: {
         "hub": "uuid",
         "delivery": "uuid",
         "rating": 5,
         "review": "Great service!"
       }
```

### Hub Payouts
```
GET    /api/hub-payouts/                   # List payouts
GET    /api/hub-payouts/{id}/              # Payout details
```

## Routes

```jsx
// App.jsx
<Route path="/hub/register" element={<HubRegistrationPage />} />
<Route path="/hub/partner" element={<HubPartnerPortal />} />
<Route path="/hub/finder" element={<HubFinderPage />} />
```

## Business Logic

### Distance Calculation (Haversine Formula)
```python
def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers"""
    R = 6371  # Earth radius in km
    
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c
```

### Pickup Code Generation
```python
import random
pickup_code = str(random.randint(10000000, 99999999))  # 8 digits
```

### Commission Calculation
```python
hub_commission = job_price * (hub.commission_percentage / 100)
# Default: 7% of job price
```

## Testing Checklist

### Backend Tests
- [ ] Hub creation with valid data
- [ ] Nearby hub search with coordinates
- [ ] Distance calculation accuracy
- [ ] Pickup code verification
- [ ] Commission calculation
- [ ] Payout generation
- [ ] Hub capacity management

### Frontend Tests
- [ ] Hub registration form submission
- [ ] Location permission request
- [ ] Hub search and filtering
- [ ] Distance display
- [ ] Pickup code entry
- [ ] Dashboard metrics display

### Integration Tests
- [ ] End-to-end hub delivery flow
- [ ] M-Pesa payment integration
- [ ] SMS notifications
- [ ] Rating submission
- [ ] Payout processing

## Performance Considerations

### Database Indexes
```sql
CREATE INDEX idx_hub_location ON hub USING GIST(ll_to_earth(latitude, longitude));
CREATE INDEX idx_hub_status ON hub(status);
CREATE INDEX idx_hub_city ON hub(city);
CREATE INDEX idx_hub_delivery_status ON hub_delivery(status);
CREATE INDEX idx_hub_delivery_pickup_code ON hub_delivery(pickup_code);
```

### Caching Strategy
- Cache nearby hubs for 5 minutes
- Cache hub details for 10 minutes
- Cache dashboard metrics for 1 minute
- Clear cache on status updates

## Security Measures

1. **Pickup Code Security**
   - 8-digit codes (100M combinations)
   - Single-use codes
   - Expiration after failed attempts

2. **Hub Partner Verification**
   - Background check required
   - Business license validation
   - Identity verification

3. **Payment Security**
   - M-Pesa transaction verification
   - Payout reconciliation
   - Fraud detection

## Monitoring & Analytics

### Key Metrics
```python
{
    "total_hubs": 150,
    "active_hubs": 142,
    "total_deliveries": 5420,
    "avg_pickup_time_hours": 4.2,
    "hub_utilization_rate": 0.68,
    "customer_satisfaction": 4.7,
    "total_commissions_paid": 45600.50
}
```

### Alerts
- Hub capacity > 90%
- Pickup time > 48 hours
- Rating drops below 4.0
- Payout failures

## Future Roadmap

### Phase 2
- [ ] QR code pickup system
- [ ] Multi-parcel pickup
- [ ] Hub chain management
- [ ] Capacity predictions

### Phase 3
- [ ] Cold storage hubs
- [ ] Oversized parcel hubs
- [ ] 24/7 locker systems
- [ ] Smart routing AI

### Phase 4
- [ ] Hub marketplace
- [ ] Cross-platform integration
- [ ] International hubs
- [ ] White-label solution

## Migration Applied

```bash
✅ Migration: 0015_hub_hubdelivery_hubtransaction_hubrating_hubpayout
   - Created 5 tables
   - Added indexes
   - Set up foreign keys
   - Applied successfully
```

## Files Created

### Backend (5 files)
1. `core/models.py` - Added 5 models (176 lines)
2. `core/serializers.py` - Added 6 serializers (145 lines)
3. `core/api/hubs.py` - Added 5 ViewSets (280 lines)
4. `core/api/urls.py` - Registered routes (12 lines)
5. `core/migrations/0015_hub_hubdelivery_hubtransaction_hubrating_hubpayout.py`

### Frontend (7 files)
1. `services/hubAPI.js` - API service (158 lines)
2. `components/hub/HubFinder.jsx` - Hub search (168 lines)
3. `components/hub/HubDashboard.jsx` - Partner dashboard (176 lines)
4. `components/hub/HubRegistration.jsx` - Registration form (472 lines)
5. `pages/HubPartnerPortal.jsx` - Portal page (27 lines)
6. `pages/HubRegistrationPage.jsx` - Registration page (22 lines)
7. `pages/HubFinderPage.jsx` - Finder page (29 lines)

### Documentation (2 files)
1. `docs/HUB_INTEGRATION_GUIDE.md` - Integration guide
2. `docs/HUB_FEATURE_README.md` - This file

**Total: 1,665+ lines of production code**

## Quick Start

1. **Start backend**:
```bash
cd /home/subchief/Yanzi_Parcels
source virtual/bin/activate
python manage.py runserver
```

2. **Start frontend**:
```bash
cd frontend
npm run dev
```

3. **Access routes**:
- Hub Registration: http://localhost:5173/hub/register
- Hub Finder: http://localhost:5173/hub/finder
- Hub Partner Portal: http://localhost:5173/hub/partner

## Contributing

When extending this feature:
1. Update models in `core/models.py`
2. Create/update serializers
3. Add API endpoints in `core/api/hubs.py`
4. Update frontend components
5. Write tests
6. Update documentation

---

**Status**: ✅ Core Implementation Complete  
**Next**: Integration into job creation flow  
**Version**: 1.0.0  
**Last Updated**: 2024
