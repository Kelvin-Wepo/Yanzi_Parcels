"""
API endpoints for saved addresses and recipients address book.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from core.models import SavedAddress, Recipient
from core.serializers import (
    SavedAddressSerializer, SavedAddressCreateSerializer,
    RecipientSerializer, RecipientCreateSerializer
)


# =============================================================================
# Saved Addresses Views
# =============================================================================

class SavedAddressListView(APIView):
    """List and create saved addresses"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all saved addresses for the customer"""
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Filter by type if provided
        address_type = request.query_params.get('type')
        addresses = customer.saved_addresses.all()
        
        if address_type:
            addresses = addresses.filter(address_type=address_type)
        
        serializer = SavedAddressSerializer(addresses, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new saved address"""
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = SavedAddressCreateSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            address = serializer.save()
            return Response(
                SavedAddressSerializer(address).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SavedAddressDetailView(APIView):
    """Get, update, or delete a saved address"""
    permission_classes = [IsAuthenticated]

    def get_address(self, request, address_id):
        return get_object_or_404(
            SavedAddress, 
            id=address_id, 
            customer=request.user.customer
        )

    def get(self, request, address_id):
        address = self.get_address(request, address_id)
        serializer = SavedAddressSerializer(address)
        return Response(serializer.data)

    def put(self, request, address_id):
        address = self.get_address(request, address_id)
        serializer = SavedAddressSerializer(address, data=request.data, partial=True)
        if serializer.is_valid():
            # Handle default settings
            if request.data.get('is_default_pickup'):
                SavedAddress.objects.filter(
                    customer=request.user.customer, 
                    is_default_pickup=True
                ).exclude(id=address_id).update(is_default_pickup=False)
            if request.data.get('is_default_delivery'):
                SavedAddress.objects.filter(
                    customer=request.user.customer, 
                    is_default_delivery=True
                ).exclude(id=address_id).update(is_default_delivery=False)
            
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, address_id):
        address = self.get_address(request, address_id)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedAddressUseView(APIView):
    """Mark an address as used (increments use count)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, address_id):
        address = get_object_or_404(
            SavedAddress, 
            id=address_id, 
            customer=request.user.customer
        )
        address.increment_use()
        return Response({"message": "Address usage recorded"})


class DefaultAddressesView(APIView):
    """Get default pickup and delivery addresses"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        default_pickup = customer.saved_addresses.filter(is_default_pickup=True).first()
        default_delivery = customer.saved_addresses.filter(is_default_delivery=True).first()
        
        return Response({
            'default_pickup': SavedAddressSerializer(default_pickup).data if default_pickup else None,
            'default_delivery': SavedAddressSerializer(default_delivery).data if default_delivery else None
        })


# =============================================================================
# Recipients Address Book Views
# =============================================================================

class RecipientListView(APIView):
    """List and create recipients"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all recipients for the customer"""
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Optional filters
        favorites_only = request.query_params.get('favorites') == 'true'
        search = request.query_params.get('search', '').strip()
        
        recipients = customer.recipients.all()
        
        if favorites_only:
            recipients = recipients.filter(is_favorite=True)
        
        if search:
            recipients = recipients.filter(
                models.Q(name__icontains=search) | 
                models.Q(phone_number__icontains=search) |
                models.Q(company__icontains=search)
            )
        
        serializer = RecipientSerializer(recipients, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new recipient"""
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = RecipientCreateSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            recipient = serializer.save()
            return Response(
                RecipientSerializer(recipient).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecipientDetailView(APIView):
    """Get, update, or delete a recipient"""
    permission_classes = [IsAuthenticated]

    def get_recipient(self, request, recipient_id):
        return get_object_or_404(
            Recipient, 
            id=recipient_id, 
            customer=request.user.customer
        )

    def get(self, request, recipient_id):
        recipient = self.get_recipient(request, recipient_id)
        serializer = RecipientSerializer(recipient)
        return Response(serializer.data)

    def put(self, request, recipient_id):
        recipient = self.get_recipient(request, recipient_id)
        serializer = RecipientSerializer(recipient, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, recipient_id):
        recipient = self.get_recipient(request, recipient_id)
        recipient.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecipientToggleFavoriteView(APIView):
    """Toggle favorite status for a recipient"""
    permission_classes = [IsAuthenticated]

    def post(self, request, recipient_id):
        recipient = get_object_or_404(
            Recipient, 
            id=recipient_id, 
            customer=request.user.customer
        )
        recipient.is_favorite = not recipient.is_favorite
        recipient.save()
        return Response({
            "is_favorite": recipient.is_favorite,
            "message": "Added to favorites" if recipient.is_favorite else "Removed from favorites"
        })


class FrequentRecipientsView(APIView):
    """Get most frequent recipients"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            customer = request.user.customer
        except:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        limit = int(request.query_params.get('limit', 5))
        recipients = customer.recipients.filter(delivery_count__gt=0).order_by('-delivery_count')[:limit]
        serializer = RecipientSerializer(recipients, many=True)
        return Response(serializer.data)
