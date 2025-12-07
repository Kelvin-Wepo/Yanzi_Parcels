from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Customer, Courier, Category, Job, Transaction, 
    Message, QuickMessage, MaskedPhoneSession,
    Vehicle, VehicleType,
    SavedAddress, Recipient, ScheduledDelivery,
    Rating, ReferralCode, Referral, Wallet, WalletTransaction,
    CashOnDelivery, DeliveryInsurance, InsuranceClaim,
    TrackingLink, BusinessAccount
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password2']

    def validate_email(self, value):
        email = value.lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email already exists")
        return email

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        email = validated_data['email'].lower()
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        return user


class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'user', 'avatar', 'phone_number', 'stripe_card_last4']
        read_only_fields = ['id', 'stripe_card_last4']


class CustomerProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'email', 'avatar', 'phone_number', 'stripe_card_last4']
        read_only_fields = ['id', 'stripe_card_last4', 'email']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if user_data:
            instance.user.first_name = user_data.get('first_name', instance.user.first_name)
            instance.user.last_name = user_data.get('last_name', instance.user.last_name)
            instance.user.save()
        
        instance.avatar = validated_data.get('avatar', instance.avatar)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.save()
        return instance


# =============================================================================
# Vehicle Serializers
# =============================================================================

class VehicleSerializer(serializers.ModelSerializer):
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'vehicle_type', 'vehicle_type_display', 'plate_number',
            'make', 'model', 'year', 'color',
            'max_weight_kg', 'cargo_length_cm', 'cargo_width_cm', 'cargo_height_cm',
            'license_photo', 'insurance_photo', 'vehicle_photo', 'helmet_cam_photo',
            'insurance_number', 'insurance_expiry',
            'verification_status', 'verification_notes', 'verified_at',
            'is_active', 'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'verification_status', 'verification_notes', 'verified_at', 'created_at']


class VehicleRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for courier to register a new vehicle"""
    class Meta:
        model = Vehicle
        fields = [
            'vehicle_type', 'plate_number', 'make', 'model', 'year', 'color',
            'max_weight_kg', 'cargo_length_cm', 'cargo_width_cm', 'cargo_height_cm',
            'license_photo', 'insurance_photo', 'vehicle_photo', 'helmet_cam_photo',
            'insurance_number', 'insurance_expiry',
        ]

    def validate_plate_number(self, value):
        # Basic validation - ensure it looks like a Kenyan plate
        value = value.upper().strip()
        if len(value) < 5:
            raise serializers.ValidationError("Invalid plate number format")
        return value


class VehicleTypeInfoSerializer(serializers.Serializer):
    """Info about a vehicle type for display"""
    vehicle_type = serializers.CharField()
    vehicle_name = serializers.CharField()
    can_handle = serializers.BooleanField()
    reason = serializers.CharField(allow_null=True)
    price = serializers.IntegerField()
    price_breakdown = serializers.DictField()
    estimated_time = serializers.CharField()
    estimated_minutes = serializers.IntegerField()
    max_weight_kg = serializers.IntegerField()
    is_recommended = serializers.BooleanField()
    icon = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
    
    def get_icon(self, obj):
        from core.utils.pricing import get_vehicle_info
        info = get_vehicle_info(obj.get('vehicle_type'))
        return info.get('icon', '🚗')
    
    def get_description(self, obj):
        from core.utils.pricing import get_vehicle_info
        info = get_vehicle_info(obj.get('vehicle_type'))
        return info.get('description', '')
    
    def get_features(self, obj):
        from core.utils.pricing import get_vehicle_info
        info = get_vehicle_info(obj.get('vehicle_type'))
        return info.get('features', [])


class CourierSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    active_vehicle = VehicleSerializer(read_only=True)
    available_vehicle_types = serializers.ListField(read_only=True)
    
    class Meta:
        model = Courier
        fields = [
            'id', 'user', 'lat', 'lng', 'paypal_email', 'fcm_token',
            'active_vehicle', 'available_vehicle_types', 'is_verified',
            'rating', 'total_deliveries', 'profile_photo'
        ]
        read_only_fields = ['id', 'is_verified', 'rating', 'total_deliveries']


class CourierProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email', read_only=True)
    total_earnings = serializers.SerializerMethodField()
    total_jobs = serializers.SerializerMethodField()
    total_km = serializers.SerializerMethodField()
    vehicles = VehicleSerializer(many=True, read_only=True)
    active_vehicle = VehicleSerializer(read_only=True)
    
    class Meta:
        model = Courier
        fields = [
            'id', 'first_name', 'last_name', 'email', 'paypal_email',
            'total_earnings', 'total_jobs', 'total_km',
            'is_verified', 'rating', 'total_deliveries',
            'national_id', 'driving_license', 'profile_photo',
            'vehicles', 'active_vehicle'
        ]
        read_only_fields = ['id', 'email', 'total_earnings', 'total_jobs', 'total_km', 'is_verified', 'rating']

    def get_total_earnings(self, obj):
        jobs = Job.objects.filter(courier=obj, status=Job.COMPLETED_STATUS)
        return round(sum(job.price for job in jobs) * 0.8, 2)

    def get_total_jobs(self, obj):
        return Job.objects.filter(courier=obj, status=Job.COMPLETED_STATUS).count()

    def get_total_km(self, obj):
        jobs = Job.objects.filter(courier=obj, status=Job.COMPLETED_STATUS)
        return sum(job.distance for job in jobs)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if user_data:
            instance.user.first_name = user_data.get('first_name', instance.user.first_name)
            instance.user.last_name = user_data.get('last_name', instance.user.last_name)
            instance.user.save()
        
        instance.paypal_email = validated_data.get('paypal_email', instance.paypal_email)
        instance.save()
        return instance


class CourierVerificationSerializer(serializers.ModelSerializer):
    """Serializer for courier to submit verification documents"""
    class Meta:
        model = Courier
        fields = ['national_id', 'national_id_photo', 'driving_license', 'driving_license_photo', 'profile_photo']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'slug', 'name', 'icon', 'description']


class JobListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.user.get_full_name', read_only=True)
    courier_name = serializers.CharField(source='courier.user.get_full_name', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    size_display = serializers.CharField(source='get_size_display', read_only=True)
    weight_display = serializers.CharField(source='get_weight_display', read_only=True)
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'name', 'description', 'category', 'category_name', 
            'size', 'size_display', 'weight', 'weight_display',
            'vehicle_type', 'vehicle_type_display',
            'quantity', 'photo', 'status', 'status_display', 'created_at',
            'pickup_address', 'delivery_address', 'distance', 'duration', 'price',
            'customer_name', 'courier_name'
        ]


class JobDetailSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    courier = CourierSerializer(read_only=True, allow_null=True)
    category = CategorySerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    size_display = serializers.CharField(source='get_size_display', read_only=True)
    weight_display = serializers.CharField(source='get_weight_display', read_only=True)
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ['id', 'customer', 'courier', 'created_at', 'price', 'distance', 'duration']


class JobCreateStep1Serializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['name', 'description', 'category', 'size', 'weight', 'quantity', 'photo']


class JobCreateStep2Serializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['pickup_address', 'pick_lat', 'pick_up', 'pickup_name', 'pickup_phone']


class JobCreateStep3Serializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['delivery_address', 'delivery_lat', 'delivery_lng', 'delivery_name', 'delivery_phone']


class JobVehicleSelectionSerializer(serializers.Serializer):
    """Serializer for selecting vehicle type and calculating price"""
    vehicle_type = serializers.ChoiceField(choices=VehicleType.choices)


class JobCourierUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['pickup_photo', 'delivery_photo', 'status']
        read_only_fields = ['status']


class TransactionSerializer(serializers.ModelSerializer):
    job_name = serializers.CharField(source='job.name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'stripe_payment_intent_id', 'job', 'job_name', 'amount', 'status', 'created_at']
        read_only_fields = ['id', 'stripe_payment_intent_id', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password2 = serializers.CharField(required=True, min_length=8)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({"new_password": "Passwords don't match"})
        return data


# =============================================================================
# Chat & Messaging Serializers
# =============================================================================

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'job', 'sender_type', 'sender_name', 'content', 
            'is_quick_message', 'is_read', 'created_at', 'time_ago'
        ]
        read_only_fields = ['id', 'sender_type', 'sender_name', 'created_at', 'time_ago']

    def get_sender_name(self, obj):
        if obj.sender_type == Message.SENDER_SYSTEM:
            return 'System'
        if obj.sender_user:
            return obj.sender_user.get_full_name() or obj.sender_user.username
        return 'Unknown'

    def get_time_ago(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return 'Just now'
        elif diff < timedelta(hours=1):
            mins = int(diff.total_seconds() / 60)
            return f'{mins}m ago'
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f'{hours}h ago'
        else:
            return obj.created_at.strftime('%b %d, %H:%M')


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=1000)
    is_quick_message = serializers.BooleanField(default=False)


class QuickMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickMessage
        fields = ['id', 'text', 'emoji', 'user_type']


class MaskedPhoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaskedPhoneSession
        fields = ['customer_masked_number', 'courier_masked_number', 'is_active']


class ChatInfoSerializer(serializers.Serializer):
    """Combined chat info for a job"""
    job_id = serializers.UUIDField()
    job_status = serializers.CharField()
    other_party_name = serializers.CharField()
    other_party_avatar = serializers.CharField(allow_null=True)
    masked_phone = serializers.CharField(allow_null=True)
    unread_count = serializers.IntegerField()
    last_message = MessageSerializer(allow_null=True)


# =============================================================================
# Saved Addresses Serializers
# =============================================================================

class SavedAddressSerializer(serializers.ModelSerializer):
    address_type_display = serializers.CharField(source='get_address_type_display', read_only=True)
    
    class Meta:
        model = SavedAddress
        fields = [
            'id', 'label', 'address_type', 'address_type_display',
            'address', 'lat', 'lng',
            'contact_name', 'contact_phone',
            'building_name', 'floor_unit', 'landmark', 'instructions',
            'is_default_pickup', 'is_default_delivery',
            'use_count', 'last_used', 'created_at'
        ]
        read_only_fields = ['id', 'use_count', 'last_used', 'created_at']


class SavedAddressCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAddress
        fields = [
            'label', 'address_type', 'address', 'lat', 'lng',
            'contact_name', 'contact_phone',
            'building_name', 'floor_unit', 'landmark', 'instructions',
            'is_default_pickup', 'is_default_delivery'
        ]

    def create(self, validated_data):
        customer = self.context['request'].user.customer
        
        # If setting as default, unset other defaults
        if validated_data.get('is_default_pickup'):
            SavedAddress.objects.filter(customer=customer, is_default_pickup=True).update(is_default_pickup=False)
        if validated_data.get('is_default_delivery'):
            SavedAddress.objects.filter(customer=customer, is_default_delivery=True).update(is_default_delivery=False)
        
        return SavedAddress.objects.create(customer=customer, **validated_data)


# =============================================================================
# Recipients Address Book Serializers
# =============================================================================

class RecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipient
        fields = [
            'id', 'name', 'phone_number', 'email',
            'address', 'lat', 'lng',
            'company', 'notes',
            'delivery_count', 'last_delivery', 'is_favorite',
            'created_at'
        ]
        read_only_fields = ['id', 'delivery_count', 'last_delivery', 'created_at']


class RecipientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipient
        fields = [
            'name', 'phone_number', 'email',
            'address', 'lat', 'lng',
            'company', 'notes', 'is_favorite'
        ]

    def create(self, validated_data):
        customer = self.context['request'].user.customer
        return Recipient.objects.create(customer=customer, **validated_data)


# =============================================================================
# Scheduled Deliveries Serializers
# =============================================================================

class ScheduledDeliverySerializer(serializers.ModelSerializer):
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    recipient_name = serializers.CharField(source='recipient.name', read_only=True, allow_null=True)
    
    class Meta:
        model = ScheduledDelivery
        fields = [
            'id', 'name', 'category', 'category_name',
            'description', 'size', 'weight', 'vehicle_type',
            'pickup_address', 'pickup_lat', 'pickup_lng', 'pickup_name', 'pickup_phone',
            'delivery_address', 'delivery_lat', 'delivery_lng', 'delivery_name', 'delivery_phone',
            'recipient', 'recipient_name',
            'frequency', 'frequency_display', 'preferred_time', 'preferred_day',
            'start_date', 'end_date', 'next_delivery_date', 'last_delivery_date',
            'deliveries_completed', 'max_deliveries',
            'estimated_price', 'auto_pay',
            'status', 'status_display', 'created_at'
        ]
        read_only_fields = [
            'id', 'next_delivery_date', 'last_delivery_date', 
            'deliveries_completed', 'created_at'
        ]


class ScheduledDeliveryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledDelivery
        fields = [
            'name', 'category', 'description', 'size', 'weight', 'vehicle_type',
            'pickup_address', 'pickup_lat', 'pickup_lng', 'pickup_name', 'pickup_phone',
            'delivery_address', 'delivery_lat', 'delivery_lng', 'delivery_name', 'delivery_phone',
            'recipient', 'frequency', 'preferred_time', 'preferred_day',
            'start_date', 'end_date', 'max_deliveries', 'auto_pay'
        ]

    def create(self, validated_data):
        customer = self.context['request'].user.customer
        return ScheduledDelivery.objects.create(customer=customer, **validated_data)


# =============================================================================
# Rating & Review Serializers
# =============================================================================

class RatingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.user.get_full_name', read_only=True)
    courier_name = serializers.CharField(source='courier.user.get_full_name', read_only=True)
    job_description = serializers.CharField(source='job.description', read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'job', 'customer', 'customer_name', 'courier', 'courier_name',
            'job_description',
            'overall_rating', 'speed_rating', 'communication_rating', 'care_rating',
            'review', 'tags', 'tip_amount',
            'courier_response', 'response_date',
            'is_public', 'created_at'
        ]
        read_only_fields = ['id', 'customer', 'courier', 'created_at']


class RatingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = [
            'job', 'overall_rating', 'speed_rating', 'communication_rating', 
            'care_rating', 'review', 'tags', 'tip_amount'
        ]

    def validate_overall_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def validate(self, data):
        job = data.get('job')
        if job.status != Job.COMPLETED_STATUS:
            raise serializers.ValidationError("Can only rate completed deliveries")
        if Rating.objects.filter(job=job).exists():
            raise serializers.ValidationError("This delivery has already been rated")
        return data

    def create(self, validated_data):
        job = validated_data['job']
        return Rating.objects.create(
            customer=job.customer,
            courier=job.courier,
            **validated_data
        )


class CourierRatingResponseSerializer(serializers.Serializer):
    """For courier to respond to a rating"""
    response = serializers.CharField(max_length=500)


# =============================================================================
# Referral Program Serializers
# =============================================================================

class ReferralCodeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = ReferralCode
        fields = [
            'id', 'code', 'user_name',
            'referrer_reward', 'referee_reward',
            'total_referrals', 'successful_referrals', 'total_earned',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'code', 'total_referrals', 'successful_referrals', 'total_earned', 'created_at']


class ReferralSerializer(serializers.ModelSerializer):
    referrer_name = serializers.CharField(source='referral_code.user.get_full_name', read_only=True)
    referee_name = serializers.CharField(source='referred_user.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Referral
        fields = [
            'id', 'referral_code', 'referrer_name',
            'referred_user', 'referred_email', 'referee_name',
            'referrer_reward_amount', 'referee_reward_amount',
            'referrer_rewarded', 'referee_rewarded',
            'status', 'status_display', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'completed_at']


class ApplyReferralCodeSerializer(serializers.Serializer):
    """For new users to apply a referral code"""
    code = serializers.CharField(max_length=20)

    def validate_code(self, value):
        code = value.upper().strip()
        try:
            referral_code = ReferralCode.objects.get(code=code, is_active=True)
        except ReferralCode.DoesNotExist:
            raise serializers.ValidationError("Invalid referral code")
        return code


# =============================================================================
# Wallet Serializers
# =============================================================================

class WalletSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Wallet
        fields = ['id', 'user_name', 'balance', 'total_earned', 'total_spent', 'created_at']
        read_only_fields = ['id', 'balance', 'total_earned', 'total_spent', 'created_at']


class WalletTransactionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    job_description = serializers.CharField(source='job.description', read_only=True, allow_null=True)
    
    class Meta:
        model = WalletTransaction
        fields = [
            'id', 'amount', 'transaction_type', 'type_display',
            'description', 'job', 'job_description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# =============================================================================
# Cash on Delivery Serializers
# =============================================================================

class CashOnDeliverySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    job_description = serializers.CharField(source='job.description', read_only=True)
    
    class Meta:
        model = CashOnDelivery
        fields = [
            'id', 'job', 'job_description',
            'amount_to_collect', 'amount_collected', 'collected_at', 'collection_method',
            'remittance_method', 'remittance_account', 'remitted_at', 'remittance_reference',
            'cod_fee', 'notes', 'recipient_signature',
            'status', 'status_display', 'created_at'
        ]
        read_only_fields = ['id', 'job', 'cod_fee', 'created_at']


class CashOnDeliveryCreateSerializer(serializers.Serializer):
    """Add COD to a job during creation"""
    amount_to_collect = serializers.FloatField(min_value=100)
    remittance_method = serializers.ChoiceField(choices=['mpesa', 'bank'])
    remittance_account = serializers.CharField(max_length=100)


class CODCollectionSerializer(serializers.Serializer):
    """For courier to mark COD as collected"""
    amount_collected = serializers.FloatField()
    collection_method = serializers.ChoiceField(choices=['cash', 'mpesa'])
    notes = serializers.CharField(required=False, allow_blank=True)


# =============================================================================
# Delivery Insurance Serializers
# =============================================================================

class DeliveryInsuranceSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = DeliveryInsurance
        fields = [
            'id', 'job', 'tier', 'tier_display',
            'declared_value', 'coverage_amount', 'premium',
            'item_description', 'item_photos',
            'status', 'status_display', 'created_at'
        ]
        read_only_fields = ['id', 'coverage_amount', 'premium', 'created_at']


class InsuranceQuoteSerializer(serializers.Serializer):
    """Get an insurance quote"""
    declared_value = serializers.FloatField(min_value=1000)
    tier = serializers.ChoiceField(choices=DeliveryInsurance.TIERS)

    def validate(self, data):
        tier = data['tier']
        value = data['declared_value']
        
        # Check coverage limits
        limits = {
            DeliveryInsurance.TIER_BASIC: 5000,
            DeliveryInsurance.TIER_STANDARD: 20000,
            DeliveryInsurance.TIER_PREMIUM: 100000,
        }
        max_coverage = limits.get(tier, 5000)
        
        if value > max_coverage:
            raise serializers.ValidationError(
                f"Declared value exceeds {tier} tier limit of KSh {max_coverage}"
            )
        
        data['premium'] = DeliveryInsurance.calculate_premium(value, tier)
        data['coverage_amount'] = min(value, max_coverage)
        return data


class AddInsuranceSerializer(serializers.Serializer):
    """Add insurance to a job"""
    tier = serializers.ChoiceField(choices=DeliveryInsurance.TIERS)
    declared_value = serializers.FloatField(min_value=1000)
    item_description = serializers.CharField()
    item_photos = serializers.ListField(child=serializers.URLField(), required=False, default=list)


class InsuranceClaimSerializer(serializers.ModelSerializer):
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = InsuranceClaim
        fields = [
            'id', 'insurance', 'reason', 'reason_display',
            'description', 'evidence_photos',
            'claimed_amount', 'approved_amount',
            'reviewer_notes', 'reviewed_at',
            'payment_reference', 'paid_at',
            'status', 'status_display', 'created_at'
        ]
        read_only_fields = [
            'id', 'approved_amount', 'reviewer_notes', 'reviewed_at',
            'payment_reference', 'paid_at', 'status', 'created_at'
        ]


class InsuranceClaimCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceClaim
        fields = ['insurance', 'reason', 'description', 'evidence_photos', 'claimed_amount']

    def validate(self, data):
        insurance = data['insurance']
        if insurance.status != DeliveryInsurance.STATUS_ACTIVE:
            raise serializers.ValidationError("Cannot claim on inactive insurance")
        if data['claimed_amount'] > insurance.coverage_amount:
            raise serializers.ValidationError(
                f"Claimed amount exceeds coverage of KSh {insurance.coverage_amount}"
            )
        return data


# =============================================================================
# Tracking Link Serializers
# =============================================================================

class TrackingLinkSerializer(serializers.ModelSerializer):
    tracking_url = serializers.SerializerMethodField()
    job_status = serializers.CharField(source='job.status', read_only=True)
    
    class Meta:
        model = TrackingLink
        fields = [
            'id', 'job', 'short_code', 'tracking_url',
            'pin', 'view_count', 'last_viewed',
            'expires_at', 'is_active', 'created_at', 'job_status'
        ]
        read_only_fields = ['id', 'short_code', 'view_count', 'last_viewed', 'created_at']

    def get_tracking_url(self, obj):
        request = self.context.get('request')
        if request:
            return f"{request.scheme}://{request.get_host()}/track/{obj.short_code}"
        return f"/track/{obj.short_code}"


class CreateTrackingLinkSerializer(serializers.Serializer):
    """Create a new tracking link for sharing"""
    job_id = serializers.UUIDField()
    pin = serializers.CharField(max_length=6, required=False, allow_blank=True)
    expires_hours = serializers.IntegerField(required=False, min_value=1, max_value=168)  # Max 1 week


class PublicTrackingSerializer(serializers.Serializer):
    """Public tracking info (no sensitive data)"""
    job_id = serializers.UUIDField()
    status = serializers.CharField()
    status_display = serializers.CharField()
    pickup_address = serializers.CharField()
    delivery_address = serializers.CharField()
    courier_name = serializers.CharField(allow_null=True)
    courier_rating = serializers.FloatField(allow_null=True)
    estimated_delivery = serializers.CharField(allow_null=True)
    current_location = serializers.DictField(allow_null=True)
    created_at = serializers.DateTimeField()
    pickedup_at = serializers.DateTimeField(allow_null=True)
    delivered_at = serializers.DateTimeField(allow_null=True)


# =============================================================================
# Business Account Serializers
# =============================================================================

class BusinessAccountSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    available_credit = serializers.SerializerMethodField()
    
    class Meta:
        model = BusinessAccount
        fields = [
            'id', 'business_name', 'business_type', 'registration_number', 'kra_pin',
            'contact_name', 'contact_email', 'contact_phone',
            'business_address', 'business_lat', 'business_lng',
            'tier', 'tier_display', 'discount_percentage',
            'credit_limit', 'current_credit_used', 'available_credit',
            'billing_email', 'payment_terms',
            'api_key', 'webhook_url',
            'is_verified', 'is_active', 'created_at'
        ]
        read_only_fields = [
            'id', 'api_key', 'is_verified', 'credit_limit', 
            'discount_percentage', 'created_at'
        ]

    def get_available_credit(self, obj):
        return max(0, obj.credit_limit - obj.current_credit_used)


class BusinessAccountCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessAccount
        fields = [
            'business_name', 'business_type', 'registration_number', 'kra_pin',
            'contact_name', 'contact_email', 'contact_phone',
            'business_address', 'business_lat', 'business_lng',
            'billing_email', 'webhook_url'
        ]

    def create(self, validated_data):
        owner = self.context['request'].user
        return BusinessAccount.objects.create(owner=owner, **validated_data)


# =============================================================================
# Reorder Serializer
# =============================================================================

class ReorderJobSerializer(serializers.Serializer):
    """Create a new job based on a previous delivery"""
    original_job_id = serializers.UUIDField()
    
    # Optional overrides
    pickup_address = serializers.CharField(required=False)
    pickup_lat = serializers.FloatField(required=False)
    pickup_lng = serializers.FloatField(required=False)
    delivery_address = serializers.CharField(required=False)
    delivery_lat = serializers.FloatField(required=False)
    delivery_lng = serializers.FloatField(required=False)

    def validate_original_job_id(self, value):
        try:
            job = Job.objects.get(id=value)
            if job.status not in [Job.COMPLETED_STATUS, Job.CANCELLED_STATUS]:
                raise serializers.ValidationError("Can only reorder from completed or cancelled jobs")
            return value
        except Job.DoesNotExist:
            raise serializers.ValidationError("Original job not found")
