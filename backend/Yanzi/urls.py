"""Yanzi URL Configuration

Django REST API backend for Yanzi Parcels delivery platform.
The frontend is a separate React application.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # REST API endpoints
    path('api/', include('core.api.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
