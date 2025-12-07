"""
API endpoints for tracking links, COD, insurance, and reorder.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from core.models import (
    TrackingLink, Job, CashOnDelivery, DeliveryInsurance, InsuranceClaim,
    Recipient
)
from core.serializers import (
    TrackingLinkSerializer, CreateTrackingLinkSerializer, PublicTrackingSerializer,
    CashOnDeliverySerializer, CashOnDeliveryCreateSerializer, CODCollectionSerializer,
    DeliveryInsuranceSerializer, InsuranceQuoteSerializer, AddInsuranceSerializer,
    InsuranceClaimSerializer, InsuranceClaimCreateSerializer,
    ReorderJobSerializer, JobDetailSerializer
)


# =============================================================================
# Tracking Link Views
# =============================================================================

class CreateTrackingLinkView(APIView):
    """Create a shareable tracking link"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateTrackingLinkSerializer(data=request.data)
        if serializer.is_valid():
            job_id = serializer.validated_data['job_id']
            job = get_object_or_404(Job, id=job_id)
            
            # Verify user owns this job
            is_customer = hasattr(request.user, 'customer') and job.customer == request.user.customer
            is_courier = hasattr(request.user, 'courier') and job.courier == request.user.courier
            
            if not (is_customer or is_courier):
                return Response(
                    {"error": "You don't have access to this job"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create tracking link
            expires_hours = serializer.validated_data.get('expires_hours')
            expires_at = timezone.now() + timedelta(hours=expires_hours) if expires_hours else None
            
            tracking_link = TrackingLink.objects.create(
                job=job,
                short_code=TrackingLink.generate_short_code(),
                created_by=request.user,
                pin=serializer.validated_data.get('pin', ''),
                expires_at=expires_at
            )
            
            return Response(
                TrackingLinkSerializer(tracking_link, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrackingLinkListView(APIView):
    """List tracking links for a job"""
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        
        # Verify access
        is_customer = hasattr(request.user, 'customer') and job.customer == request.user.customer
        is_courier = hasattr(request.user, 'courier') and job.courier == request.user.courier
        
        if not (is_customer or is_courier):
            return Response(
                {"error": "You don't have access to this job"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        links = job.tracking_links.filter(is_active=True)
        serializer = TrackingLinkSerializer(links, many=True, context={'request': request})
        return Response(serializer.data)


class PublicTrackingView(APIView):
    """Public tracking page - no auth required"""
    permission_classes = [AllowAny]

    def get(self, request, short_code):
        tracking_link = get_object_or_404(TrackingLink, short_code=short_code.upper())
        
        # Check if active and not expired
        if not tracking_link.is_active:
            return Response(
                {"error": "This tracking link is no longer active"},
                status=status.HTTP_410_GONE
            )
        
        if tracking_link.expires_at and tracking_link.expires_at < timezone.now():
            return Response(
                {"error": "This tracking link has expired"},
                status=status.HTTP_410_GONE
            )
        
        # Check PIN if required
        pin = request.query_params.get('pin')
        if tracking_link.pin and tracking_link.pin != pin:
            return Response(
                {"error": "PIN required", "requires_pin": True},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Increment view count
        tracking_link.increment_views()
        
        job = tracking_link.job
        
        # Get courier location if delivering
        current_location = None
        if job.courier and job.status == Job.DELIVERING_STATUS:
            current_location = {
                'lat': job.courier.lat,
                'lng': job.courier.lng
            }
        
        data = {
            'job_id': job.id,
            'status': job.status,
            'status_display': job.get_status_display(),
            'pickup_address': job.pickup_address,
            'delivery_address': job.delivery_address,
            'courier_name': job.courier.user.first_name if job.courier else None,
            'courier_rating': job.courier.rating if job.courier else None,
            'estimated_delivery': None,  # Could calculate based on distance/status
            'current_location': current_location,
            'created_at': job.created_at,
            'pickedup_at': job.pickedup_at,
            'delivered_at': job.delivered_at
        }
        
        return Response(data)


class ShareTrackingView(APIView):
    """Get shareable tracking message for WhatsApp/SMS"""
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        
        # Verify access
        is_customer = hasattr(request.user, 'customer') and job.customer == request.user.customer
        
        if not is_customer:
            return Response(
                {"error": "Only the sender can share tracking"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create tracking link
        tracking_link = job.tracking_links.filter(is_active=True).first()
        if not tracking_link:
            tracking_link = TrackingLink.objects.create(
                job=job,
                short_code=TrackingLink.generate_short_code(),
                created_by=request.user
            )
        
        base_url = f"{request.scheme}://{request.get_host()}"
        tracking_url = f"{base_url}/track/{tracking_link.short_code}"
        
        message = (
            f"📦 Your parcel is on the way!\n\n"
            f"From: {job.pickup_address}\n"
            f"To: {job.delivery_address}\n\n"
            f"Track it here: {tracking_url}\n\n"
            f"Sent via Yanzi Parcels 🚀"
        )
        
        whatsapp_url = f"https://wa.me/?text={message.replace(' ', '%20').replace('\n', '%0A')}"
        
        return Response({
            "tracking_code": tracking_link.short_code,
            "tracking_url": tracking_url,
            "message": message,
            "whatsapp_url": whatsapp_url,
            "sms_body": message
        })


# =============================================================================
# Cash on Delivery Views
# =============================================================================

class CODStatusView(APIView):
    """Get COD status for a job"""
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        
        try:
            cod = job.cod
            serializer = CashOnDeliverySerializer(cod)
            return Response(serializer.data)
        except CashOnDelivery.DoesNotExist:
            return Response({"has_cod": False})


class CODCollectView(APIView):
    """Courier marks COD as collected"""
    permission_classes = [IsAuthenticated]

    def post(self, request, job_id):
        try:
            courier = request.user.courier
        except:
            return Response(
                {"error": "Courier profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        job = get_object_or_404(Job, id=job_id, courier=courier)
        
        try:
            cod = job.cod
        except CashOnDelivery.DoesNotExist:
            return Response(
                {"error": "This job doesn't have COD"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if cod.status != CashOnDelivery.STATUS_PENDING:
            return Response(
                {"error": "COD already processed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CODCollectionSerializer(data=request.data)
        if serializer.is_valid():
            cod.amount_collected = serializer.validated_data['amount_collected']
            cod.collection_method = serializer.validated_data['collection_method']
            cod.notes = serializer.validated_data.get('notes', '')
            cod.collected_at = timezone.now()
            cod.status = CashOnDelivery.STATUS_COLLECTED
            cod.save()
            
            return Response(CashOnDeliverySerializer(cod).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# Delivery Insurance Views
# =============================================================================

class InsuranceQuoteView(APIView):
    """Get insurance quote"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InsuranceQuoteSerializer(data=request.data)
        if serializer.is_valid():
            return Response({
                'tier': serializer.validated_data['tier'],
                'declared_value': serializer.validated_data['declared_value'],
                'coverage_amount': serializer.validated_data['coverage_amount'],
                'premium': serializer.validated_data['premium']
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InsuranceTiersView(APIView):
    """Get available insurance tiers"""
    permission_classes = [AllowAny]

    def get(self, request):
        tiers = [
            {
                'tier': DeliveryInsurance.TIER_BASIC,
                'name': 'Basic',
                'max_coverage': 5000,
                'rate': '2%',
                'min_premium': 50,
                'description': 'Basic coverage for everyday items'
            },
            {
                'tier': DeliveryInsurance.TIER_STANDARD,
                'name': 'Standard',
                'max_coverage': 20000,
                'rate': '3%',
                'min_premium': 100,
                'description': 'Standard coverage for electronics and valuables'
            },
            {
                'tier': DeliveryInsurance.TIER_PREMIUM,
                'name': 'Premium',
                'max_coverage': 100000,
                'rate': '5%',
                'min_premium': 200,
                'description': 'Premium coverage for high-value items'
            }
        ]
        return Response(tiers)


class JobInsuranceView(APIView):
    """Get or add insurance to a job"""
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        
        try:
            insurance = job.insurance
            serializer = DeliveryInsuranceSerializer(insurance)
            return Response(serializer.data)
        except DeliveryInsurance.DoesNotExist:
            return Response({"has_insurance": False})

    def post(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        
        # Verify ownership
        if not hasattr(request.user, 'customer') or job.customer != request.user.customer:
            return Response(
                {"error": "Only job owner can add insurance"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Can only add insurance before pickup
        if job.status not in [Job.CREATING_STATUS, Job.PROCESSING_STATUS]:
            return Response(
                {"error": "Cannot add insurance after pickup"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already has insurance
        if hasattr(job, 'insurance'):
            return Response(
                {"error": "Job already has insurance"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AddInsuranceSerializer(data=request.data)
        if serializer.is_valid():
            tier = serializer.validated_data['tier']
            declared_value = serializer.validated_data['declared_value']
            
            # Calculate premium and coverage
            premium = DeliveryInsurance.calculate_premium(declared_value, tier)
            limits = {
                DeliveryInsurance.TIER_BASIC: 5000,
                DeliveryInsurance.TIER_STANDARD: 20000,
                DeliveryInsurance.TIER_PREMIUM: 100000,
            }
            coverage = min(declared_value, limits.get(tier, 5000))
            
            insurance = DeliveryInsurance.objects.create(
                job=job,
                tier=tier,
                declared_value=declared_value,
                coverage_amount=coverage,
                premium=premium,
                item_description=serializer.validated_data['item_description'],
                item_photos=serializer.validated_data.get('item_photos', [])
            )
            
            return Response(
                DeliveryInsuranceSerializer(insurance).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InsuranceClaimView(APIView):
    """File an insurance claim"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InsuranceClaimCreateSerializer(data=request.data)
        if serializer.is_valid():
            claim = serializer.save()
            
            # Update insurance status
            claim.insurance.status = DeliveryInsurance.STATUS_CLAIMED
            claim.insurance.save()
            
            return Response(
                InsuranceClaimSerializer(claim).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyInsuranceClaimsView(APIView):
    """Get user's insurance claims"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            customer = request.user.customer
            jobs = Job.objects.filter(customer=customer)
            claims = InsuranceClaim.objects.filter(
                insurance__job__in=jobs
            ).order_by('-created_at')
            serializer = InsuranceClaimSerializer(claims, many=True)
            return Response(serializer.data)
        except:
            return Response([])


# =============================================================================
# Reorder Views
# =============================================================================

class ReorderJobView(APIView):
    """Create a new job based on a previous delivery"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ReorderJobSerializer(data=request.data)
        if serializer.is_valid():
            original_job = Job.objects.get(id=serializer.validated_data['original_job_id'])
            
            # Verify ownership
            if original_job.customer != customer:
                return Response(
                    {"error": "You can only reorder your own deliveries"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create new job with same details
            new_job = Job.objects.create(
                customer=customer,
                name=original_job.name,
                description=original_job.description,
                category=original_job.category,
                size=original_job.size,
                weight=original_job.weight,
                vehicle_type=original_job.vehicle_type,
                # Use overrides if provided, otherwise use original
                pickup_address=serializer.validated_data.get('pickup_address', original_job.pickup_address),
                pick_lat=serializer.validated_data.get('pickup_lat', original_job.pick_lat),
                pick_up=serializer.validated_data.get('pickup_lng', original_job.pick_up),
                pickup_name=original_job.pickup_name,
                pickup_phone=original_job.pickup_phone,
                delivery_address=serializer.validated_data.get('delivery_address', original_job.delivery_address),
                delivery_lat=serializer.validated_data.get('delivery_lat', original_job.delivery_lat),
                delivery_lng=serializer.validated_data.get('delivery_lng', original_job.delivery_lng),
                delivery_name=original_job.delivery_name,
                delivery_phone=original_job.delivery_phone,
                distance=original_job.distance,
                duration=original_job.duration,
                price=original_job.price,
                status=Job.CREATING_STATUS
            )
            
            return Response({
                "message": "Job created from previous order",
                "job_id": str(new_job.id),
                "job": JobDetailSerializer(new_job).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReorderableJobsView(APIView):
    """Get list of jobs that can be reordered"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get completed jobs
        jobs = Job.objects.filter(
            customer=customer,
            status__in=[Job.COMPLETED_STATUS, Job.CANCELLED_STATUS]
        ).order_by('-created_at')[:20]
        
        reorderable = []
        for job in jobs:
            reorderable.append({
                'id': str(job.id),
                'description': job.description,
                'pickup_address': job.pickup_address,
                'delivery_address': job.delivery_address,
                'price': job.price,
                'created_at': job.created_at,
                'status': job.status
            })
        
        return Response(reorderable)
