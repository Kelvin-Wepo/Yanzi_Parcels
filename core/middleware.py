from .models import Customer

class ProfileMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # One-time configuration and initialization.

    def __call__(self, request):
        # Code to be executed for each request before
        # the view (and later middleware) are called.
        if request.user.is_authenticated and not hasattr(request.user,'customer'):
            Customer.objects.create(user=request.user)
        response = self.get_response(request)

        # Code to be executed for each request/response after
        # the view is called.

        return response