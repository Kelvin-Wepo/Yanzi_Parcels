"""B2B Business Portal API Views"""
import csv
import io
from decimal import Decimal
from datetime import timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Count, Q

from core.models import (
    BusinessAccount, BulkOrder, BulkDeliveryItem, BusinessCredit,
    BusinessCreditTransaction, BusinessInvoice, BusinessAPILog,
    Job, Category, Courier
)
from core.serializers import (
    BusinessAccountSerializer, BusinessAccountCreateSerializer,
    BulkOrderSerializer, BulkOrderCreateSerializer, BulkDeliveryItemSerializer,
    BusinessCreditSerializer, BusinessCreditTransactionSerializer,
    BusinessInvoiceSerializer, BusinessAPILogSerializer
)
from core.utils.pricing import calculate_price


class BusinessAccountViewSet(viewsets.ModelViewSet):
    """Business account management for B2B portal"""
    permission_classes = [IsAuthenticated]
    serializer_class = BusinessAccountSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return BusinessAccount.objects.all()
        return BusinessAccount.objects.filter(owner=user)
    
    def create(self, request, *args, **kwargs):
        """Create business account"""
        if BusinessAccount.objects.filter(owner=request.user).exists():
            return Response(
                {'error': 'User already has a business account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = BusinessAccountCreateSerializer(data=request.data)
        if serializer.is_valid():
            business = serializer.save(owner=request.user)
            # Create credit account
            BusinessCredit.objects.create(business=business)
            return Response(
                BusinessAccountSerializer(business).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def regenerate_api_key(self, request, pk=None):
        """Generate new API key for business"""
        business = self.get_object()
        if business.owner != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        api_key = business.generate_api_key()
        return Response({
            'api_key': api_key,
            'message': 'API key regenerated successfully'
        })
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Get business dashboard metrics"""
        business = self.get_object()
        if business.owner != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        month_start = timezone.now().replace(day=1)
        month_deliveries = business.bulk_orders.filter(
            created_at__gte=month_start,
            status=BulkOrder.STATUS_COMPLETED
        ).count()
        
        total_cost = business.bulk_orders.filter(
            created_at__gte=month_start
        ).aggregate(total=Sum('actual_cost'))['total'] or 0
        
        pending_orders = business.bulk_orders.filter(
            status__in=[BulkOrder.STATUS_PENDING, BulkOrder.STATUS_PROCESSING]
        ).count()
        
        credit_balance = business.credit_account.balance if hasattr(business, 'credit_account') else 0
        
        return Response({
            'business_name': business.business_name,
            'tier': business.get_tier_display(),
            'total_deliveries': business.bulk_orders.count(),
            'month_deliveries': month_deliveries,
            'total_spent': float(total_cost),
            'month_spent': float(total_cost),
            'pending_orders': pending_orders,
            'credit_balance': float(credit_balance),
            'discount_percentage': business.discount_percentage,
        })
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get business analytics"""
        business = self.get_object()
        if business.owner != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        month_start = timezone.now().replace(day=1)
        
        # Monthly stats
        orders = business.bulk_orders.filter(created_at__gte=month_start)
        
        total_items = BulkDeliveryItem.objects.filter(
            bulk_order__business=business,
            bulk_order__created_at__gte=month_start
        ).aggregate(total=Sum('estimated_cost'))['total'] or 0
        
        completed_items = BulkDeliveryItem.objects.filter(
            bulk_order__business=business,
            bulk_order__created_at__gte=month_start,
            status=BulkDeliveryItem.STATUS_DELIVERED
        ).count()
        
        # Cost breakdown
        subtotal = orders.aggregate(total=Sum('estimated_cost'))['total'] or 0
        discount = Decimal(str(float(subtotal) * business.discount_percentage / 100))
        tax = (subtotal - discount) * Decimal('0.16')  # 16% VAT
        total = subtotal - discount + tax
        
        return Response({
            'period': f"{month_start.strftime('%B %Y')}",
            'total_orders': orders.count(),
            'total_items': completed_items,
            'cost_breakdown': {
                'subtotal': float(subtotal),
                'discount': float(discount),
                'tax': float(tax),
                'total': float(total),
            },
            'top_routes': self._get_top_routes(business),
        })
    
    def _get_top_routes(self, business, limit=5):
        """Get top delivery routes"""
        items = BulkDeliveryItem.objects.filter(
            bulk_order__business=business
        ).values('delivery_address').annotate(
            count=Count('id')
        ).order_by('-count')[:limit]
        
        return [
            {'address': item['delivery_address'], 'count': item['count']}
            for item in items
        ]


class BulkOrderViewSet(viewsets.ModelViewSet):
    """Bulk order management"""
    permission_classes = [IsAuthenticated]
    serializer_class = BulkOrderSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return BulkOrder.objects.all()
        return BulkOrder.objects.filter(business__owner=user)
    
    def create(self, request, *args, **kwargs):
        """Create bulk order"""
        try:
            business = BusinessAccount.objects.get(owner=request.user)
        except BusinessAccount.DoesNotExist:
            return Response(
                {'error': 'You do not have a business account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = BulkOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            bulk_order = serializer.save(business=business, status=BulkOrder.STATUS_PENDING)
            return Response(
                BulkOrderSerializer(bulk_order).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def upload_csv(self, request):
        """Upload and validate CSV file"""
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response(
                {'error': 'CSV file required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            business = BusinessAccount.objects.get(owner=request.user)
        except BusinessAccount.DoesNotExist:
            return Response(
                {'error': 'You do not have a business account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            csv_file.seek(0)
            reader = csv.DictReader(
                io.StringIO(csv_file.read().decode('utf-8'))
            )
            
            required_fields = [
                'customer_name', 'customer_phone', 'delivery_address',
                'item_name', 'weight_kg', 'size'
            ]
            
            if not reader.fieldnames:
                return Response(
                    {'error': 'CSV file is empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            missing_fields = [f for f in required_fields if f not in reader.fieldnames]
            if missing_fields:
                return Response({
                    'error': 'CSV missing required fields',
                    'missing_fields': missing_fields,
                    'required_fields': required_fields,
                    'provided_fields': list(reader.fieldnames)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse and create bulk order
            order_name = request.data.get('order_name', 'Bulk Order')
            bulk_order = BulkOrder.objects.create(
                business=business,
                order_name=order_name,
                status=BulkOrder.STATUS_PROCESSING
            )
            
            csv_file.seek(0)
            rows = list(csv.DictReader(
                io.StringIO(csv_file.read().decode('utf-8'))
            ))
            
            total_cost = 0
            item_count = 0
            
            for row in rows:
                try:
                    # Calculate cost
                    weight = float(row.get('weight_kg', 1))
                    size = row.get('size', 'small')
                    
                    price = calculate_price(
                        distance=5,  # Default estimate
                        item_size=size,
                        vehicle_type='car'
                    )
                    
                    # Apply business discount
                    discount_factor = 1 - (business.discount_percentage / 100)
                    price = price * discount_factor
                    
                    item = BulkDeliveryItem.objects.create(
                        bulk_order=bulk_order,
                        customer_name=row['customer_name'],
                        customer_phone=row['customer_phone'],
                        customer_email=row.get('customer_email', ''),
                        pickup_address=business.business_address,
                        pickup_phone=business.contact_phone,
                        pickup_lat=Decimal(str(business.business_lat or 0)),
                        pickup_lng=Decimal(str(business.business_lng or 0)),
                        delivery_address=row['delivery_address'],
                        delivery_phone=row['customer_phone'],
                        delivery_lat=Decimal(row.get('delivery_lat', 0)),
                        delivery_lng=Decimal(row.get('delivery_lng', 0)),
                        item_name=row['item_name'],
                        item_description=row.get('item_description', ''),
                        weight_kg=Decimal(str(weight)),
                        size=size,
                        estimated_cost=Decimal(str(price)),
                        special_instructions=row.get('special_instructions', '')
                    )
                    
                    total_cost += float(price)
                    item_count += 1
                    
                except Exception as e:
                    print(f"Error processing row: {e}")
                    continue
            
            bulk_order.total_items = item_count
            bulk_order.estimated_cost = Decimal(str(total_cost))
            bulk_order.status = BulkOrder.STATUS_PROCESSING
            bulk_order.save()
            
            return Response({
                'success': True,
                'bulk_order': BulkOrderSerializer(bulk_order).data,
                'items_created': item_count,
                'estimated_total_cost': float(total_cost)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def assign_couriers(self, request, pk=None):
        """Automatically assign couriers to bulk items"""
        bulk_order = self.get_object()
        
        pending_items = bulk_order.items.filter(status=BulkDeliveryItem.STATUS_PENDING)
        assigned_count = 0
        failed_count = 0
        
        for item in pending_items:
            try:
                # Find available courier
                couriers = Courier.objects.filter(
                    is_verified=True,
                    is_active=True
                ).order_by('?')[:1]
                
                if not couriers:
                    failed_count += 1
                    continue
                
                courier = couriers[0]
                
                # Create job for this item
                job = Job.objects.create(
                    customer=bulk_order.business.owner,
                    courier=courier,
                    item_name=item.item_name,
                    item_description=item.item_description,
                    category=item.category,
                    item_size=item.size,
                    item_quantity=1,
                    pick_lat=float(item.pickup_lat),
                    pick_lng=float(item.pickup_lng),
                    pick_add=item.pickup_address,
                    pick_con=item.pickup_phone,
                    del_lat=float(item.delivery_lat),
                    del_lng=float(item.delivery_lng),
                    del_add=item.delivery_address,
                    del_con=item.delivery_phone,
                    status=Job.PROCESSING_STATUS,
                    vehicle_type='car',
                    price=item.estimated_cost
                )
                
                item.job = job
                item.status = BulkDeliveryItem.STATUS_ASSIGNED
                item.assigned_at = timezone.now()
                item.save()
                assigned_count += 1
                
            except Exception as e:
                print(f"Error assigning courier: {e}")
                failed_count += 1
                continue
        
        bulk_order.assigned_items = assigned_count
        bulk_order.status = (
            BulkOrder.STATUS_PARTIAL if assigned_count < bulk_order.total_items
            else BulkOrder.STATUS_ASSIGNED
        )
        bulk_order.save()
        
        return Response({
            'assigned_count': assigned_count,
            'failed_count': failed_count,
            'pending_count': bulk_order.total_items - assigned_count - failed_count,
            'message': f'Successfully assigned {assigned_count} couriers'
        })


class BusinessCreditViewSet(viewsets.ReadOnlyModelViewSet):
    """Business credit account management"""
    permission_classes = [IsAuthenticated]
    serializer_class = BusinessCreditSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            from core.models import BusinessCredit
            return BusinessCredit.objects.all()
        return BusinessCredit.objects.filter(business__owner=user)
    
    @action(detail=True, methods=['post'])
    def purchase_credit(self, request, pk=None):
        """Purchase credits"""
        credit_account = self.get_object()
        if credit_account.business.owner != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        amount = Decimal(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create transaction
        transaction = BusinessCreditTransaction.objects.create(
            credit_account=credit_account,
            transaction_type=BusinessCreditTransaction.TRANSACTION_PURCHASE,
            amount=amount,
            description=f'Credit purchase of KES {amount}',
            balance_before=credit_account.balance,
            balance_after=credit_account.balance + amount
        )
        
        credit_account.balance += amount
        credit_account.total_purchased += amount
        credit_account.save()
        
        return Response({
            'message': 'Credits purchased successfully',
            'new_balance': float(credit_account.balance),
            'transaction': BusinessCreditTransactionSerializer(transaction).data
        })
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get credit transactions"""
        credit_account = self.get_object()
        if credit_account.business.owner != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        transactions = credit_account.transactions.all().order_by('-created_at')
        serializer = BusinessCreditTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class BusinessInvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """Business invoices"""
    permission_classes = [IsAuthenticated]
    serializer_class = BusinessInvoiceSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return BusinessInvoice.objects.all()
        return BusinessInvoice.objects.filter(business__owner=user)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as paid"""
        invoice = self.get_object()
        if invoice.business.owner != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        invoice.status = BusinessInvoice.STATUS_PAID
        invoice.paid_date = timezone.now().date()
        invoice.paid_amount = invoice.total_amount
        invoice.payment_method = request.data.get('payment_method', 'mpesa')
        invoice.save()
        
        return Response(BusinessInvoiceSerializer(invoice).data)
