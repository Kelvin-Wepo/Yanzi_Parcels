import random
from string import ascii_uppercase
from django.contrib import admin,messages
from django.conf import settings
from paypalrestsdk import configure, Payout


from core.models import *

configure({
    "mode": settings.PAYPAL_MODE,
    "client_id": settings.PAYPAL_CLIENT_ID,
    "client_secret": settings.PAYPAL_CLIENT_SECRET,
})

def payout_to_courier(modeladmin, request, queryset):
    payout_items = []
    transaction_querysets = []

    # Step 1 - Get all the valid couriers in queryset
    for courier in queryset:
        if courier.paypal_email:
            courier_in_transactions = Transaction.objects.filter(
                job__courier=courier,  # Use job__courier instead of job_courier
                status=Transaction.IN_STATUS
            )
            if courier_in_transactions:
                transaction_querysets.append(courier_in_transactions)
                balance = sum(i.amount for i in courier_in_transactions)
                payout_items.append({
                    "recipient_type": "EMAIL",  # Corrected the typo in "recipient_type"
                    "amount": {
                        "value": "{:.2f}".format(balance * 0.8),
                        "currency": "USD"
                    },
                    "receiver": courier.paypal_email,
                    "note": "Thank you",
                    "sender_item_id": str(courier.id)  # Corrected the syntax for string formatting
                })

    # Step 2 - Send payout batch + email to receivers
    sender_batch_id = ''.join(random.choice(ascii_uppercase) for i in range(12))
    payout = Payout({
        "sender_batch_header": {
            "sender_batch_id": sender_batch_id,
            "email_subject": "You have a payment"
        },
        "items": payout_items
    })

    # Step 3 - Update transactions status to "OUT" if success
    try:
        if payout.create():
            for t in transaction_querysets:
                t.update(status=Transaction.OUT_STATUS)
                messages.success(request, "payout[%s] created successfully" % payout.batch_header.payout)
        else:
            messages.error(request, payout.error)
    except Exception as e:
        messages.error(request, str(e))


payout_to_courier.short_description = "Payout to couriers"

class CourierAdmin(admin.ModelAdmin):
    list_display =['user_full_name','paypal_email','balance']
    actions = [payout_to_courier]

    def user_full_name(self,obj):
        return obj.user.get_full_name()
    
    def balance(self, obj):
        return round(sum(t.amount for t in Transaction.objects.filter(job__courier=obj, status=Transaction.IN_STATUS)) * 0.8, 2)

class TransactionAdmin(admin.ModelAdmin):
    list_display = ['stripe_payment_intent_id', 'courier_paypal_email', 'customer', 'courier_job', 'amount', 'status', 'created_at']
    list_filter = ['status',]

    def customer(self, obj):
        return obj.job.customer
        
    def courier(self, obj):
        return obj.job.courier     

    def courier_paypal_email(self, obj):
        return obj.job.courier.paypal_email if obj.job.courier else None  

    def courier_job(self, obj):
        return obj.job  # Assuming you want to display the job in the admin list

# Register your models here.
admin.site.register(Customer)
admin.site.register(Courier,CourierAdmin)
admin.site.register(Category)
admin.site.register(Job)
admin.site.register(Transaction, TransactionAdmin)
 