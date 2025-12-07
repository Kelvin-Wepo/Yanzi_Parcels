"""Micro-Hub Network API Views"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Sum, Count
from decimal import Decimal

from core.models import (
    Hub, HubDelivery, HubTransaction, HubRating, HubPayout, Job
)
from core.serializers import (
    HubSerializer, HubCreateSerializer, HubDeliverySerializer,
    HubDeliveryCreateSerializer, HubTransactionSerializer,
    HubRatingSerializer, HubPayoutSerializer
)


class HubViewSet(viewsets.ModelViewSet):
    """Hub management for partners and customers"""
    permission_classes = [IsAuthenticated]
    serializer_class = HubSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Hub.objects.all()
        
        # Show user's own hubs or active hubs for customers
        return Hub.objects.filter(
            Q(partner=user) | Q(status=Hub.STATUS_ACTIVE)
        ).distinct()
    
    def create(self, request, *args, **kwargs):
        """Register new hub"""
        serializer = HubCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Generate hub code
            import random
            hub_code = f"HUB{random.randint(1000, 9999)}"
            while Hub.objects.filter(hub_code=hub_code).exists():
                hub_code = f"HUB{random.randint(1000, 9999)}"
            
            hub = serializer.save(
                partner=request.user,
                hub_code=hub_code,
                status=Hub.STATUS_PENDING
            )
            
            return Response(
                HubSerializer(hub).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Find nearby hubs based on location"""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = float(request.query_params.get('radius', 5))  # Default 5km
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude and longitude required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get active hubs
        hubs = Hub.objects.filter(status=Hub.STATUS_ACTIVE)
        
        # Calculate distance and filter
        from math import radians, sin, cos, sqrt, atan2
        nearby_hubs = []
        R = 6371  # Earth radius in km
        
        user_lat = radians(float(lat))
        user_lng = radians(float(lng))
        
        for hub in hubs:
            hub_lat = radians(float(hub.latitude))
            hub_lng = radians(float(hub.longitude))
            
            dlat = hub_lat - user_lat
            dlng = hub_lng - user_lng
            
            a = sin(dlat/2)**2 + cos(user_lat) * cos(hub_lat) * sin(dlng/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance = R * c
            
            if distance <= radius:
                nearby_hubs.append({
                    'hub': hub,
                    'distance': round(distance, 2)
                })
        
        # Sort by distance
        nearby_hubs.sort(key=lambda x: x['distance'])
        
        # Serialize
        result = []
        for item in nearby_hubs:
            hub_data = HubSerializer(item['hub'], context={'request': request}).data
            hub_data['distance'] = item['distance']
            result.append(hub_data)
        
        return Response(result)
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Hub partner dashboard metrics"""
        hub = self.get_object()
        if hub.partner != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Today's stats
        today = timezone.now().date()
        today_deliveries = hub.deliveries.filter(
            arrived_at_hub__date=today
        ).count()
        
        pending_pickups = hub.deliveries.filter(
            status__in=[HubDelivery.STATUS_AT_HUB, HubDelivery.STATUS_READY_FOR_PICKUP]
        ).count()
        
        # Month stats
        month_start = timezone.now().replace(day=1)
        month_deliveries = hub.deliveries.filter(
            arrived_at_hub__gte=month_start
        ).count()
        
        month_earnings = hub.transactions.filter(
            created_at__gte=month_start,
            transaction_type=HubTransaction.TRANSACTION_COMMISSION
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'hub_name': hub.hub_name,
            'hub_code': hub.hub_code,
            'status': hub.status,
            'current_occupancy': hub.current_occupancy,
            'storage_capacity': hub.storage_capacity,
            'occupancy_percentage': (hub.current_occupancy / hub.storage_capacity * 100) if hub.storage_capacity > 0 else 0,
            'today_deliveries': today_deliveries,
            'pending_pickups': pending_pickups,
            'month_deliveries': month_deliveries,
            'month_earnings': float(month_earnings),
            'total_earnings': float(hub.total_earnings),
            'average_rating': float(hub.average_rating),
        })
    
    @action(detail=True, methods=['post'])
    def verify_pickup(self, request, pk=None):
        """Verify pickup code and release parcel"""
        hub = self.get_object()
        if hub.partner != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        pickup_code = request.data.get('pickup_code')
        if not pickup_code:
            return Response({'error': 'Pickup code required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            delivery = HubDelivery.objects.get(hub=hub, pickup_code=pickup_code)
            
            if delivery.status == HubDelivery.STATUS_PICKED_UP:
                return Response({'error': 'Parcel already picked up'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark as picked up
            delivery.mark_picked_up()
            
            # Update job status
            if delivery.job:
                delivery.job.status = Job.COMPLETED_STATUS
                delivery.job.save()
            
            # Record commission if not paid
            if not delivery.commission_paid and delivery.hub_commission > 0:
                HubTransaction.objects.create(
                    hub=hub,
                    hub_delivery=delivery,
                    transaction_type=HubTransaction.TRANSACTION_COMMISSION,
                    amount=delivery.hub_commission,
                    description=f'Commission for delivery {delivery.id}',
                    balance_before=hub.total_earnings,
                    balance_after=hub.total_earnings + delivery.hub_commission
                )
                
                hub.total_earnings += delivery.hub_commission
                hub.save()
                
                delivery.commission_paid = True
                delivery.save()
            
            return Response({
                'message': 'Pickup verified successfully',
                'delivery': HubDeliverySerializer(delivery).data
            })
            
        except HubDelivery.DoesNotExist:
            return Response({'error': 'Invalid pickup code'}, status=status.HTTP_404_NOT_FOUND)


class HubDeliveryViewSet(viewsets.ModelViewSet):
    """Hub delivery management"""
    permission_classes = [IsAuthenticated]
    serializer_class = HubDeliverySerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return HubDelivery.objects.all()
        
        # Show deliveries for user's hubs or user's own deliveries
        return HubDelivery.objects.filter(
            Q(hub__partner=user) | Q(job__customer=user)
        ).distinct()
    
    def create(self, request, *args, **kwargs):
        """Create hub delivery"""
        serializer = HubDeliveryCreateSerializer(data=request.data)
        if serializer.is_valid():
            delivery = serializer.save()
            
            # Generate pickup code
            delivery.generate_pickup_code()
            
            # Calculate commission
            job = delivery.job
            if job:
                commission = job.price * (delivery.hub.commission_percentage / 100)
                delivery.hub_commission = commission
                delivery.save()
            
            return Response(
                HubDeliverySerializer(delivery).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_arrived(self, request, pk=None):
        """Mark delivery as arrived at hub"""
        delivery = self.get_object()
        
        if delivery.status != HubDelivery.STATUS_IN_TRANSIT_TO_HUB:
            return Response(
                {'error': 'Delivery not in transit to hub'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        delivery.mark_arrived()
        
        # TODO: Send notification to recipient
        
        return Response({
            'message': 'Delivery marked as arrived',
            'delivery': HubDeliverySerializer(delivery).data
        })
    
    @action(detail=False, methods=['get'])
    def my_deliveries(self, request):
        """Get deliveries for current user (as recipient)"""
        phone = request.query_params.get('phone')
        if not phone:
            return Response(
                {'error': 'Phone number required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deliveries = HubDelivery.objects.filter(
            recipient_phone=phone
        ).exclude(
            status=HubDelivery.STATUS_PICKED_UP
        )
        
        serializer = HubDeliverySerializer(deliveries, many=True)
        return Response(serializer.data)


class HubTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Hub transaction history"""
    permission_classes = [IsAuthenticated]
    serializer_class = HubTransactionSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return HubTransaction.objects.all()
        return HubTransaction.objects.filter(hub__partner=user)


class HubRatingViewSet(viewsets.ModelViewSet):
    """Hub ratings and reviews"""
    permission_classes = [IsAuthenticated]
    serializer_class = HubRatingSerializer
    
    def get_queryset(self):
        hub_id = self.request.query_params.get('hub_id')
        if hub_id:
            return HubRating.objects.filter(hub_id=hub_id)
        return HubRating.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Submit hub rating"""
        serializer = HubRatingSerializer(data=request.data)
        if serializer.is_valid():
            rating = serializer.save(customer=request.user)
            return Response(
                HubRatingSerializer(rating).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HubPayoutViewSet(viewsets.ReadOnlyModelViewSet):
    """Hub payout history"""
    permission_classes = [IsAuthenticated]
    serializer_class = HubPayoutSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return HubPayout.objects.all()
        return HubPayout.objects.filter(hub__partner=user)
