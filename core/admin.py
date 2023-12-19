from django.contrib import admin
from . import models

# Register your models here.
admin.site.register(models.Customer)
admin.site.register(models.Courier)
admin.site.register(models.Category)
admin.site.register(models.Job)
admin.site.register(models.Transaction)
