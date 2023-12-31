# Generated by Django 4.2.7 on 2023-12-06 18:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='phone_number',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='customer',
            name='stripe_card_last4',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='customer',
            name='stripe_customer_id',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='customer',
            name='stripe_payment_method_id',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
