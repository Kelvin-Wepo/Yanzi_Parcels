import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from fastparcel.urls import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yanziparcels.settings')

application = ProtocolTypeRouter({
    "http":get_asgi_application(),
    "websocket":AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    )
 
})