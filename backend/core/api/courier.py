from django.conf import settings
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from core.models import Courier, Job
from core.serializers import (
    CourierProfileSerializer,
    JobListSerializer,
    JobDetailSerializer,
)


class IsCourier(permissions.BasePermission):
    """Check if user is a courier"""
    def has_permission(self, request, view):
        return hasattr(request.user, 'courier')


class CourierProfileView(APIView):
    """Get and update courier profile"""
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def get(self, request):
        serializer = CourierProfileSerializer(request.user.courier)
        return Response(serializer.data)

    def put(self, request):
        serializer = CourierProfileSerializer(
            request.user.courier, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourierPayoutMethodView(APIView):
    """Update payout method (PayPal email)"""
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def get(self, request):
        return Response({
            'paypal_email': request.user.courier.paypal_email
        })

    def put(self, request):
        paypal_email = request.data.get('paypal_email', '')
        request.user.courier.paypal_email = paypal_email
        request.user.courier.save()
        return Response({
            'message': 'Payout method updated',
            'paypal_email': paypal_email
        })


class AvailableJobsView(APIView):
    """List available jobs for couriers"""
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def get(self, request):
        jobs = Job.objects.filter(status=Job.PROCESSING_STATUS).order_by('-created_at')
        serializer = JobListSerializer(jobs, many=True)
        return Response(serializer.data)


class AvailableJobDetailView(APIView):
    """Get details of an available job"""
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id, status=Job.PROCESSING_STATUS)
            serializer = JobDetailSerializer(job)
            return Response(serializer.data)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, job_id):
        """Accept a job"""
        try:
            job = Job.objects.get(id=job_id, status=Job.PROCESSING_STATUS)
            
            # Check if courier already has a current job
            has_current = Job.objects.filter(
                courier=request.user.courier,
                status__in=[Job.PICKING_STATUS, Job.DELIVERING_STATUS]
            ).exists()
            
            if has_current:
                return Response(
                    {'error': 'You already have an active job'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            job.courier = request.user.courier
            job.status = Job.PICKING_STATUS
            job.save()

            # Notify via WebSocket
            try:
                layer = get_channel_layer()
                async_to_sync(layer.group_send)(
                    f"job_{job.id}",
                    {
                        'type': 'job_update',
                        'job': {
                            'status': job.get_status_display(),
                            'courier_id': request.user.courier.id,
                            'courier_name': request.user.get_full_name()
                        }
                    }
                )
            except Exception as e:
                print(f"WebSocket error: {e}")

            return Response({
                'message': 'Job accepted',
                'job': JobDetailSerializer(job).data
            })
        except Job.DoesNotExist:
            return Response({'error': 'Job not found or already taken'}, status=status.HTTP_404_NOT_FOUND)


class CurrentJobView(APIView):
    """Get courier's current active job"""
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def get(self, request):
        job = Job.objects.filter(
            courier=request.user.courier,
            status__in=[Job.PICKING_STATUS, Job.DELIVERING_STATUS]
        ).last()
        
        if job:
            serializer = JobDetailSerializer(job)
            return Response(serializer.data)
        
        return Response({'job': None})


class CurrentJobUpdateView(APIView):
    """Update current job status (pickup/delivery photos)"""
    permission_classes = [permissions.IsAuthenticated, IsCourier]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, job_id):
        try:
            job = Job.objects.get(
                id=job_id,
                courier=request.user.courier,
                status__in=[Job.PICKING_STATUS, Job.DELIVERING_STATUS]
            )
            
            if job.status == Job.PICKING_STATUS:
                # Upload pickup photo and change status
                if 'pickup_photo' not in request.FILES:
                    return Response(
                        {'error': 'Pickup photo required'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                job.pickup_photo = request.FILES['pickup_photo']
                job.pickedup_at = timezone.now()
                job.status = Job.DELIVERING_STATUS
                job.save()

                # Notify via WebSocket
                try:
                    layer = get_channel_layer()
                    async_to_sync(layer.group_send)(
                        f"job_{job.id}",
                        {
                            'type': 'job_update',
                            'job': {
                                'status': job.get_status_display(),
                                'pickup_photo': job.pickup_photo.url,
                                'pickedup_at': str(job.pickedup_at)
                            }
                        }
                    )
                except Exception as e:
                    print(f"WebSocket error: {e}")

                return Response({
                    'message': 'Pickup confirmed',
                    'job': JobDetailSerializer(job).data
                })

            elif job.status == Job.DELIVERING_STATUS:
                # Upload delivery photo and complete job
                if 'delivery_photo' not in request.FILES:
                    return Response(
                        {'error': 'Delivery photo required'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                job.delivery_photo = request.FILES['delivery_photo']
                job.delivered_at = timezone.now()
                job.status = Job.COMPLETED_STATUS
                job.save()

                # Notify via WebSocket
                try:
                    layer = get_channel_layer()
                    async_to_sync(layer.group_send)(
                        f"job_{job.id}",
                        {
                            'type': 'job_update',
                            'job': {
                                'status': job.get_status_display(),
                                'delivery_photo': job.delivery_photo.url,
                                'delivered_at': str(job.delivered_at)
                            }
                        }
                    )
                except Exception as e:
                    print(f"WebSocket error: {e}")

                return Response({
                    'message': 'Delivery completed',
                    'job': JobDetailSerializer(job).data
                })

        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)


class CourierLocationUpdateView(APIView):
    """Update courier's live location"""
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def post(self, request):
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        
        if lat and lng:
            courier = request.user.courier
            courier.lat = lat
            courier.lng = lng
            courier.save()

            # Get current job and notify
            current_job = Job.objects.filter(
                courier=courier,
                status__in=[Job.PICKING_STATUS, Job.DELIVERING_STATUS]
            ).last()
            
            if current_job:
                try:
                    layer = get_channel_layer()
                    async_to_sync(layer.group_send)(
                        f"job_{current_job.id}",
                        {
                            'type': 'job_update',
                            'job': {
                                'courier_lat': lat,
                                'courier_lng': lng
                            }
                        }
                    )
                except Exception as e:
                    print(f"WebSocket error: {e}")

            return Response({'message': 'Location updated'})
        
        return Response(
            {'error': 'lat and lng required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class CourierArchivedJobsView(APIView):
    """List courier's completed jobs"""
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def get(self, request):
        jobs = Job.objects.filter(
            courier=request.user.courier,
            status=Job.COMPLETED_STATUS
        ).order_by('-created_at')
        
        serializer = JobListSerializer(jobs, many=True)
        return Response(serializer.data)


class FCMTokenUpdateView(APIView):
    """Update courier's FCM token for push notifications"""
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def post(self, request):
        fcm_token = request.data.get('fcm_token', '')
        request.user.courier.fcm_token = fcm_token
        request.user.courier.save()
        return Response({'message': 'FCM token updated'})
