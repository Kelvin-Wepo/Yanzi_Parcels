"""
Vehicle API endpoints for multi-vehicle support
Includes vehicle registration, verification, and vehicle type selection
"""
from datetime import datetime
from django.utils import timezone

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from core.models import Vehicle, Courier, Job, VehicleType
from core.serializers import (
    VehicleSerializer,
    VehicleRegistrationSerializer,
    VehicleTypeInfoSerializer,
    CourierVerificationSerializer,
)
from core.utils.pricing import (
    get_vehicle_options,
    get_vehicle_info,
    calculate_price,
    calculate_estimated_time,
)


class VehicleTypesView(APIView):
    """Get all available vehicle types with info"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """List all vehicle types with descriptions"""
        vehicle_types = []
        for vtype, vname in VehicleType.choices:
            info = get_vehicle_info(vtype)
            vehicle_types.append({
                'type': vtype,
                'name': vname,
                'icon': info['icon'],
                'description': info['description'],
                'features': info['features'],
                'max_weight': info['max_weight'],
                'best_for': info['best_for'],
            })
        
        return Response(vehicle_types)


class VehiclePricingView(APIView):
    """Calculate pricing for different vehicle types"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Get pricing options for all vehicle types.
        
        Request body:
        {
            "distance_km": 5.2,
            "size": "medium",
            "weight": "light",
            "quantity": 1
        }
        """
        distance_km = float(request.data.get('distance_km', 0))
        size = request.data.get('size', Job.MEDIUM_SIZE)
        weight = request.data.get('weight', Job.WEIGHT_LIGHT)
        quantity = int(request.data.get('quantity', 1))
        
        if distance_km <= 0:
            return Response(
                {'error': 'Invalid distance'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if it's peak hour (7-9 AM or 5-8 PM Nairobi time)
        now = timezone.localtime()
        hour = now.hour
        is_peak_hour = (7 <= hour <= 9) or (17 <= hour <= 20)
        
        # Get all vehicle options with pricing
        options = get_vehicle_options(
            distance_km=distance_km,
            size=size,
            weight=weight,
            quantity=quantity,
            is_peak_hour=is_peak_hour,
        )
        
        # Add extra display info
        for option in options:
            info = get_vehicle_info(option['vehicle_type'])
            option['icon'] = info['icon']
            option['description'] = info['description']
            option['features'] = info['features']
            option['best_for'] = info['best_for']
        
        return Response({
            'options': options,
            'is_peak_hour': is_peak_hour,
            'distance_km': round(distance_km, 1),
        })


class CourierVehiclesView(APIView):
    """Manage courier's vehicles"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        """Get all vehicles for the authenticated courier"""
        try:
            courier = request.user.courier
        except Courier.DoesNotExist:
            return Response(
                {'error': 'Courier profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        vehicles = courier.vehicles.all()
        serializer = VehicleSerializer(vehicles, many=True)
        
        return Response({
            'vehicles': serializer.data,
            'active_vehicle_id': str(courier.active_vehicle.id) if courier.active_vehicle else None,
        })

    def post(self, request):
        """Register a new vehicle for the courier"""
        try:
            courier = request.user.courier
        except Courier.DoesNotExist:
            return Response(
                {'error': 'Courier profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = VehicleRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            vehicle = serializer.save()
            courier.vehicles.add(vehicle)
            
            # If this is the courier's first vehicle, set it as active
            if courier.active_vehicle is None:
                courier.active_vehicle = vehicle
                courier.save()
            
            return Response(
                VehicleSerializer(vehicle).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourierVehicleDetailView(APIView):
    """Manage a specific courier vehicle"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, vehicle_id):
        """Get details of a specific vehicle"""
        try:
            courier = request.user.courier
            vehicle = courier.vehicles.get(id=vehicle_id)
        except (Courier.DoesNotExist, Vehicle.DoesNotExist):
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = VehicleSerializer(vehicle)
        return Response(serializer.data)

    def put(self, request, vehicle_id):
        """Update vehicle details"""
        try:
            courier = request.user.courier
            vehicle = courier.vehicles.get(id=vehicle_id)
        except (Courier.DoesNotExist, Vehicle.DoesNotExist):
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Only allow updates if not verified (or re-verification needed)
        if vehicle.verification_status == Vehicle.VERIFICATION_APPROVED:
            # Reset to pending if key details are changed
            vehicle.verification_status = Vehicle.VERIFICATION_PENDING
        
        serializer = VehicleRegistrationSerializer(vehicle, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(VehicleSerializer(vehicle).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, vehicle_id):
        """Remove a vehicle from courier's fleet"""
        try:
            courier = request.user.courier
            vehicle = courier.vehicles.get(id=vehicle_id)
        except (Courier.DoesNotExist, Vehicle.DoesNotExist):
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if vehicle has active jobs
        active_jobs = Job.objects.filter(
            vehicle=vehicle,
            status__in=[Job.PICKING_STATUS, Job.DELIVERING_STATUS]
        ).exists()
        
        if active_jobs:
            return Response(
                {'error': 'Cannot remove vehicle with active deliveries'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove from courier's fleet
        courier.vehicles.remove(vehicle)
        
        # If this was the active vehicle, clear it
        if courier.active_vehicle == vehicle:
            # Set another verified vehicle as active, or None
            next_vehicle = courier.vehicles.filter(
                verification_status=Vehicle.VERIFICATION_APPROVED
            ).first()
            courier.active_vehicle = next_vehicle
            courier.save()
        
        # Soft delete the vehicle
        vehicle.is_active = False
        vehicle.save()
        
        return Response({'message': 'Vehicle removed'})


class SetActiveVehicleView(APIView):
    """Set the active vehicle for a courier"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, vehicle_id):
        """Set a vehicle as the active delivery vehicle"""
        try:
            courier = request.user.courier
            vehicle = courier.vehicles.get(id=vehicle_id)
        except (Courier.DoesNotExist, Vehicle.DoesNotExist):
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Only allow setting verified vehicles as active
        if vehicle.verification_status != Vehicle.VERIFICATION_APPROVED:
            return Response(
                {'error': 'Only verified vehicles can be set as active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        courier.active_vehicle = vehicle
        courier.save()
        
        return Response({
            'message': 'Active vehicle updated',
            'active_vehicle': VehicleSerializer(vehicle).data
        })


class CourierVerificationView(APIView):
    """Submit courier verification documents"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        """Get current verification status"""
        try:
            courier = request.user.courier
        except Courier.DoesNotExist:
            return Response(
                {'error': 'Courier profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'is_verified': courier.is_verified,
            'has_national_id': bool(courier.national_id),
            'has_national_id_photo': bool(courier.national_id_photo),
            'has_driving_license': bool(courier.driving_license),
            'has_driving_license_photo': bool(courier.driving_license_photo),
            'has_profile_photo': bool(courier.profile_photo),
            'vehicle_count': courier.vehicles.count(),
            'verified_vehicles': courier.vehicles.filter(
                verification_status=Vehicle.VERIFICATION_APPROVED
            ).count(),
        })

    def post(self, request):
        """Submit verification documents"""
        try:
            courier = request.user.courier
        except Courier.DoesNotExist:
            return Response(
                {'error': 'Courier profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CourierVerificationSerializer(courier, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Check if all documents are provided
            has_all_docs = all([
                courier.national_id,
                courier.national_id_photo,
                courier.driving_license,
                courier.driving_license_photo,
                courier.profile_photo,
            ])
            
            return Response({
                'message': 'Documents submitted successfully',
                'has_all_documents': has_all_docs,
                'verification_pending': has_all_docs,
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AvailableCouriersView(APIView):
    """Get available couriers for a specific vehicle type"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, vehicle_type):
        """Get count of available couriers with a specific vehicle type"""
        couriers = Courier.objects.filter(
            is_verified=True,
            active_vehicle__vehicle_type=vehicle_type,
            active_vehicle__verification_status=Vehicle.VERIFICATION_APPROVED,
        )
        
        return Response({
            'vehicle_type': vehicle_type,
            'available_count': couriers.count(),
            'sample_eta': '10-15 mins',  # TODO: Calculate based on proximity
        })
