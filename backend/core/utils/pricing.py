"""
Dynamic pricing engine for Yanzi Parcels
Calculates delivery prices based on vehicle type, parcel size/weight, distance, and traffic
"""
from core.models import VehicleType, Job


# =============================================================================
# Base Pricing Configuration (in KSh - Kenya Shillings)
# =============================================================================

# Base fare per vehicle type (minimum charge)
VEHICLE_BASE_FARE = {
    VehicleType.BODA_BODA: 100,    # Most affordable, quick in traffic
    VehicleType.TUK_TUK: 150,       # Slightly more capacity
    VehicleType.CAR: 250,           # Comfortable, secure
    VehicleType.VAN: 400,           # For medium cargo
    VehicleType.PICKUP: 600,        # For heavy/large cargo
}

# Per kilometer rate by vehicle type
VEHICLE_KM_RATE = {
    VehicleType.BODA_BODA: 25,      # KSh 25 per km
    VehicleType.TUK_TUK: 35,        # KSh 35 per km
    VehicleType.CAR: 50,            # KSh 50 per km
    VehicleType.VAN: 70,            # KSh 70 per km
    VehicleType.PICKUP: 90,         # KSh 90 per km
}

# Size multiplier (affects handling time and space)
SIZE_MULTIPLIER = {
    Job.SMALL_SIZE: 1.0,
    Job.MEDIUM_SIZE: 1.2,
    Job.LARGE_SIZE: 1.5,
    Job.EXTRA_LARGE_SIZE: 2.0,
}

# Weight multiplier (affects fuel consumption and effort)
WEIGHT_MULTIPLIER = {
    Job.WEIGHT_LIGHT: 1.0,
    Job.WEIGHT_MEDIUM: 1.15,
    Job.WEIGHT_HEAVY: 1.35,
    Job.WEIGHT_VERY_HEAVY: 1.6,
}

# Maximum capacity per vehicle type
VEHICLE_CAPACITY = {
    VehicleType.BODA_BODA: {
        'max_size': Job.MEDIUM_SIZE,
        'max_weight': Job.WEIGHT_MEDIUM,
        'max_weight_kg': 20,
    },
    VehicleType.TUK_TUK: {
        'max_size': Job.LARGE_SIZE,
        'max_weight': Job.WEIGHT_HEAVY,
        'max_weight_kg': 100,
    },
    VehicleType.CAR: {
        'max_size': Job.LARGE_SIZE,
        'max_weight': Job.WEIGHT_HEAVY,
        'max_weight_kg': 80,
    },
    VehicleType.VAN: {
        'max_size': Job.EXTRA_LARGE_SIZE,
        'max_weight': Job.WEIGHT_VERY_HEAVY,
        'max_weight_kg': 500,
    },
    VehicleType.PICKUP: {
        'max_size': Job.EXTRA_LARGE_SIZE,
        'max_weight': Job.WEIGHT_VERY_HEAVY,
        'max_weight_kg': 1000,
    },
}

# Estimated delivery time factors (base minutes per km)
VEHICLE_SPEED_FACTOR = {
    VehicleType.BODA_BODA: 2.5,    # Fastest in traffic - 2.5 min/km
    VehicleType.TUK_TUK: 3.5,      # Moderate speed - 3.5 min/km
    VehicleType.CAR: 4.0,          # Can get stuck in traffic - 4 min/km
    VehicleType.VAN: 5.0,          # Slower, larger vehicle - 5 min/km
    VehicleType.PICKUP: 5.5,       # Slowest - 5.5 min/km
}

# Peak hours surcharge (7-9 AM, 5-8 PM Nairobi time)
PEAK_HOUR_SURCHARGE = 1.25  # 25% extra during peak hours

# Night delivery surcharge (9 PM - 6 AM)
NIGHT_SURCHARGE = 1.15  # 15% extra at night

# Weather surcharge (rain)
RAIN_SURCHARGE = 1.2  # 20% extra during rain

# Minimum and maximum prices
MIN_PRICE = 100  # KSh 100 minimum
MAX_PRICE = 50000  # KSh 50,000 maximum


def calculate_price(
    vehicle_type: str,
    distance_km: float,
    size: str = Job.MEDIUM_SIZE,
    weight: str = Job.WEIGHT_LIGHT,
    quantity: int = 1,
    is_peak_hour: bool = False,
    is_night: bool = False,
    is_raining: bool = False,
) -> dict:
    """
    Calculate delivery price based on multiple factors.
    
    Returns:
        dict: Contains price breakdown and final price
    """
    # Base fare
    base_fare = VEHICLE_BASE_FARE.get(vehicle_type, VEHICLE_BASE_FARE[VehicleType.BODA_BODA])
    
    # Distance cost
    km_rate = VEHICLE_KM_RATE.get(vehicle_type, VEHICLE_KM_RATE[VehicleType.BODA_BODA])
    distance_cost = distance_km * km_rate
    
    # Size and weight multipliers
    size_mult = SIZE_MULTIPLIER.get(size, 1.0)
    weight_mult = WEIGHT_MULTIPLIER.get(weight, 1.0)
    
    # Quantity multiplier (diminishing - not linear)
    quantity_mult = 1 + (quantity - 1) * 0.3  # Each additional item adds 30%
    
    # Calculate subtotal
    subtotal = (base_fare + distance_cost) * size_mult * weight_mult * quantity_mult
    
    # Time-based surcharges
    surcharge_mult = 1.0
    surcharges = []
    
    if is_peak_hour:
        surcharge_mult *= PEAK_HOUR_SURCHARGE
        surcharges.append({'name': 'Peak Hour', 'multiplier': PEAK_HOUR_SURCHARGE})
    
    if is_night:
        surcharge_mult *= NIGHT_SURCHARGE
        surcharges.append({'name': 'Night Delivery', 'multiplier': NIGHT_SURCHARGE})
    
    if is_raining:
        surcharge_mult *= RAIN_SURCHARGE
        surcharges.append({'name': 'Weather (Rain)', 'multiplier': RAIN_SURCHARGE})
    
    # Final price
    final_price = subtotal * surcharge_mult
    
    # Apply min/max limits
    final_price = max(MIN_PRICE, min(MAX_PRICE, final_price))
    
    return {
        'base_fare': round(base_fare),
        'distance_cost': round(distance_cost),
        'distance_km': round(distance_km, 1),
        'size_multiplier': size_mult,
        'weight_multiplier': weight_mult,
        'quantity_multiplier': round(quantity_mult, 2),
        'subtotal': round(subtotal),
        'surcharges': surcharges,
        'surcharge_multiplier': round(surcharge_mult, 2),
        'final_price': round(final_price),
        'currency': 'KSh',
    }


def calculate_estimated_time(
    vehicle_type: str,
    distance_km: float,
    is_peak_hour: bool = False,
) -> dict:
    """
    Calculate estimated delivery time based on vehicle and distance.
    
    Returns:
        dict: Contains estimated pickup and delivery times
    """
    base_time = VEHICLE_SPEED_FACTOR.get(vehicle_type, 4.0)
    
    # Peak hour increases travel time
    if is_peak_hour:
        base_time *= 1.5  # 50% longer during peak hours
    
    # Travel time
    travel_time = distance_km * base_time
    
    # Add handling time (pickup + drop-off)
    handling_time = 10  # 10 minutes base handling
    
    total_time = travel_time + handling_time
    
    # Round to nearest 5 minutes
    total_time = round(total_time / 5) * 5
    
    return {
        'estimated_minutes': max(15, int(total_time)),  # Minimum 15 minutes
        'estimated_range': f"{max(10, int(total_time - 5))}-{int(total_time + 10)} mins",
        'vehicle_type': vehicle_type,
        'is_peak_hour': is_peak_hour,
    }


def get_vehicle_options(
    distance_km: float,
    size: str = Job.MEDIUM_SIZE,
    weight: str = Job.WEIGHT_LIGHT,
    quantity: int = 1,
    is_peak_hour: bool = False,
) -> list:
    """
    Get available vehicle options with pricing for a delivery.
    
    Returns:
        list: List of vehicle options with pricing
    """
    options = []
    
    # Size and weight order for comparison
    size_order = [Job.SMALL_SIZE, Job.MEDIUM_SIZE, Job.LARGE_SIZE, Job.EXTRA_LARGE_SIZE]
    weight_order = [Job.WEIGHT_LIGHT, Job.WEIGHT_MEDIUM, Job.WEIGHT_HEAVY, Job.WEIGHT_VERY_HEAVY]
    
    for vehicle_type in VehicleType.choices:
        vtype = vehicle_type[0]
        vname = vehicle_type[1]
        
        capacity = VEHICLE_CAPACITY.get(vtype, VEHICLE_CAPACITY[VehicleType.PICKUP])
        
        # Check if vehicle can handle the size
        max_size_idx = size_order.index(capacity['max_size'])
        parcel_size_idx = size_order.index(size)
        
        # Check if vehicle can handle the weight
        max_weight_idx = weight_order.index(capacity['max_weight'])
        parcel_weight_idx = weight_order.index(weight)
        
        can_handle = parcel_size_idx <= max_size_idx and parcel_weight_idx <= max_weight_idx
        
        # Calculate pricing
        pricing = calculate_price(
            vehicle_type=vtype,
            distance_km=distance_km,
            size=size,
            weight=weight,
            quantity=quantity,
            is_peak_hour=is_peak_hour,
        )
        
        # Calculate time estimate
        time_estimate = calculate_estimated_time(
            vehicle_type=vtype,
            distance_km=distance_km,
            is_peak_hour=is_peak_hour,
        )
        
        options.append({
            'vehicle_type': vtype,
            'vehicle_name': vname,
            'can_handle': can_handle,
            'reason': None if can_handle else f"Package too {'large' if parcel_size_idx > max_size_idx else 'heavy'} for this vehicle",
            'price': pricing['final_price'],
            'price_breakdown': pricing,
            'estimated_time': time_estimate['estimated_range'],
            'estimated_minutes': time_estimate['estimated_minutes'],
            'max_weight_kg': capacity['max_weight_kg'],
            'is_recommended': False,  # Will be set below
        })
    
    # Mark cheapest option that can handle the parcel as recommended
    valid_options = [o for o in options if o['can_handle']]
    if valid_options:
        cheapest = min(valid_options, key=lambda x: x['price'])
        for option in options:
            if option['vehicle_type'] == cheapest['vehicle_type']:
                option['is_recommended'] = True
    
    return options


def get_vehicle_info(vehicle_type: str) -> dict:
    """Get display information for a vehicle type"""
    VEHICLE_INFO = {
        VehicleType.BODA_BODA: {
            'name': 'Boda Boda',
            'description': 'Motorcycle - fastest in traffic, ideal for small packages',
            'icon': '🏍️',
            'features': ['Fastest delivery', 'Beats traffic', 'Small packages only'],
            'max_weight': '20 kg',
            'best_for': 'Documents, food, small electronics',
        },
        VehicleType.TUK_TUK: {
            'name': 'TukTuk',
            'description': 'Three-wheeler - good capacity with traffic agility',
            'icon': '🛺',
            'features': ['Good capacity', 'Weather protected', 'Economical'],
            'max_weight': '100 kg',
            'best_for': 'Medium packages, groceries, multiple items',
        },
        VehicleType.CAR: {
            'name': 'Car',
            'description': 'Sedan or hatchback - secure and comfortable',
            'icon': '🚗',
            'features': ['Secure transport', 'Climate controlled', 'Professional'],
            'max_weight': '80 kg',
            'best_for': 'Fragile items, electronics, clothing',
        },
        VehicleType.VAN: {
            'name': 'Van',
            'description': 'Cargo van - for larger deliveries',
            'icon': '🚐',
            'features': ['Large capacity', 'Weatherproof', 'Bulk orders'],
            'max_weight': '500 kg',
            'best_for': 'Furniture, appliances, business supplies',
        },
        VehicleType.PICKUP: {
            'name': 'Pickup Truck',
            'description': 'Open bed truck - for heavy and oversized cargo',
            'icon': '🛻',
            'features': ['Maximum capacity', 'Heavy loads', 'Construction materials'],
            'max_weight': '1000 kg',
            'best_for': 'Building materials, large equipment, moving',
        },
    }
    
    return VEHICLE_INFO.get(vehicle_type, VEHICLE_INFO[VehicleType.BODA_BODA])
