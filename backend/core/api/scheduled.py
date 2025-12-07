"""
API endpoints for scheduled/recurring deliveries.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta

from core.models import ScheduledDelivery, Job, Category
from core.serializers import (
    ScheduledDeliverySerializer, ScheduledDeliveryCreateSerializer
)


class ScheduledDeliveryListView(APIView):
    """List and create scheduled deliveries"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all scheduled deliveries for the customer"""
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        schedules = customer.scheduled_deliveries.all()
        
        if status_filter:
            schedules = schedules.filter(status=status_filter)
        
        serializer = ScheduledDeliverySerializer(schedules, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new scheduled delivery"""
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ScheduledDeliveryCreateSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            schedule = serializer.save()
            
            # Calculate next delivery date
            schedule.next_delivery_date = self.calculate_next_delivery(schedule)
            schedule.save()
            
            return Response(
                ScheduledDeliverySerializer(schedule).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def calculate_next_delivery(self, schedule):
        """Calculate the next delivery date based on frequency"""
        now = timezone.now()
        start = datetime.combine(schedule.start_date, schedule.preferred_time or datetime.min.time())
        start = timezone.make_aware(start) if timezone.is_naive(start) else start
        
        if start > now:
            return start
        
        if schedule.frequency == ScheduledDelivery.FREQUENCY_ONCE:
            return start
        
        # Calculate next occurrence
        delta_days = {
            ScheduledDelivery.FREQUENCY_DAILY: 1,
            ScheduledDelivery.FREQUENCY_WEEKLY: 7,
            ScheduledDelivery.FREQUENCY_BIWEEKLY: 14,
            ScheduledDelivery.FREQUENCY_MONTHLY: 30,
        }
        
        days = delta_days.get(schedule.frequency, 7)
        
        # Find next occurrence after now
        next_date = start
        while next_date <= now:
            next_date += timedelta(days=days)
        
        return next_date


class ScheduledDeliveryDetailView(APIView):
    """Get, update, or delete a scheduled delivery"""
    permission_classes = [IsAuthenticated]

    def get_schedule(self, request, schedule_id):
        return get_object_or_404(
            ScheduledDelivery, 
            id=schedule_id, 
            customer=request.user.customer
        )

    def get(self, request, schedule_id):
        schedule = self.get_schedule(request, schedule_id)
        serializer = ScheduledDeliverySerializer(schedule)
        return Response(serializer.data)

    def put(self, request, schedule_id):
        schedule = self.get_schedule(request, schedule_id)
        serializer = ScheduledDeliverySerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, schedule_id):
        schedule = self.get_schedule(request, schedule_id)
        schedule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScheduledDeliveryPauseView(APIView):
    """Pause a scheduled delivery"""
    permission_classes = [IsAuthenticated]

    def post(self, request, schedule_id):
        schedule = get_object_or_404(
            ScheduledDelivery, 
            id=schedule_id, 
            customer=request.user.customer
        )
        
        if schedule.status != ScheduledDelivery.STATUS_ACTIVE:
            return Response(
                {"error": "Can only pause active schedules"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        schedule.status = ScheduledDelivery.STATUS_PAUSED
        schedule.save()
        
        return Response({
            "message": "Schedule paused",
            "status": schedule.status
        })


class ScheduledDeliveryResumeView(APIView):
    """Resume a paused scheduled delivery"""
    permission_classes = [IsAuthenticated]

    def post(self, request, schedule_id):
        schedule = get_object_or_404(
            ScheduledDelivery, 
            id=schedule_id, 
            customer=request.user.customer
        )
        
        if schedule.status != ScheduledDelivery.STATUS_PAUSED:
            return Response(
                {"error": "Can only resume paused schedules"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        schedule.status = ScheduledDelivery.STATUS_ACTIVE
        # Recalculate next delivery
        schedule.next_delivery_date = ScheduledDeliveryListView().calculate_next_delivery(schedule)
        schedule.save()
        
        return Response({
            "message": "Schedule resumed",
            "status": schedule.status,
            "next_delivery_date": schedule.next_delivery_date
        })


class ScheduledDeliveryCancelView(APIView):
    """Cancel a scheduled delivery"""
    permission_classes = [IsAuthenticated]

    def post(self, request, schedule_id):
        schedule = get_object_or_404(
            ScheduledDelivery, 
            id=schedule_id, 
            customer=request.user.customer
        )
        
        if schedule.status in [ScheduledDelivery.STATUS_COMPLETED, ScheduledDelivery.STATUS_CANCELLED]:
            return Response(
                {"error": "Schedule already ended"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        schedule.status = ScheduledDelivery.STATUS_CANCELLED
        schedule.save()
        
        return Response({
            "message": "Schedule cancelled",
            "status": schedule.status
        })


class ScheduledDeliveryTriggerView(APIView):
    """Manually trigger a scheduled delivery (create job now)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, schedule_id):
        schedule = get_object_or_404(
            ScheduledDelivery, 
            id=schedule_id, 
            customer=request.user.customer
        )
        
        if schedule.status != ScheduledDelivery.STATUS_ACTIVE:
            return Response(
                {"error": "Can only trigger active schedules"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create a job from the schedule
        job = Job.objects.create(
            customer=schedule.customer,
            name=schedule.name,
            description=schedule.description,
            category=schedule.category,
            size=schedule.size,
            weight=schedule.weight,
            vehicle_type=schedule.vehicle_type,
            pickup_address=schedule.pickup_address,
            pick_lat=schedule.pickup_lat,
            pick_up=schedule.pickup_lng,  # Note: field name is pick_up for lng
            pickup_name=schedule.pickup_name,
            pickup_phone=schedule.pickup_phone,
            delivery_address=schedule.delivery_address,
            delivery_lat=schedule.delivery_lat,
            delivery_lng=schedule.delivery_lng,
            delivery_name=schedule.delivery_name,
            delivery_phone=schedule.delivery_phone,
            status=Job.PROCESSING_STATUS
        )
        
        # Update schedule stats
        schedule.last_delivery_date = timezone.now()
        schedule.deliveries_completed += 1
        
        # Check if max deliveries reached
        if schedule.max_deliveries and schedule.deliveries_completed >= schedule.max_deliveries:
            schedule.status = ScheduledDelivery.STATUS_COMPLETED
        else:
            # Calculate next delivery
            schedule.next_delivery_date = ScheduledDeliveryListView().calculate_next_delivery(schedule)
        
        schedule.save()
        
        # Update recipient if linked
        if schedule.recipient:
            schedule.recipient.increment_delivery()
        
        return Response({
            "message": "Job created from schedule",
            "job_id": str(job.id),
            "next_delivery_date": schedule.next_delivery_date
        })


class UpcomingDeliveriesView(APIView):
    """Get upcoming scheduled deliveries"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now() + timedelta(days=days)
        
        schedules = customer.scheduled_deliveries.filter(
            status=ScheduledDelivery.STATUS_ACTIVE,
            next_delivery_date__lte=end_date
        ).order_by('next_delivery_date')
        
        serializer = ScheduledDeliverySerializer(schedules, many=True)
        return Response(serializer.data)
