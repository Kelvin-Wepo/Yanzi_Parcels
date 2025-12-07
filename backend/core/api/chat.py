"""
Chat API endpoints for in-app messaging between customers and couriers.
Includes real-time messaging, quick messages, and masked phone calling.
"""
import random
import hashlib
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Job, Message, QuickMessage, MaskedPhoneSession
from core.serializers import (
    MessageSerializer,
    SendMessageSerializer,
    QuickMessageSerializer,
    ChatInfoSerializer,
)


class ChatMessagesView(APIView):
    """Get chat history and send messages for a job"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        """Get all messages for a job"""
        try:
            job = self._get_job(request, job_id)
            if not job:
                return Response({'error': 'Job not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

            messages = Message.objects.filter(job=job).order_by('created_at')
            
            # Mark messages as read for the current user
            user_type = self._get_user_type(request)
            opposite_type = 'courier' if user_type == 'customer' else 'customer'
            messages.filter(sender_type=opposite_type, is_read=False).update(is_read=True)
            
            serializer = MessageSerializer(messages, many=True)
            
            return Response({
                'messages': serializer.data,
                'job_status': job.status,
                'can_chat': job.status in [Job.PICKING_STATUS, Job.DELIVERING_STATUS],
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, job_id):
        """Send a new message"""
        try:
            job = self._get_job(request, job_id)
            if not job:
                return Response({'error': 'Job not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

            # Only allow chat during active delivery
            if job.status not in [Job.PICKING_STATUS, Job.DELIVERING_STATUS]:
                return Response(
                    {'error': 'Chat is only available during active delivery'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = SendMessageSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            user_type = self._get_user_type(request)
            
            message = Message.objects.create(
                job=job,
                sender_type=user_type,
                sender_user=request.user,
                content=serializer.validated_data['content'],
                is_quick_message=serializer.validated_data.get('is_quick_message', False),
            )

            # Send push notification to the other party
            self._send_notification(job, message, user_type)

            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _get_job(self, request, job_id):
        """Get job if user has access (customer or assigned courier)"""
        try:
            job = Job.objects.get(id=job_id)
            
            # Check if user is the customer
            if hasattr(request.user, 'customer') and job.customer == request.user.customer:
                return job
            
            # Check if user is the assigned courier
            if hasattr(request.user, 'courier') and job.courier == request.user.courier:
                return job
            
            return None
        except Job.DoesNotExist:
            return None

    def _get_user_type(self, request):
        """Determine if user is customer or courier"""
        if hasattr(request.user, 'customer'):
            return Message.SENDER_CUSTOMER
        elif hasattr(request.user, 'courier'):
            return Message.SENDER_COURIER
        return None

    def _send_notification(self, job, message, sender_type):
        """Send push notification to the other party"""
        try:
            from firebase_admin import messaging
            
            # Determine recipient
            if sender_type == Message.SENDER_CUSTOMER:
                # Notify courier
                if job.courier and job.courier.fcm_token:
                    token = job.courier.fcm_token
                    title = f"Message from {job.customer.user.get_full_name()}"
                else:
                    return
            else:
                # Notify customer - we'd need FCM token for customer too
                # For now, skip customer notification
                return

            notification = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=message.content[:100],
                ),
                data={
                    'type': 'chat_message',
                    'job_id': str(job.id),
                    'message_id': str(message.id),
                },
                token=token,
            )
            messaging.send(notification)
        except Exception as e:
            print(f"Failed to send chat notification: {e}")


class QuickMessagesView(APIView):
    """Get pre-defined quick messages"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_type = 'customer' if hasattr(request.user, 'customer') else 'courier'
        
        messages = QuickMessage.objects.filter(
            is_active=True
        ).filter(
            user_type__in=[user_type, QuickMessage.FOR_BOTH]
        ).order_by('order')
        
        serializer = QuickMessageSerializer(messages, many=True)
        return Response(serializer.data)


class UnreadCountView(APIView):
    """Get unread message count for a job"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
            
            # Determine user type and count unread from opposite party
            if hasattr(request.user, 'customer') and job.customer == request.user.customer:
                opposite_type = Message.SENDER_COURIER
            elif hasattr(request.user, 'courier') and job.courier == request.user.courier:
                opposite_type = Message.SENDER_CUSTOMER
            else:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

            unread_count = Message.objects.filter(
                job=job,
                sender_type=opposite_type,
                is_read=False
            ).count()

            return Response({'unread_count': unread_count})
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)


class MaskedPhoneView(APIView):
    """Get or create masked phone number for a job"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        """Get masked phone number to call the other party"""
        try:
            job = Job.objects.get(id=job_id)
            
            # Verify access
            is_customer = hasattr(request.user, 'customer') and job.customer == request.user.customer
            is_courier = hasattr(request.user, 'courier') and job.courier == request.user.courier
            
            if not (is_customer or is_courier):
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

            # Only allow calls during active delivery
            if job.status not in [Job.PICKING_STATUS, Job.DELIVERING_STATUS]:
                return Response(
                    {'error': 'Calling is only available during active delivery'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create masked session
            session, created = MaskedPhoneSession.objects.get_or_create(
                job=job,
                defaults={
                    'customer_real_number': job.customer.phone_number or job.pickup_phone,
                    'courier_real_number': '',  # Courier phone from their profile if available
                    'customer_masked_number': self._generate_masked_number(job.id, 'customer'),
                    'courier_masked_number': self._generate_masked_number(job.id, 'courier'),
                    'expires_at': timezone.now() + timedelta(hours=24),
                }
            )

            # Return the number to call (the OTHER party's masked number)
            if is_customer:
                # Customer wants to call courier - give them courier's masked number
                masked_number = session.courier_masked_number
                other_name = job.courier.user.get_full_name() if job.courier else 'Courier'
            else:
                # Courier wants to call customer - give them customer's masked number
                masked_number = session.customer_masked_number
                other_name = job.customer.user.get_full_name()

            return Response({
                'masked_number': masked_number,
                'other_party_name': other_name,
                'is_active': session.is_active,
                'note': 'This is a privacy-protected number. The call will be connected without revealing personal numbers.',
            })
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    def _generate_masked_number(self, job_id, party_type):
        """
        Generate a masked phone number.
        In production, this would integrate with a service like Twilio or Africa's Talking
        to get actual virtual numbers. For demo, we generate a consistent fake number.
        """
        # Create a deterministic but unique masked number based on job and party
        seed = f"{job_id}-{party_type}"
        hash_val = hashlib.md5(seed.encode()).hexdigest()
        
        # Generate a Kenyan-looking number (07XX XXX XXX)
        digits = ''.join(filter(str.isdigit, hash_val))[:8]
        masked = f"0700{digits[:3]}{digits[3:6]}"
        
        return masked


class ChatInfoView(APIView):
    """Get chat info summary for a job"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
            
            # Verify access and determine user type
            is_customer = hasattr(request.user, 'customer') and job.customer == request.user.customer
            is_courier = hasattr(request.user, 'courier') and job.courier == request.user.courier
            
            if not (is_customer or is_courier):
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

            # Get other party info
            if is_customer:
                opposite_type = Message.SENDER_COURIER
                if job.courier:
                    other_name = job.courier.user.get_full_name()
                    other_avatar = None  # Couriers don't have avatars in current model
                else:
                    other_name = 'Courier (Not assigned)'
                    other_avatar = None
            else:
                opposite_type = Message.SENDER_CUSTOMER
                other_name = job.customer.user.get_full_name()
                other_avatar = job.customer.avatar.url if job.customer.avatar else None

            # Get unread count
            unread_count = Message.objects.filter(
                job=job,
                sender_type=opposite_type,
                is_read=False
            ).count()

            # Get last message
            last_message = Message.objects.filter(job=job).last()

            # Get masked phone if session exists
            masked_phone = None
            try:
                session = MaskedPhoneSession.objects.get(job=job, is_active=True)
                masked_phone = session.courier_masked_number if is_customer else session.customer_masked_number
            except MaskedPhoneSession.DoesNotExist:
                pass

            return Response({
                'job_id': job.id,
                'job_status': job.status,
                'other_party_name': other_name,
                'other_party_avatar': other_avatar,
                'masked_phone': masked_phone,
                'unread_count': unread_count,
                'last_message': MessageSerializer(last_message).data if last_message else None,
                'can_chat': job.status in [Job.PICKING_STATUS, Job.DELIVERING_STATUS],
                'can_call': job.status in [Job.PICKING_STATUS, Job.DELIVERING_STATUS] and job.courier is not None,
            })
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)


class MarkMessagesReadView(APIView):
    """Mark all messages as read"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
            
            # Verify access and determine opposite party
            if hasattr(request.user, 'customer') and job.customer == request.user.customer:
                opposite_type = Message.SENDER_COURIER
            elif hasattr(request.user, 'courier') and job.courier == request.user.courier:
                opposite_type = Message.SENDER_CUSTOMER
            else:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

            # Mark all messages from opposite party as read
            updated = Message.objects.filter(
                job=job,
                sender_type=opposite_type,
                is_read=False
            ).update(is_read=True)

            return Response({'marked_read': updated})
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
