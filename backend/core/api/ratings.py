"""
API endpoints for ratings, reviews, and referral program.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Count

from core.models import (
    Rating, ReferralCode, Referral, Wallet, WalletTransaction,
    Job, Courier, Customer
)
from core.serializers import (
    RatingSerializer, RatingCreateSerializer, CourierRatingResponseSerializer,
    ReferralCodeSerializer, ReferralSerializer, ApplyReferralCodeSerializer,
    WalletSerializer, WalletTransactionSerializer
)


# =============================================================================
# Rating & Review Views
# =============================================================================

class RatingCreateView(APIView):
    """Create a rating for a completed delivery"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = RatingCreateSerializer(data=request.data)
        if serializer.is_valid():
            rating = serializer.save()
            return Response(
                RatingSerializer(rating).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RatingDetailView(APIView):
    """Get rating details"""
    permission_classes = [IsAuthenticated]

    def get(self, request, rating_id):
        rating = get_object_or_404(Rating, id=rating_id)
        serializer = RatingSerializer(rating)
        return Response(serializer.data)


class JobRatingView(APIView):
    """Get or create rating for a specific job"""
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        """Check if job has been rated"""
        job = get_object_or_404(Job, id=job_id)
        
        try:
            rating = Rating.objects.get(job=job)
            return Response(RatingSerializer(rating).data)
        except Rating.DoesNotExist:
            return Response(
                {"rated": False, "message": "Job not yet rated"},
                status=status.HTTP_200_OK
            )

    def post(self, request, job_id):
        """Create a rating for a specific job"""
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        job = get_object_or_404(Job, id=job_id, customer=customer)
        
        # Check if already rated
        if Rating.objects.filter(job=job).exists():
            return Response(
                {"error": "This job has already been rated"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check job is completed
        if job.status != 'completed':
            return Response(
                {"error": "Can only rate completed deliveries"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create rating
        data = request.data.copy()
        data['job'] = str(job.id)
        data['courier'] = job.courier.id if job.courier else None
        
        if not data.get('courier'):
            return Response(
                {"error": "No courier assigned to this job"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = RatingCreateSerializer(data=data)
        if serializer.is_valid():
            rating = serializer.save()
            return Response(
                RatingSerializer(rating).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourierRatingsView(APIView):
    """Get ratings for a specific courier"""
    permission_classes = [AllowAny]

    def get(self, request, courier_id):
        courier = get_object_or_404(Courier, id=courier_id)
        ratings = courier.ratings_received.filter(is_public=True).order_by('-created_at')
        
        # Get statistics
        stats = ratings.aggregate(
            avg_overall=Avg('overall_rating'),
            avg_speed=Avg('speed_rating'),
            avg_communication=Avg('communication_rating'),
            avg_care=Avg('care_rating'),
            total_count=Count('id')
        )
        
        # Get rating distribution
        distribution = {}
        for i in range(1, 6):
            distribution[str(i)] = ratings.filter(overall_rating=i).count()
        
        return Response({
            'courier_id': courier_id,
            'courier_name': courier.user.get_full_name(),
            'overall_rating': round(stats['avg_overall'] or 0, 1),
            'total_ratings': stats['total_count'],
            'statistics': {
                'overall': round(stats['avg_overall'] or 0, 1),
                'speed': round(stats['avg_speed'] or 0, 1),
                'communication': round(stats['avg_communication'] or 0, 1),
                'care': round(stats['avg_care'] or 0, 1),
            },
            'distribution': distribution,
            'recent_reviews': RatingSerializer(ratings[:10], many=True).data
        })


class CourierRespondToRatingView(APIView):
    """Allow courier to respond to a rating"""
    permission_classes = [IsAuthenticated]

    def post(self, request, rating_id):
        try:
            courier = request.user.courier
        except:
            return Response(
                {"error": "Courier profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        rating = get_object_or_404(Rating, id=rating_id, courier=courier)
        
        if rating.courier_response:
            return Response(
                {"error": "Already responded to this rating"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CourierRatingResponseSerializer(data=request.data)
        if serializer.is_valid():
            rating.courier_response = serializer.validated_data['response']
            rating.response_date = timezone.now()
            rating.save()
            return Response(RatingSerializer(rating).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyRatingsView(APIView):
    """Get ratings given by current user (customer) or received (courier)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_type = request.query_params.get('type', 'given')
        
        if user_type == 'given':
            try:
                customer = request.user.customer
                ratings = Rating.objects.filter(customer=customer).order_by('-created_at')
            except:
                return Response(
                    {"error": "Customer profile not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:  # received
            try:
                courier = request.user.courier
                ratings = Rating.objects.filter(courier=courier).order_by('-created_at')
            except:
                return Response(
                    {"error": "Courier profile not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        serializer = RatingSerializer(ratings, many=True)
        return Response(serializer.data)


# =============================================================================
# Referral Program Views
# =============================================================================

class MyReferralCodeView(APIView):
    """Get or create referral code for current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        referral_code, created = ReferralCode.objects.get_or_create(
            user=request.user,
            defaults={
                'code': ReferralCode.generate_code(request.user),
                'referrer_reward': 100,
                'referee_reward': 100
            }
        )
        
        serializer = ReferralCodeSerializer(referral_code)
        return Response(serializer.data)


class MyReferralsView(APIView):
    """Get all referrals made by current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            referral_code = request.user.referral_code
            referrals = referral_code.referrals.all().order_by('-created_at')
            
            return Response({
                'referral_code': referral_code.code,
                'total_referrals': referral_code.total_referrals,
                'successful_referrals': referral_code.successful_referrals,
                'total_earned': referral_code.total_earned,
                'referrals': ReferralSerializer(referrals, many=True).data
            })
        except ReferralCode.DoesNotExist:
            return Response({
                'referral_code': None,
                'total_referrals': 0,
                'successful_referrals': 0,
                'total_earned': 0,
                'referrals': []
            })


class ApplyReferralCodeView(APIView):
    """Apply a referral code during registration"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check if user already used a referral code
        if Referral.objects.filter(referred_user=request.user).exists():
            return Response(
                {"error": "You have already used a referral code"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ApplyReferralCodeSerializer(data=request.data)
        if serializer.is_valid():
            code = serializer.validated_data['code']
            referral_code = ReferralCode.objects.get(code=code)
            
            # Can't use own code
            if referral_code.user == request.user:
                return Response(
                    {"error": "Cannot use your own referral code"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create referral record
            referral = Referral.objects.create(
                referral_code=referral_code,
                referred_user=request.user,
                referred_email=request.user.email,
                referrer_reward_amount=referral_code.referrer_reward,
                referee_reward_amount=referral_code.referee_reward,
                status=Referral.STATUS_SIGNED_UP
            )
            
            # Update referral code stats
            referral_code.total_referrals += 1
            referral_code.save()
            
            # Credit the new user's wallet with signup bonus
            wallet, _ = Wallet.objects.get_or_create(user=request.user)
            wallet.credit(referral_code.referee_reward, f"Referral signup bonus from {referral_code.code}")
            referral.referee_rewarded = True
            referral.save()
            
            return Response({
                "message": f"Referral code applied! KSh {referral_code.referee_reward} added to your wallet",
                "wallet_balance": wallet.balance
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ValidateReferralCodeView(APIView):
    """Validate a referral code without applying it"""
    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            referral_code = ReferralCode.objects.get(code=code.upper(), is_active=True)
            return Response({
                "valid": True,
                "referrer_name": referral_code.user.first_name,
                "referee_reward": referral_code.referee_reward
            })
        except ReferralCode.DoesNotExist:
            return Response({
                "valid": False,
                "message": "Invalid referral code"
            })


class ShareReferralView(APIView):
    """Get shareable referral message"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        referral_code, _ = ReferralCode.objects.get_or_create(
            user=request.user,
            defaults={
                'code': ReferralCode.generate_code(request.user),
                'referrer_reward': 100,
                'referee_reward': 100
            }
        )
        
        share_message = (
            f"🚀 Use Yanzi Parcels for fast deliveries in Kenya!\n\n"
            f"Use my code {referral_code.code} and get KSh {referral_code.referee_reward} off your first delivery!\n\n"
            f"Download now: https://yanziparcels.com/download"
        )
        
        whatsapp_url = f"https://wa.me/?text={share_message.replace(' ', '%20').replace('\n', '%0A')}"
        sms_url = f"sms:?body={share_message}"
        
        return Response({
            "code": referral_code.code,
            "message": share_message,
            "whatsapp_url": whatsapp_url,
            "sms_url": sms_url
        })


# =============================================================================
# Wallet Views
# =============================================================================

class WalletView(APIView):
    """Get wallet balance and info"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)


class WalletTransactionsView(APIView):
    """Get wallet transaction history"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        transactions = wallet.transactions.all()[:50]  # Last 50 transactions
        serializer = WalletTransactionSerializer(transactions, many=True)
        return Response({
            'balance': wallet.balance,
            'transactions': serializer.data
        })
