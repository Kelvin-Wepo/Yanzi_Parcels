"""Yanzi URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from core import views
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView


# app_name = 'core'

from core import views,consumers

from core.customer import views as customer_views
from core.courier import views as courier_views, apis as courier_apis

customer_urlpatterns = [
    path('', customer_views.home, name="home"),
    path('profile/', customer_views.profile_page, name='profile'),
    path('payment_method/', customer_views.payment_method_page, name='payment_method'),
    path('create_job/',customer_views.create_job_page, name='create_job'),
   
    path('jobs/current/', customer_views.current_jobs_page, name="current_jobs"),
    path('jobs/archived/', customer_views.archived_jobs_page, name="archived_jobs"),
]

courier_urlpatterns = [
    path('', courier_views.home, name="home"),
    path('jobs/available/',courier_views.available_jobs_page, name="available_jobs"),
    path('jobs/available/<id>',courier_views.available_job_page, name="available_job"),
    path('jobs/current/', courier_views.current_job__page, name="current_job"),
    path('jobs/current/<int:id>/take_photo/', courier_views.current_job_take_photo_page, name="current_job_take_photo"),
    path('jobs/complete/', courier_views.job_complete_page, name="job_complete"),
    path('jobs/archived/', courier_views.archived_jobs_page, name="archived_jobs"),
    path('jobs/archived/', courier_views.profile_page, name="profile"),
    path('payout_method/', courier_views.payout_method_page,name="payout_method"),
   





     path('api/jobs/available/',courier_apis.available_jobs_api, name="available_jobs_api"),
     path('api/jobs/current/<id>/update/',courier_apis.current_job_update_api, name="current_job_update_api"),
     path('api/fcm-token/update/', courier_apis.fcm_token_update_api, name="fcm_token_update_api"),
 ]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('social_django.urls', namespace='social')),
    path('', views.home, name="home"),
    path('sign-in/', auth_views.LoginView.as_view(template_name="sign_in.html"), name='login'),
    path('sign-out/', auth_views.LogoutView.as_view(next_page="/"), name='logout'),
    path('sign-up/', views.sign_up, name='sign_up'),
    path('customer/', include((customer_urlpatterns, 'customer'))),
    path('courier/', include((courier_urlpatterns, 'courier'))),
    path ('firebase-messaging-sw.js',(TemplateView.as_view(template_name="firebase-messaging-sw.js",content_type="application/javascript",))),

]

websocket_urlpatterns = [
    path('ws/jobs/<job_id>/',consumers.JobConsumer.as_asgi())
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
