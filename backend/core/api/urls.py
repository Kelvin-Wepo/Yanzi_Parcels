from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from core.api.auth import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    ChangePasswordView,
)
from core.api.customer import (
    CustomerProfileView,
    CustomerPhoneUpdateView,
    CategoryListView,
    CustomerJobListView,
    CustomerJobDetailView,
    CustomerJobCancelView,
    CourierLocationView,
    JobCreateView,
    PaymentMethodView,
)
from core.api.courier import (
    CourierProfileView,
    CourierPayoutMethodView,
    AvailableJobsView,
    AvailableJobDetailView,
    CurrentJobView,
    CurrentJobUpdateView,
    CourierLocationUpdateView,
    CourierArchivedJobsView,
    FCMTokenUpdateView,
)
from core.api.chat import (
    ChatMessagesView,
    QuickMessagesView,
    UnreadCountView,
    MaskedPhoneView,
    ChatInfoView,
    MarkMessagesReadView,
)
from core.api.vehicle import (
    VehicleTypesView,
    VehiclePricingView,
    CourierVehiclesView,
    CourierVehicleDetailView,
    SetActiveVehicleView,
    CourierVerificationView,
    AvailableCouriersView,
)
from core.api.business import (
    BusinessAccountViewSet,
    BulkOrderViewSet,
    BusinessCreditViewSet,
    BusinessInvoiceViewSet,
)
from core.api.addresses import (
    SavedAddressListView,
    SavedAddressDetailView,
    SavedAddressUseView,
    DefaultAddressesView,
    RecipientListView,
    RecipientDetailView,
    RecipientToggleFavoriteView,
    FrequentRecipientsView,
)
from core.api.scheduled import (
    ScheduledDeliveryListView,
    ScheduledDeliveryDetailView,
    ScheduledDeliveryPauseView,
    ScheduledDeliveryResumeView,
    ScheduledDeliveryCancelView,
    ScheduledDeliveryTriggerView,
    UpcomingDeliveriesView,
)
from core.api.ratings import (
    RatingCreateView,
    RatingDetailView,
    JobRatingView,
    CourierRatingsView,
    CourierRespondToRatingView,
    MyRatingsView,
    MyReferralCodeView,
    MyReferralsView,
    ApplyReferralCodeView,
    ValidateReferralCodeView,
    ShareReferralView,
    WalletView,
    WalletTransactionsView,
)
from core.api.extras import (
    CreateTrackingLinkView,
    TrackingLinkListView,
    PublicTrackingView,
    ShareTrackingView,
    CODStatusView,
    CODCollectView,
    InsuranceQuoteView,
    InsuranceTiersView,
    JobInsuranceView,
    InsuranceClaimView,
    MyInsuranceClaimsView,
    ReorderJobView,
    ReorderableJobsView,
)


urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='api_register'),
    path('auth/login/', LoginView.as_view(), name='api_login'),
    path('auth/logout/', LogoutView.as_view(), name='api_logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='api_current_user'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='api_change_password'),

    # Common
    path('categories/', CategoryListView.as_view(), name='api_categories'),

    # Customer endpoints
    path('customer/profile/', CustomerProfileView.as_view(), name='api_customer_profile'),
    path('customer/phone/', CustomerPhoneUpdateView.as_view(), name='api_customer_phone'),
    path('customer/jobs/', CustomerJobListView.as_view(), name='api_customer_jobs'),
    path('customer/jobs/<uuid:job_id>/', CustomerJobDetailView.as_view(), name='api_customer_job_detail'),
    path('customer/jobs/<uuid:job_id>/cancel/', CustomerJobCancelView.as_view(), name='api_customer_job_cancel'),
    path('customer/jobs/<uuid:job_id>/courier-location/', CourierLocationView.as_view(), name='api_courier_location'),
    path('customer/job/create/', JobCreateView.as_view(), name='api_job_create'),
    path('customer/payment-method/', PaymentMethodView.as_view(), name='api_payment_method'),

    # Courier endpoints
    path('courier/profile/', CourierProfileView.as_view(), name='api_courier_profile'),
    path('courier/payout-method/', CourierPayoutMethodView.as_view(), name='api_courier_payout'),
    path('courier/jobs/available/', AvailableJobsView.as_view(), name='api_available_jobs'),
    path('courier/jobs/available/<uuid:job_id>/', AvailableJobDetailView.as_view(), name='api_available_job'),
    path('courier/jobs/current/', CurrentJobView.as_view(), name='api_current_job'),
    path('courier/jobs/current/<uuid:job_id>/update/', CurrentJobUpdateView.as_view(), name='api_current_job_update'),
    path('courier/jobs/archived/', CourierArchivedJobsView.as_view(), name='api_courier_archived'),
    path('courier/location/', CourierLocationUpdateView.as_view(), name='api_courier_location'),
    path('courier/fcm-token/', FCMTokenUpdateView.as_view(), name='api_fcm_token'),

    # Chat endpoints (shared between customer and courier)
    path('chat/<uuid:job_id>/messages/', ChatMessagesView.as_view(), name='api_chat_messages'),
    path('chat/<uuid:job_id>/info/', ChatInfoView.as_view(), name='api_chat_info'),
    path('chat/<uuid:job_id>/unread/', UnreadCountView.as_view(), name='api_chat_unread'),
    path('chat/<uuid:job_id>/read/', MarkMessagesReadView.as_view(), name='api_chat_mark_read'),
    path('chat/<uuid:job_id>/call/', MaskedPhoneView.as_view(), name='api_chat_call'),
    path('chat/quick-messages/', QuickMessagesView.as_view(), name='api_quick_messages'),

    # Vehicle endpoints
    path('vehicles/types/', VehicleTypesView.as_view(), name='api_vehicle_types'),
    path('vehicles/pricing/', VehiclePricingView.as_view(), name='api_vehicle_pricing'),
    path('vehicles/available/<str:vehicle_type>/', AvailableCouriersView.as_view(), name='api_available_couriers'),
    
    # Courier vehicle management
    path('courier/vehicles/', CourierVehiclesView.as_view(), name='api_courier_vehicles'),
    path('courier/vehicles/<uuid:vehicle_id>/', CourierVehicleDetailView.as_view(), name='api_courier_vehicle_detail'),
    path('courier/vehicles/<uuid:vehicle_id>/activate/', SetActiveVehicleView.as_view(), name='api_set_active_vehicle'),
    path('courier/verification/', CourierVerificationView.as_view(), name='api_courier_verification'),

    # Saved Addresses endpoints
    path('customer/addresses/', SavedAddressListView.as_view(), name='api_saved_addresses'),
    path('customer/addresses/defaults/', DefaultAddressesView.as_view(), name='api_default_addresses'),
    path('customer/addresses/<uuid:address_id>/', SavedAddressDetailView.as_view(), name='api_saved_address_detail'),
    path('customer/addresses/<uuid:address_id>/use/', SavedAddressUseView.as_view(), name='api_saved_address_use'),

    # Recipients Address Book endpoints
    path('customer/recipients/', RecipientListView.as_view(), name='api_recipients'),
    path('customer/recipients/frequent/', FrequentRecipientsView.as_view(), name='api_frequent_recipients'),
    path('customer/recipients/<uuid:recipient_id>/', RecipientDetailView.as_view(), name='api_recipient_detail'),
    path('customer/recipients/<uuid:recipient_id>/favorite/', RecipientToggleFavoriteView.as_view(), name='api_recipient_favorite'),

    # Scheduled Deliveries endpoints
    path('customer/schedules/', ScheduledDeliveryListView.as_view(), name='api_scheduled_deliveries'),
    path('customer/schedules/upcoming/', UpcomingDeliveriesView.as_view(), name='api_upcoming_deliveries'),
    path('customer/schedules/<uuid:schedule_id>/', ScheduledDeliveryDetailView.as_view(), name='api_scheduled_delivery_detail'),
    path('customer/schedules/<uuid:schedule_id>/pause/', ScheduledDeliveryPauseView.as_view(), name='api_scheduled_delivery_pause'),
    path('customer/schedules/<uuid:schedule_id>/resume/', ScheduledDeliveryResumeView.as_view(), name='api_scheduled_delivery_resume'),
    path('customer/schedules/<uuid:schedule_id>/cancel/', ScheduledDeliveryCancelView.as_view(), name='api_scheduled_delivery_cancel'),
    path('customer/schedules/<uuid:schedule_id>/trigger/', ScheduledDeliveryTriggerView.as_view(), name='api_scheduled_delivery_trigger'),

    # Rating & Review endpoints
    path('ratings/', RatingCreateView.as_view(), name='api_create_rating'),
    path('ratings/my/', MyRatingsView.as_view(), name='api_my_ratings'),
    path('ratings/<uuid:rating_id>/', RatingDetailView.as_view(), name='api_rating_detail'),
    path('ratings/job/<uuid:job_id>/', JobRatingView.as_view(), name='api_job_rating'),
    path('ratings/courier/<int:courier_id>/', CourierRatingsView.as_view(), name='api_courier_ratings'),
    path('ratings/<uuid:rating_id>/respond/', CourierRespondToRatingView.as_view(), name='api_rating_respond'),

    # Referral Program endpoints
    path('referral/my-code/', MyReferralCodeView.as_view(), name='api_my_referral_code'),
    path('referral/my-referrals/', MyReferralsView.as_view(), name='api_my_referrals'),
    path('referral/apply/', ApplyReferralCodeView.as_view(), name='api_apply_referral'),
    path('referral/validate/<str:code>/', ValidateReferralCodeView.as_view(), name='api_validate_referral'),
    path('referral/share/', ShareReferralView.as_view(), name='api_share_referral'),

    # Wallet endpoints
    path('wallet/', WalletView.as_view(), name='api_wallet'),
    path('wallet/transactions/', WalletTransactionsView.as_view(), name='api_wallet_transactions'),

    # Tracking Links endpoints
    path('tracking/create/', CreateTrackingLinkView.as_view(), name='api_create_tracking'),
    path('tracking/job/<uuid:job_id>/', TrackingLinkListView.as_view(), name='api_job_tracking_links'),
    path('tracking/share/<uuid:job_id>/', ShareTrackingView.as_view(), name='api_share_tracking'),
    path('track/<str:short_code>/', PublicTrackingView.as_view(), name='api_public_tracking'),

    # Cash on Delivery endpoints
    path('cod/<uuid:job_id>/', CODStatusView.as_view(), name='api_cod_status'),
    path('cod/<uuid:job_id>/collect/', CODCollectView.as_view(), name='api_cod_collect'),

    # Insurance endpoints
    path('insurance/tiers/', InsuranceTiersView.as_view(), name='api_insurance_tiers'),
    path('insurance/quote/', InsuranceQuoteView.as_view(), name='api_insurance_quote'),
    path('insurance/job/<uuid:job_id>/', JobInsuranceView.as_view(), name='api_job_insurance'),
    path('insurance/claim/', InsuranceClaimView.as_view(), name='api_file_claim'),
    path('insurance/my-claims/', MyInsuranceClaimsView.as_view(), name='api_my_claims'),

    # Reorder endpoints
    path('reorder/', ReorderJobView.as_view(), name='api_reorder_job'),
    path('reorder/jobs/', ReorderableJobsView.as_view(), name='api_reorderable_jobs'),

    # B2B Business Portal endpoints
    path('business/accounts/', BusinessAccountViewSet.as_view({
        'get': 'list',
        'post': 'create',
    }), name='api_business_accounts'),
    path('business/accounts/<uuid:pk>/', BusinessAccountViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    }), name='api_business_account_detail'),
    path('business/accounts/<uuid:pk>/dashboard/', BusinessAccountViewSet.as_view({
        'get': 'dashboard',
    }), name='api_business_dashboard'),
    path('business/accounts/<uuid:pk>/analytics/', BusinessAccountViewSet.as_view({
        'get': 'analytics',
    }), name='api_business_analytics'),
    path('business/accounts/<uuid:pk>/regenerate-api-key/', BusinessAccountViewSet.as_view({
        'post': 'regenerate_api_key',
    }), name='api_regenerate_api_key'),
    
    # Bulk Orders endpoints
    path('business/bulk-orders/', BulkOrderViewSet.as_view({
        'get': 'list',
        'post': 'create',
    }), name='api_bulk_orders'),
    path('business/bulk-orders/<uuid:pk>/', BulkOrderViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
    }), name='api_bulk_order_detail'),
    path('business/bulk-orders/upload-csv/', BulkOrderViewSet.as_view({
        'post': 'upload_csv',
    }), name='api_bulk_upload_csv'),
    path('business/bulk-orders/<uuid:pk>/assign-couriers/', BulkOrderViewSet.as_view({
        'post': 'assign_couriers',
    }), name='api_bulk_assign_couriers'),
    
    # Business Credit endpoints
    path('business/credits/', BusinessCreditViewSet.as_view({
        'get': 'list',
    }), name='api_business_credits'),
    path('business/credits/<uuid:pk>/', BusinessCreditViewSet.as_view({
        'get': 'retrieve',
    }), name='api_business_credit_detail'),
    path('business/credits/<uuid:pk>/purchase/', BusinessCreditViewSet.as_view({
        'post': 'purchase_credit',
    }), name='api_purchase_credit'),
    path('business/credits/<uuid:pk>/transactions/', BusinessCreditViewSet.as_view({
        'get': 'transactions',
    }), name='api_credit_transactions'),
    
    # Business Invoices endpoints
    path('business/invoices/', BusinessInvoiceViewSet.as_view({
        'get': 'list',
    }), name='api_business_invoices'),
    path('business/invoices/<uuid:pk>/', BusinessInvoiceViewSet.as_view({
        'get': 'retrieve',
    }), name='api_business_invoice_detail'),
    path('business/invoices/<uuid:pk>/mark-paid/', BusinessInvoiceViewSet.as_view({
        'post': 'mark_paid',
    }), name='api_mark_invoice_paid'),
]

