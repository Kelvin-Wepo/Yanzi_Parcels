import requests
import stripe
from django.conf import settings
from django.utils import timezone

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from firebase_admin import auth as firebase_auth

from core.models import Customer, Job, Transaction, Category, Courier
from core.serializers import (
    CustomerProfileSerializer,
    JobListSerializer,
    JobDetailSerializer,
    JobCreateStep1Serializer,
    JobCreateStep2Serializer,
    JobCreateStep3Serializer,
    CategorySerializer,
)

stripe.api_key = settings.STRIPE_API_SECRET_KEY


class IsCustomer(permissions.BasePermission):
    """Check if user is a customer"""
    def has_permission(self, request, view):
        return hasattr(request.user, 'customer')


class CustomerProfileView(APIView):
    """Get and update customer profile"""
    permission_classes = [permissions.IsAuthenticated, IsCustomer]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        serializer = CustomerProfileSerializer(request.user.customer)
        return Response(serializer.data)

    def put(self, request):
        serializer = CustomerProfileSerializer(
            request.user.customer, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerPhoneUpdateView(APIView):
    """Update phone number via Firebase"""
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def post(self, request):
        id_token = request.data.get('id_token')
        try:
            firebase_user = firebase_auth.verify_id_token(id_token)
            request.user.customer.phone_number = firebase_user['phone_number']
            request.user.customer.save()
            return Response({'phone_number': firebase_user['phone_number']})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CategoryListView(APIView):
    """List all categories - public endpoint"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class CustomerJobListView(APIView):
    """List customer's jobs"""
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def get(self, request):
        status_filter = request.query_params.get('status', 'current')
        customer = request.user.customer

        if status_filter == 'current':
            jobs = Job.objects.filter(
                customer=customer,
                status__in=[Job.PROCESSING_STATUS, Job.PICKING_STATUS, Job.DELIVERING_STATUS]
            ).order_by('-created_at')
        elif status_filter == 'archived':
            jobs = Job.objects.filter(
                customer=customer,
                status__in=[Job.COMPLETED_STATUS, Job.CANCELLED_STATUS]
            ).order_by('-created_at')
        else:
            jobs = Job.objects.filter(customer=customer).order_by('-created_at')

        serializer = JobListSerializer(jobs, many=True)
        return Response(serializer.data)


class CustomerJobDetailView(APIView):
    """Get job details"""
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id, customer=request.user.customer)
            serializer = JobDetailSerializer(job)
            return Response(serializer.data)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)


class CustomerJobCancelView(APIView):
    """Cancel a job"""
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def post(self, request, job_id):
        try:
            job = Job.objects.get(
                id=job_id, 
                customer=request.user.customer,
                status=Job.PROCESSING_STATUS
            )
            job.status = Job.CANCELLED_STATUS
            job.save()
            return Response({'message': 'Job cancelled successfully'})
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found or cannot be cancelled'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class CourierLocationView(APIView):
    """Get courier's current location for a job"""
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id, customer=request.user.customer)
            
            # Return job locations and courier location if assigned
            data = {
                'job_status': job.status,
                'pickup': {
                    'lat': job.pick_lat,
                    'lng': job.pick_up,
                    'address': job.pickup_address,
                },
                'delivery': {
                    'lat': job.delivery_lat,
                    'lng': job.delivery_lng,
                    'address': job.delivery_address,
                },
                'courier': None
            }
            
            if job.courier:
                data['courier'] = {
                    'lat': job.courier.lat,
                    'lng': job.courier.lng,
                    'name': job.courier.user.get_full_name(),
                }
            
            return Response(data)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)


class JobCreateView(APIView):
    """Multi-step job creation"""
    permission_classes = [permissions.IsAuthenticated, IsCustomer]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        """Get current creating job if exists"""
        customer = request.user.customer
        creating_job = Job.objects.filter(
            customer=customer, 
            status=Job.CREATING_STATUS
        ).last()
        
        if creating_job:
            serializer = JobDetailSerializer(creating_job)
            
            # Determine current step
            if creating_job.delivery_name:
                current_step = 4
            elif creating_job.pickup_name:
                current_step = 3
            elif creating_job.name:
                current_step = 2
            else:
                current_step = 1
            
            return Response({
                'job': serializer.data,
                'current_step': current_step
            })
        
        return Response({'job': None, 'current_step': 1})

    def post(self, request):
        """Handle step submissions"""
        customer = request.user.customer
        step = request.data.get('step', 1)
        
        # Check if has current job in progress
        has_current_job = Job.objects.filter(
            customer=customer,
            status__in=[Job.PROCESSING_STATUS, Job.PICKING_STATUS, Job.DELIVERING_STATUS]
        ).exists()
        
        if has_current_job:
            return Response(
                {'error': 'You currently have a processing job'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        creating_job = Job.objects.filter(
            customer=customer, 
            status=Job.CREATING_STATUS
        ).last()

        if step == '1' or step == 1:
            serializer = JobCreateStep1Serializer(data=request.data, instance=creating_job)
            if serializer.is_valid():
                job = serializer.save(customer=customer, status=Job.CREATING_STATUS)
                return Response({
                    'job': JobDetailSerializer(job).data,
                    'current_step': 2
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif step == '2' or step == 2:
            if not creating_job:
                return Response({'error': 'No job in creation'}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = JobCreateStep2Serializer(data=request.data, instance=creating_job)
            if serializer.is_valid():
                job = serializer.save()
                return Response({
                    'job': JobDetailSerializer(job).data,
                    'current_step': 3
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif step == '3' or step == 3:
            if not creating_job:
                return Response({'error': 'No job in creation'}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = JobCreateStep3Serializer(data=request.data, instance=creating_job)
            if serializer.is_valid():
                job = serializer.save()
                
                # Calculate distance
                # Try Google Maps API first, fallback to mock data for development
                try:
                    r = requests.get(
                        f"https://maps.googleapis.com/maps/api/distancematrix/json",
                        params={
                            'origins': job.pickup_address,
                            'destinations': job.delivery_address,
                            'mode': 'transit',
                            'key': settings.GOOGLE_MAP_API_KEY
                        }
                    )
                    data = r.json()
                    
                    if data.get('rows') and data['rows'][0]['elements'][0].get('status') == 'OK':
                        distance = data['rows'][0]['elements'][0]['distance']['value']
                        duration = data['rows'][0]['elements'][0]['duration']['value']
                        job.distance = round(distance / 1000, 2)
                        job.duration = int(duration / 60)
                        job.save()
                    else:
                        # Fallback: Use mock distance for development
                        import random
                        job.distance = round(random.uniform(2, 15), 2)  # Random 2-15 km
                        job.duration = int(job.distance * 4)  # ~4 mins per km
                        job.save()
                except Exception as e:
                    # Fallback: Use mock distance for development
                    import random
                    job.distance = round(random.uniform(2, 15), 2)  # Random 2-15 km
                    job.duration = int(job.distance * 4)  # ~4 mins per km
                    job.save()

                # Get vehicle pricing options
                from core.utils.pricing import get_vehicle_options
                from django.utils import timezone
                
                now = timezone.localtime()
                hour = now.hour
                is_peak_hour = (7 <= hour <= 9) or (17 <= hour <= 20)
                
                vehicle_options = get_vehicle_options(
                    distance_km=job.distance,
                    size=job.size,
                    weight=job.weight,
                    quantity=job.quantity,
                    is_peak_hour=is_peak_hour,
                )
                
                # Add icons and descriptions
                from core.utils.pricing import get_vehicle_info
                for option in vehicle_options:
                    info = get_vehicle_info(option['vehicle_type'])
                    option['icon'] = info['icon']
                    option['description'] = info['description']
                    option['features'] = info['features']

                return Response({
                    'job': JobDetailSerializer(job).data,
                    'current_step': 4,
                    'vehicle_options': vehicle_options,
                    'is_peak_hour': is_peak_hour,
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif step == '4' or step == 4:
            if not creating_job:
                return Response({'error': 'No job in creation'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not (creating_job.pickup_name and creating_job.delivery_name and creating_job.distance):
                return Response(
                    {'error': 'Please complete all previous steps'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get selected vehicle type
            vehicle_type = request.data.get('vehicle_type')
            if vehicle_type:
                from core.models import VehicleType
                if vehicle_type not in dict(VehicleType.choices):
                    return Response(
                        {'error': 'Invalid vehicle type'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                creating_job.vehicle_type = vehicle_type
            
            # Calculate final price based on vehicle type
            from core.utils.pricing import calculate_price
            from django.utils import timezone
            
            now = timezone.localtime()
            hour = now.hour
            is_peak_hour = (7 <= hour <= 9) or (17 <= hour <= 20)
            
            pricing = calculate_price(
                vehicle_type=creating_job.vehicle_type,
                distance_km=creating_job.distance,
                size=creating_job.size,
                weight=creating_job.weight,
                quantity=creating_job.quantity,
                is_peak_hour=is_peak_hour,
            )
            creating_job.price = pricing['final_price']
            creating_job.save()

            # PAYMENT BYPASSED FOR DEVELOPMENT
            # TODO: Re-enable Stripe payment processing for production
            try:
                # Skip payment processing - just mark job as processing
                creating_job.status = Job.PROCESSING_STATUS
                creating_job.save()

                # Create a placeholder transaction record
                Transaction.objects.create(
                    stripe_payment_intent_id=f'dev_bypass_{creating_job.id}',
                    job=creating_job,
                    amount=creating_job.price
                )

                # Send push notifications to couriers with matching vehicle type
                try:
                    from firebase_admin import messaging
                    
                    # Get couriers with verified vehicles of the matching type
                    from core.models import Vehicle
                    couriers = Courier.objects.filter(
                        vehicles__vehicle_type=creating_job.vehicle_type,
                        vehicles__verification_status=Vehicle.VERIFICATION_APPROVED,
                    ).distinct()
                    
                    # If no couriers with matching vehicle, notify all couriers
                    if not couriers.exists():
                        couriers = Courier.objects.all()
                    
                    registration_tokens = [c.fcm_token for c in couriers if c.fcm_token]

                    if registration_tokens:
                        # Prepare job data for notification
                        job_data = {
                            'type': 'new_job',
                            'job_id': str(creating_job.id),
                            'name': creating_job.name,
                            'description': creating_job.description or '',
                            'pickup_address': creating_job.pickup_address,
                            'delivery_address': creating_job.delivery_address,
                            'distance': str(creating_job.distance),
                            'duration': str(creating_job.duration),
                            'price': str(creating_job.price),
                            'size': creating_job.size,
                            'weight': creating_job.weight,
                            'vehicle_type': creating_job.vehicle_type,
                            'quantity': str(creating_job.quantity),
                        }
                        
                        message = messaging.MulticastMessage(
                            notification=messaging.Notification(
                                title='🚚 New Delivery Job Available!',
                                body=f'{creating_job.name} - KSh {int(creating_job.price * 0.8):,} ({creating_job.distance} km)',
                            ),
                            data=job_data,
                            tokens=registration_tokens,
                            android=messaging.AndroidConfig(
                                priority='high',
                                notification=messaging.AndroidNotification(
                                    icon='delivery_icon',
                                    color='#F59E0B',
                                    sound='default',
                                    click_action='OPEN_JOB'
                                )
                            ),
                            webpush=messaging.WebpushConfig(
                                notification=messaging.WebpushNotification(
                                    icon='/img/logo.png',
                                    badge='/img/badge.png',
                                    vibrate=[200, 100, 200],
                                    require_interaction=True,
                                    actions=[
                                        messaging.WebpushNotificationAction(
                                            action='accept',
                                            title='Accept Job'
                                        ),
                                        messaging.WebpushNotificationAction(
                                            action='view',
                                            title='View Details'
                                        )
                                    ]
                                ),
                                fcm_options=messaging.WebpushFCMOptions(
                                    link=f'/courier/available-jobs/{creating_job.id}'
                                )
                            )
                        )
                        response = messaging.send_multicast(message)
                        print(f"Push notification sent: {response.success_count} successful, {response.failure_count} failed")
                except Exception as e:
                    print(f"Push notification error: {e}")

                return Response({
                    'job': JobDetailSerializer(creating_job).data,
                    'message': 'Job created successfully (payment bypassed for dev)'
                })

            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Invalid step'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """Cancel/delete creating job"""
        customer = request.user.customer
        creating_job = Job.objects.filter(
            customer=customer, 
            status=Job.CREATING_STATUS
        ).last()
        
        if creating_job:
            creating_job.delete()
            return Response({'message': 'Draft deleted'})
        
        return Response({'message': 'No draft to delete'})


class PaymentMethodView(APIView):
    """Manage Stripe payment methods"""
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def get(self, request):
        """Get current payment method info"""
        customer = request.user.customer
        
        if not customer.stripe_customer_id:
            # Create Stripe customer
            stripe_customer = stripe.Customer.create(
                email=request.user.email,
                name=request.user.get_full_name()
            )
            customer.stripe_customer_id = stripe_customer['id']
            customer.save()

        # Check for existing payment methods
        payment_methods = stripe.PaymentMethod.list(
            customer=customer.stripe_customer_id,
            type="card",
        )

        if payment_methods and len(payment_methods.data) > 0:
            pm = payment_methods.data[0]
            customer.stripe_payment_method_id = pm.id
            customer.stripe_card_last4 = pm.card.last4
            customer.save()
            
            return Response({
                'has_payment_method': True,
                'card_last4': pm.card.last4,
                'card_brand': pm.card.brand
            })
        else:
            customer.stripe_payment_method_id = ""
            customer.stripe_card_last4 = ""
            customer.save()
            
            # Create setup intent for adding new card
            intent = stripe.SetupIntent.create(
                customer=customer.stripe_customer_id
            )
            
            return Response({
                'has_payment_method': False,
                'client_secret': intent.client_secret
            })

    def delete(self, request):
        """Remove payment method"""
        customer = request.user.customer
        
        if customer.stripe_payment_method_id:
            stripe.PaymentMethod.detach(customer.stripe_payment_method_id)
            customer.stripe_payment_method_id = ""
            customer.stripe_card_last4 = ""
            customer.save()
        
        return Response({'message': 'Payment method removed'})
