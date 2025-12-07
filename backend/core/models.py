import uuid 
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.

# =============================================================================
# Vehicle Type Choices
# =============================================================================
class VehicleType(models.TextChoices):
    BODA_BODA = 'boda_boda', 'Boda Boda (Motorcycle)'
    TUK_TUK = 'tuk_tuk', 'TukTuk (Three-Wheeler)'
    VAN = 'van', 'Van'
    PICKUP = 'pickup', 'Pickup Truck'
    CAR = 'car', 'Car'


class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='customer/avatar/', blank=True, null=True)
    phone_number = models.CharField(max_length=50, blank=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    stripe_payment_method_id = models.CharField(max_length=255, blank=True)
    stripe_card_last4 = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.user.get_full_name()


# =============================================================================
# Vehicle Model for Courier Fleet Management
# =============================================================================
class Vehicle(models.Model):
    """Vehicle registered by a courier for deliveries"""
    
    VERIFICATION_PENDING = 'pending'
    VERIFICATION_APPROVED = 'approved'
    VERIFICATION_REJECTED = 'rejected'
    VERIFICATION_STATUSES = (
        (VERIFICATION_PENDING, 'Pending Review'),
        (VERIFICATION_APPROVED, 'Approved'),
        (VERIFICATION_REJECTED, 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle_type = models.CharField(
        max_length=20, 
        choices=VehicleType.choices, 
        default=VehicleType.BODA_BODA
    )
    
    # Vehicle details
    plate_number = models.CharField(max_length=20)
    make = models.CharField(max_length=100, blank=True)  # e.g., Honda, Boxer
    model = models.CharField(max_length=100, blank=True)  # e.g., CB125, TVS
    year = models.IntegerField(null=True, blank=True)
    color = models.CharField(max_length=50, blank=True)
    
    # Capacity info
    max_weight_kg = models.FloatField(default=0)  # Maximum weight in kg
    cargo_length_cm = models.FloatField(default=0)  # Cargo space length
    cargo_width_cm = models.FloatField(default=0)  # Cargo space width
    cargo_height_cm = models.FloatField(default=0)  # Cargo space height
    
    # Verification documents
    license_photo = models.ImageField(upload_to='vehicle/license/', blank=True, null=True)
    insurance_photo = models.ImageField(upload_to='vehicle/insurance/', blank=True, null=True)
    vehicle_photo = models.ImageField(upload_to='vehicle/photos/', blank=True, null=True)
    helmet_cam_photo = models.ImageField(upload_to='vehicle/helmet_cam/', blank=True, null=True)
    
    # Insurance details
    insurance_number = models.CharField(max_length=100, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    
    # Verification status
    verification_status = models.CharField(
        max_length=20, 
        choices=VERIFICATION_STATUSES, 
        default=VERIFICATION_PENDING
    )
    verification_notes = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_vehicle_type_display()} - {self.plate_number}"

    @property
    def is_verified(self):
        return self.verification_status == self.VERIFICATION_APPROVED


class Courier(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True)
    lat = models.FloatField(default=0)
    lng = models.FloatField(default=0)
    paypal_email = models.EmailField(max_length=255, blank=True)
    fcm_token = models.TextField(blank=True)
    
    # Vehicle information
    vehicles = models.ManyToManyField(Vehicle, blank=True, related_name='couriers')
    active_vehicle = models.ForeignKey(
        Vehicle, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='active_for_courier'
    )
    
    # Courier verification
    is_verified = models.BooleanField(default=False)
    national_id = models.CharField(max_length=50, blank=True)
    national_id_photo = models.ImageField(upload_to='courier/id/', blank=True, null=True)
    driving_license = models.CharField(max_length=50, blank=True)
    driving_license_photo = models.ImageField(upload_to='courier/license/', blank=True, null=True)
    profile_photo = models.ImageField(upload_to='courier/profile/', blank=True, null=True)
    
    # Rating
    rating = models.FloatField(default=5.0)
    total_deliveries = models.IntegerField(default=0)
    total_ratings = models.IntegerField(default=0)

    def __str__(self):
        return self.user.get_full_name()
    
    @property
    def available_vehicle_types(self):
        """Get list of verified vehicle types this courier can use"""
        return list(self.vehicles.filter(
            verification_status=Vehicle.VERIFICATION_APPROVED,
            is_active=True
        ).values_list('vehicle_type', flat=True).distinct())

    def update_rating(self):
        """Recalculate courier's average rating from all ratings"""
        from django.db.models import Avg
        ratings = self.ratings_received.all()
        if ratings.exists():
            avg = ratings.aggregate(avg=Avg('overall_rating'))['avg']
            self.rating = round(avg, 2) if avg else 5.0
            self.total_ratings = ratings.count()
            self.save()



class Category(models.Model):
    slug = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    icon = models.CharField(max_length=50, blank=True, default='📦')  # Emoji or icon name
    description = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

class Job(models.Model):
    SMALL_SIZE = 'small'
    MEDIUM_SIZE = 'medium'
    LARGE_SIZE = 'large'
    EXTRA_LARGE_SIZE = 'extra_large'
    SIZES = (
        (SMALL_SIZE, "Small (fits in hand)"),
        (MEDIUM_SIZE, "Medium (fits in backpack)"),
        (LARGE_SIZE, "Large (needs carrier)"),
        (EXTRA_LARGE_SIZE, "Extra Large (needs vehicle cargo)"),
    )
    
    # Weight ranges for pricing
    WEIGHT_LIGHT = 'light'
    WEIGHT_MEDIUM = 'medium'
    WEIGHT_HEAVY = 'heavy'
    WEIGHT_VERY_HEAVY = 'very_heavy'
    WEIGHTS = (
        (WEIGHT_LIGHT, "Light (0-5 kg)"),
        (WEIGHT_MEDIUM, "Medium (5-15 kg)"),
        (WEIGHT_HEAVY, "Heavy (15-50 kg)"),
        (WEIGHT_VERY_HEAVY, "Very Heavy (50+ kg)"),
    )

    CREATING_STATUS = 'creating'
    PROCESSING_STATUS = 'processing'
    PICKING_STATUS = 'picking'
    DELIVERING_STATUS = 'delivering'
    COMPLETED_STATUS = 'completed'
    CANCELLED_STATUS = 'cancelled'
    STATUSES = (
        (CREATING_STATUS, 'Creating'),
        (PROCESSING_STATUS, 'Processing'),
        (PICKING_STATUS, 'Picking'),
        (DELIVERING_STATUS, 'Delivering'),
        (COMPLETED_STATUS, 'Completed'),
        (CANCELLED_STATUS, 'Cancelled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    courier = models.ForeignKey(Courier, on_delete=models.CASCADE,null=True,blank=True)
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    size = models.CharField(max_length=20, choices=SIZES, default=MEDIUM_SIZE)
    weight = models.CharField(max_length=20, choices=WEIGHTS, default=WEIGHT_LIGHT)
    quantity = models.IntegerField(default=1)
    photo = models.ImageField(upload_to='job/photos/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUSES, default=CREATING_STATUS)
    created_at = models.DateTimeField(default=timezone.now)
    
    # Vehicle type for this delivery
    vehicle_type = models.CharField(
        max_length=20, 
        choices=VehicleType.choices, 
        default=VehicleType.BODA_BODA
    )
    vehicle = models.ForeignKey(
        Vehicle, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='jobs'
    )

    pickup_address = models.CharField(max_length=255, blank=True)
    pick_lat = models.FloatField(default=0)
    pick_up = models.FloatField(default=0)
    pickup_name = models.CharField(max_length=255, blank=True)
    pickup_phone = models.CharField(max_length=50, blank=True)

    delivery_address = models.CharField(max_length=255, blank=True)
    delivery_lat = models.FloatField(default=0)
    delivery_lng = models.FloatField(default=0)
    delivery_name = models.CharField(max_length=255, blank=True)
    delivery_phone = models.CharField(max_length=50, blank=True)

    duration = models.IntegerField(default=0)
    distance = models.FloatField(default=0)
    price = models.FloatField(default=0)

    pickup_photo = models.ImageField(upload_to='job/pickup_photos/',null=True,blank=True)
    pickedup_at = models.DateTimeField(null=True,blank=True)

    delivery_photo = models.ImageField(upload_to='job/delivery_photos/',null=True,blank=True)
    delivered_at = models.DateTimeField(null=True,blank=True)


    def __str__(self):
        return self.description

class Transaction(models.Model):
    IN_STATUS = "in"
    OUT_STATUS = "out"
    STATUSES =(
        (IN_STATUS, 'In'),
        (OUT_STATUS, 'Out'),
    )
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    amount = models.FloatField(default=0)
    status = models.CharField(max_length=20, choices=STATUSES, default=IN_STATUS)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.stripe_payment_intent_id


class Message(models.Model):
    """Chat messages between customer and courier for a job"""
    SENDER_CUSTOMER = 'customer'
    SENDER_COURIER = 'courier'
    SENDER_SYSTEM = 'system'
    SENDER_TYPES = (
        (SENDER_CUSTOMER, 'Customer'),
        (SENDER_COURIER, 'Courier'),
        (SENDER_SYSTEM, 'System'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPES)
    sender_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField()
    is_quick_message = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender_type}: {self.content[:50]}"


class QuickMessage(models.Model):
    """Pre-defined quick messages for fast communication"""
    FOR_CUSTOMER = 'customer'
    FOR_COURIER = 'courier'
    FOR_BOTH = 'both'
    USER_TYPES = (
        (FOR_CUSTOMER, 'Customer'),
        (FOR_COURIER, 'Courier'),
        (FOR_BOTH, 'Both'),
    )

    text = models.CharField(max_length=255)
    emoji = models.CharField(max_length=10, blank=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default=FOR_BOTH)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.emoji} {self.text}"


class MaskedPhoneSession(models.Model):
    """Masked phone number session for privacy during delivery"""
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='masked_session')
    
    # Masked numbers (virtual numbers that forward to real numbers)
    customer_masked_number = models.CharField(max_length=20, blank=True)
    courier_masked_number = models.CharField(max_length=20, blank=True)
    
    # The actual phone numbers (stored for reference, never exposed)
    customer_real_number = models.CharField(max_length=20, blank=True)
    courier_real_number = models.CharField(max_length=20, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Masked session for Job {self.job.id}"

    def deactivate(self):
        """Deactivate the masked session when job is completed"""
        self.is_active = False
        self.save()


# =============================================================================
# Saved Addresses - Favorite pickup/delivery locations
# =============================================================================
class SavedAddress(models.Model):
    """Customer's saved addresses with custom labels"""
    ADDRESS_HOME = 'home'
    ADDRESS_OFFICE = 'office'
    ADDRESS_OTHER = 'other'
    ADDRESS_TYPES = (
        (ADDRESS_HOME, 'Home'),
        (ADDRESS_OFFICE, 'Office'),
        (ADDRESS_OTHER, 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='saved_addresses')
    
    label = models.CharField(max_length=100)  # "Home", "Office", "Mum's Place"
    address_type = models.CharField(max_length=20, choices=ADDRESS_TYPES, default=ADDRESS_OTHER)
    
    # Address details
    address = models.CharField(max_length=255)
    lat = models.FloatField()
    lng = models.FloatField()
    
    # Optional contact for this address
    contact_name = models.CharField(max_length=255, blank=True)
    contact_phone = models.CharField(max_length=50, blank=True)
    
    # Additional details
    building_name = models.CharField(max_length=255, blank=True)
    floor_unit = models.CharField(max_length=100, blank=True)  # "Floor 3, Unit 5B"
    landmark = models.CharField(max_length=255, blank=True)  # "Near Uchumi Supermarket"
    instructions = models.TextField(blank=True)  # "Gate code: 1234, ask for John"
    
    is_default_pickup = models.BooleanField(default=False)
    is_default_delivery = models.BooleanField(default=False)
    
    use_count = models.IntegerField(default=0)  # Track frequency
    last_used = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-use_count', '-last_used']
        verbose_name_plural = 'Saved Addresses'

    def __str__(self):
        return f"{self.label} - {self.address[:50]}"

    def increment_use(self):
        self.use_count += 1
        self.last_used = timezone.now()
        self.save()


# =============================================================================
# Address Book - Frequent recipients
# =============================================================================
class Recipient(models.Model):
    """Frequent recipients address book"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='recipients')
    
    # Recipient details
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=50)
    email = models.EmailField(blank=True)
    
    # Default address for this recipient
    address = models.CharField(max_length=255, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    
    # Additional info
    company = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)  # "Always call before delivery"
    
    # Usage tracking
    delivery_count = models.IntegerField(default=0)
    last_delivery = models.DateTimeField(null=True, blank=True)
    is_favorite = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_favorite', '-delivery_count', '-last_delivery']

    def __str__(self):
        return f"{self.name} ({self.phone_number})"

    def increment_delivery(self):
        self.delivery_count += 1
        self.last_delivery = timezone.now()
        self.save()


# =============================================================================
# Scheduled Deliveries - Recurring deliveries
# =============================================================================
class ScheduledDelivery(models.Model):
    """Scheduled and recurring deliveries"""
    FREQUENCY_ONCE = 'once'
    FREQUENCY_DAILY = 'daily'
    FREQUENCY_WEEKLY = 'weekly'
    FREQUENCY_BIWEEKLY = 'biweekly'
    FREQUENCY_MONTHLY = 'monthly'
    FREQUENCIES = (
        (FREQUENCY_ONCE, 'One Time'),
        (FREQUENCY_DAILY, 'Daily'),
        (FREQUENCY_WEEKLY, 'Weekly'),
        (FREQUENCY_BIWEEKLY, 'Every 2 Weeks'),
        (FREQUENCY_MONTHLY, 'Monthly'),
    )

    STATUS_ACTIVE = 'active'
    STATUS_PAUSED = 'paused'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUSES = (
        (STATUS_ACTIVE, 'Active'),
        (STATUS_PAUSED, 'Paused'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='scheduled_deliveries')
    
    # Schedule name
    name = models.CharField(max_length=255)  # "Weekly groceries to Mum"
    
    # Parcel details (template for creating jobs)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=255)
    size = models.CharField(max_length=20, choices=Job.SIZES, default=Job.MEDIUM_SIZE)
    weight = models.CharField(max_length=20, choices=Job.WEIGHTS, default=Job.WEIGHT_LIGHT)
    vehicle_type = models.CharField(max_length=20, choices=VehicleType.choices, default=VehicleType.BODA_BODA)
    
    # Pickup details
    pickup_address = models.CharField(max_length=255)
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    pickup_name = models.CharField(max_length=255, blank=True)
    pickup_phone = models.CharField(max_length=50, blank=True)
    
    # Delivery details
    delivery_address = models.CharField(max_length=255)
    delivery_lat = models.FloatField()
    delivery_lng = models.FloatField()
    delivery_name = models.CharField(max_length=255, blank=True)
    delivery_phone = models.CharField(max_length=50, blank=True)
    recipient = models.ForeignKey(Recipient, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Schedule settings
    frequency = models.CharField(max_length=20, choices=FREQUENCIES, default=FREQUENCY_WEEKLY)
    preferred_time = models.TimeField(null=True, blank=True)  # e.g., 10:00 AM
    preferred_day = models.IntegerField(null=True, blank=True)  # 0=Monday, 6=Sunday
    
    # Schedule tracking
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)  # null = no end date
    next_delivery_date = models.DateTimeField(null=True, blank=True)
    last_delivery_date = models.DateTimeField(null=True, blank=True)
    deliveries_completed = models.IntegerField(default=0)
    max_deliveries = models.IntegerField(null=True, blank=True)  # null = unlimited
    
    # Payment
    estimated_price = models.FloatField(default=0)
    auto_pay = models.BooleanField(default=False)  # Auto-charge saved payment method
    
    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['next_delivery_date']
        verbose_name_plural = 'Scheduled Deliveries'

    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"


# =============================================================================
# Rating & Review System
# =============================================================================
class Rating(models.Model):
    """Customer ratings for couriers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='rating')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='ratings_given')
    courier = models.ForeignKey(Courier, on_delete=models.CASCADE, related_name='ratings_received')
    
    # Rating values (1-5 stars)
    overall_rating = models.IntegerField()  # 1-5
    speed_rating = models.IntegerField(null=True, blank=True)  # 1-5
    communication_rating = models.IntegerField(null=True, blank=True)  # 1-5
    care_rating = models.IntegerField(null=True, blank=True)  # Package care
    
    # Review text
    review = models.TextField(blank=True)
    
    # Tags for quick feedback
    tags = models.JSONField(default=list)  # ["Fast", "Friendly", "Careful"]
    
    # Courier's response
    courier_response = models.TextField(blank=True)
    response_date = models.DateTimeField(null=True, blank=True)
    
    # Tip
    tip_amount = models.FloatField(default=0)  # KSh
    
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer} rated {self.courier}: {self.overall_rating}⭐"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update courier's average rating
        self.courier.update_rating()


# =============================================================================
# Referral Program
# =============================================================================
class ReferralCode(models.Model):
    """Referral codes for users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referral_code')
    
    code = models.CharField(max_length=20, unique=True)  # e.g., "JOHN2024"
    
    # Rewards configuration
    referrer_reward = models.FloatField(default=100)  # KSh for the person sharing
    referee_reward = models.FloatField(default=100)  # KSh for new user
    
    # Tracking
    total_referrals = models.IntegerField(default=0)
    successful_referrals = models.IntegerField(default=0)  # Completed first delivery
    total_earned = models.FloatField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.code} ({self.user.get_full_name()})"

    @classmethod
    def generate_code(cls, user):
        """Generate a unique referral code for user"""
        import random
        import string
        base = user.first_name.upper()[:4] if user.first_name else 'USER'
        while True:
            suffix = ''.join(random.choices(string.digits, k=4))
            code = f"{base}{suffix}"
            if not cls.objects.filter(code=code).exists():
                return code


class Referral(models.Model):
    """Track individual referrals"""
    STATUS_PENDING = 'pending'
    STATUS_SIGNED_UP = 'signed_up'
    STATUS_COMPLETED = 'completed'  # First delivery done
    STATUS_REWARDED = 'rewarded'
    STATUSES = (
        (STATUS_PENDING, 'Pending'),
        (STATUS_SIGNED_UP, 'Signed Up'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_REWARDED, 'Rewarded'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referral_code = models.ForeignKey(ReferralCode, on_delete=models.CASCADE, related_name='referrals')
    
    # The new user who was referred
    referred_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referred_by', null=True, blank=True)
    referred_email = models.EmailField()  # Store email before signup
    
    # Rewards
    referrer_reward_amount = models.FloatField(default=0)
    referee_reward_amount = models.FloatField(default=0)
    referrer_rewarded = models.BooleanField(default=False)
    referee_rewarded = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_PENDING)
    first_delivery_job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Referral: {self.referred_email} via {self.referral_code.code}"


class Wallet(models.Model):
    """User wallet for credits, rewards, and refunds"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    
    balance = models.FloatField(default=0)  # KSh
    total_earned = models.FloatField(default=0)  # From referrals, refunds
    total_spent = models.FloatField(default=0)  # On deliveries
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet: {self.user.get_full_name()} - KSh {self.balance}"

    def credit(self, amount, description=''):
        """Add credits to wallet"""
        self.balance += amount
        self.total_earned += amount
        self.save()
        WalletTransaction.objects.create(
            wallet=self,
            amount=amount,
            transaction_type='credit',
            description=description
        )

    def debit(self, amount, description=''):
        """Deduct from wallet"""
        if amount > self.balance:
            raise ValueError("Insufficient balance")
        self.balance -= amount
        self.total_spent += amount
        self.save()
        WalletTransaction.objects.create(
            wallet=self,
            amount=amount,
            transaction_type='debit',
            description=description
        )


class WalletTransaction(models.Model):
    """Wallet transaction history"""
    CREDIT = 'credit'
    DEBIT = 'debit'
    TYPES = (
        (CREDIT, 'Credit'),
        (DEBIT, 'Debit'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.FloatField()
    transaction_type = models.CharField(max_length=10, choices=TYPES)
    description = models.CharField(max_length=255, blank=True)
    
    # Reference to related objects
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
    referral = models.ForeignKey(Referral, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type}: KSh {self.amount}"


# =============================================================================
# Cash on Delivery (COD)
# =============================================================================
class CashOnDelivery(models.Model):
    """Cash on Delivery tracking"""
    STATUS_PENDING = 'pending'
    STATUS_COLLECTED = 'collected'
    STATUS_REMITTED = 'remitted'
    STATUS_FAILED = 'failed'
    STATUSES = (
        (STATUS_PENDING, 'Pending Collection'),
        (STATUS_COLLECTED, 'Collected'),
        (STATUS_REMITTED, 'Remitted to Sender'),
        (STATUS_FAILED, 'Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='cod')
    
    # Amount to collect
    amount_to_collect = models.FloatField()  # KSh to collect from recipient
    
    # Collection tracking
    amount_collected = models.FloatField(default=0)
    collected_at = models.DateTimeField(null=True, blank=True)
    collection_method = models.CharField(max_length=20, blank=True)  # cash, mpesa
    
    # Remittance to sender
    remittance_method = models.CharField(max_length=20, blank=True)  # mpesa, bank
    remittance_account = models.CharField(max_length=100, blank=True)
    remitted_at = models.DateTimeField(null=True, blank=True)
    remittance_reference = models.CharField(max_length=100, blank=True)
    
    # Courier's COD fee
    cod_fee = models.FloatField(default=0)  # Platform takes a small fee
    
    # Notes
    notes = models.TextField(blank=True)
    recipient_signature = models.ImageField(upload_to='cod/signatures/', null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_PENDING)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cash on Delivery'
        verbose_name_plural = 'Cash on Delivery Orders'

    def __str__(self):
        return f"COD for Job {self.job.id}: KSh {self.amount_to_collect}"


# =============================================================================
# Delivery Insurance
# =============================================================================
class DeliveryInsurance(models.Model):
    """Optional insurance for valuable deliveries"""
    TIER_BASIC = 'basic'
    TIER_STANDARD = 'standard'
    TIER_PREMIUM = 'premium'
    TIERS = (
        (TIER_BASIC, 'Basic (up to KSh 5,000)'),
        (TIER_STANDARD, 'Standard (up to KSh 20,000)'),
        (TIER_PREMIUM, 'Premium (up to KSh 100,000)'),
    )

    STATUS_ACTIVE = 'active'
    STATUS_CLAIMED = 'claimed'
    STATUS_EXPIRED = 'expired'
    STATUSES = (
        (STATUS_ACTIVE, 'Active'),
        (STATUS_CLAIMED, 'Claimed'),
        (STATUS_EXPIRED, 'Expired'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='insurance')
    
    tier = models.CharField(max_length=20, choices=TIERS, default=TIER_BASIC)
    declared_value = models.FloatField()  # Customer declares item value
    coverage_amount = models.FloatField()  # Maximum coverage
    premium = models.FloatField()  # Insurance cost
    
    # Item details for insurance
    item_description = models.TextField()
    item_photos = models.JSONField(default=list)  # List of photo URLs
    
    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name_plural = 'Delivery Insurance'

    def __str__(self):
        return f"Insurance for Job {self.job.id}: {self.get_tier_display()}"

    @classmethod
    def calculate_premium(cls, declared_value, tier):
        """Calculate insurance premium based on declared value and tier"""
        # Premium rates as percentage of declared value
        rates = {
            cls.TIER_BASIC: 0.02,  # 2%
            cls.TIER_STANDARD: 0.03,  # 3%
            cls.TIER_PREMIUM: 0.05,  # 5%
        }
        min_premiums = {
            cls.TIER_BASIC: 50,  # Min KSh 50
            cls.TIER_STANDARD: 100,  # Min KSh 100
            cls.TIER_PREMIUM: 200,  # Min KSh 200
        }
        rate = rates.get(tier, 0.02)
        min_premium = min_premiums.get(tier, 50)
        premium = max(declared_value * rate, min_premium)
        return round(premium, 2)


class InsuranceClaim(models.Model):
    """Insurance claims for damaged/lost items"""
    STATUS_SUBMITTED = 'submitted'
    STATUS_REVIEWING = 'reviewing'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_PAID = 'paid'
    STATUSES = (
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_REVIEWING, 'Under Review'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_PAID, 'Paid'),
    )

    REASON_DAMAGED = 'damaged'
    REASON_LOST = 'lost'
    REASON_STOLEN = 'stolen'
    REASONS = (
        (REASON_DAMAGED, 'Item Damaged'),
        (REASON_LOST, 'Item Lost'),
        (REASON_STOLEN, 'Item Stolen'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    insurance = models.ForeignKey(DeliveryInsurance, on_delete=models.CASCADE, related_name='claims')
    
    reason = models.CharField(max_length=20, choices=REASONS)
    description = models.TextField()
    evidence_photos = models.JSONField(default=list)  # Photos of damage
    
    claimed_amount = models.FloatField()
    approved_amount = models.FloatField(null=True, blank=True)
    
    # Review
    reviewer_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Payment
    payment_reference = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_SUBMITTED)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Claim for Insurance {self.insurance.id}: {self.get_reason_display()}"


# =============================================================================
# Tracking Links for Sharing
# =============================================================================
class TrackingLink(models.Model):
    """Shareable tracking links for deliveries"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='tracking_links')
    
    # Short code for easy sharing
    short_code = models.CharField(max_length=10, unique=True)
    
    # Access control
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    pin = models.CharField(max_length=6, blank=True)  # Optional PIN protection
    
    # Tracking
    view_count = models.IntegerField(default=0)
    last_viewed = models.DateTimeField(null=True, blank=True)
    
    # Expiry
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Tracking: {self.short_code} for Job {self.job.id}"

    @classmethod
    def generate_short_code(cls):
        """Generate a unique 6-character code"""
        import random
        import string
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not cls.objects.filter(short_code=code).exists():
                return code

    def increment_views(self):
        self.view_count += 1
        self.last_viewed = timezone.now()
        self.save()


# =============================================================================
# Business Accounts (Foundation for future)
# =============================================================================
class BusinessAccount(models.Model):
    """Business accounts for e-commerce/bulk deliveries"""
    TIER_STARTER = 'starter'
    TIER_GROWTH = 'growth'
    TIER_ENTERPRISE = 'enterprise'
    TIERS = (
        (TIER_STARTER, 'Starter (up to 50 deliveries/month)'),
        (TIER_GROWTH, 'Growth (up to 200 deliveries/month)'),
        (TIER_ENTERPRISE, 'Enterprise (unlimited)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='business_accounts')
    
    # Business details
    business_name = models.CharField(max_length=255)
    business_type = models.CharField(max_length=100, blank=True)  # e-commerce, restaurant, etc.
    registration_number = models.CharField(max_length=100, blank=True)
    kra_pin = models.CharField(max_length=50, blank=True)
    
    # Contact
    contact_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=50)
    
    # Address
    business_address = models.CharField(max_length=255)
    business_lat = models.FloatField(null=True, blank=True)
    business_lng = models.FloatField(null=True, blank=True)
    
    # Account settings
    tier = models.CharField(max_length=20, choices=TIERS, default=TIER_STARTER)
    discount_percentage = models.FloatField(default=0)  # Bulk discount
    credit_limit = models.FloatField(default=0)  # Post-pay credit limit
    current_credit_used = models.FloatField(default=0)
    
    # Billing
    billing_email = models.EmailField(blank=True)
    payment_terms = models.IntegerField(default=7)  # Days to pay invoice
    
    # API access
    api_key = models.CharField(max_length=64, unique=True, blank=True)
    webhook_url = models.URLField(blank=True)
    
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Business Accounts'

    def __str__(self):
        return f"{self.business_name} ({self.get_tier_display()})"

    def generate_api_key(self):
        """Generate a new API key"""
        import secrets
        self.api_key = secrets.token_hex(32)
        self.save()
        return self.api_key


# =============================================================================
# Bulk Order & Delivery Management
# =============================================================================
class BulkOrder(models.Model):
    """Bulk order containing multiple delivery items"""
    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_PARTIAL = 'partial'
    STATUS_ASSIGNED = 'assigned'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_PARTIAL, 'Partially Assigned'),
        (STATUS_ASSIGNED, 'Fully Assigned'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(BusinessAccount, on_delete=models.CASCADE, related_name='bulk_orders')
    
    # Order info
    order_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    
    # File upload
    csv_file = models.FileField(upload_to='bulk_orders/', blank=True, null=True)
    
    # Stats
    total_items = models.IntegerField(default=0)
    assigned_items = models.IntegerField(default=0)
    completed_items = models.IntegerField(default=0)
    failed_items = models.IntegerField(default=0)
    
    # Cost
    estimated_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    actual_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.business.business_name} - {self.order_name}"


class BulkDeliveryItem(models.Model):
    """Individual item in a bulk order"""
    STATUS_PENDING = 'pending'
    STATUS_ASSIGNED = 'assigned'
    STATUS_PICKED_UP = 'picked_up'
    STATUS_IN_TRANSIT = 'in_transit'
    STATUS_DELIVERED = 'delivered'
    STATUS_FAILED = 'failed'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Assignment'),
        (STATUS_ASSIGNED, 'Assigned to Courier'),
        (STATUS_PICKED_UP, 'Picked Up'),
        (STATUS_IN_TRANSIT, 'In Transit'),
        (STATUS_DELIVERED, 'Delivered'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bulk_order = models.ForeignKey(BulkOrder, on_delete=models.CASCADE, related_name='items')
    job = models.OneToOneField(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='bulk_item')
    
    # Delivery details
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)
    
    # Pickup
    pickup_address = models.CharField(max_length=255)
    pickup_phone = models.CharField(max_length=20)
    pickup_lat = models.DecimalField(max_digits=9, decimal_places=6)
    pickup_lng = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Delivery
    delivery_address = models.CharField(max_length=255)
    delivery_phone = models.CharField(max_length=20)
    delivery_lat = models.DecimalField(max_digits=9, decimal_places=6)
    delivery_lng = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Package details
    item_name = models.CharField(max_length=255)
    item_description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=2)
    size = models.CharField(max_length=20)  # small, medium, large
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    
    # Cost
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Notes
    special_instructions = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.bulk_order.business.business_name} - {self.item_name}"


class BusinessCredit(models.Model):
    """Credit account for prepaid services"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField(BusinessAccount, on_delete=models.CASCADE, related_name='credit_account')
    
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_purchased = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_used = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.business.business_name} - Balance: KES {self.balance}"


class BusinessCreditTransaction(models.Model):
    """Transaction record for credit movements"""
    TRANSACTION_PURCHASE = 'purchase'
    TRANSACTION_DELIVERY = 'delivery'
    TRANSACTION_REFUND = 'refund'
    TRANSACTION_ADJUSTMENT = 'adjustment'
    
    TRANSACTION_TYPES = [
        (TRANSACTION_PURCHASE, 'Credit Purchase'),
        (TRANSACTION_DELIVERY, 'Delivery Charge'),
        (TRANSACTION_REFUND, 'Refund'),
        (TRANSACTION_ADJUSTMENT, 'Admin Adjustment'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_account = models.ForeignKey(BusinessCredit, on_delete=models.CASCADE, related_name='transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.CharField(max_length=255)
    
    related_job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
    related_bulk_item = models.ForeignKey(BulkDeliveryItem, on_delete=models.SET_NULL, null=True, blank=True)
    
    balance_before = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.credit_account.business.business_name} - {self.get_transaction_type_display()}: KES {self.amount}"


class BusinessInvoice(models.Model):
    """Monthly invoice for business accounts"""
    STATUS_DRAFT = 'draft'
    STATUS_SENT = 'sent'
    STATUS_PAID = 'paid'
    STATUS_OVERDUE = 'overdue'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_SENT, 'Sent'),
        (STATUS_PAID, 'Paid'),
        (STATUS_OVERDUE, 'Overdue'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(BusinessAccount, on_delete=models.CASCADE, related_name='invoices')
    
    invoice_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    
    # Period
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Charges
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Payment
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Invoice {self.invoice_number}"


class BusinessAPILog(models.Model):
    """Track all API requests for auditing"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(BusinessAccount, on_delete=models.CASCADE, related_name='api_logs')
    
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    request_data = models.JSONField(default=dict, blank=True)
    response_data = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.business.business_name} - {self.endpoint} ({self.status_code})"

