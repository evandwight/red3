import uuid
from ..models import Profile, User
from django.contrib.auth import login
from django.http import JsonResponse
from ..utils import get_client_ip
from django.urls import resolve
from django.urls.exceptions import Resolver404
from red3.urls import urlpatterns


def anonSessionMiddleware(get_response):
    # One-time configuration and initialization.

    def middleware(request):
        try:
            resolveMatch = resolve(request.path)
            if request.method == 'POST' \
                and not request.user.is_authenticated \
                and not resolveMatch.url_name in ['login', 'logout']:
                user = User.objects.create_user(username=f'anon-{uuid.uuid4()}')
                user.save()
                user.username = f'anon-{user.id}'
                user.save()
                Profile.objects.create(
                    user=user, ip_address=get_client_ip(request))
                request.session.set_expiry(60*60*24*365*20)
                login(request, user)
                request.user.isNewUser = True
        except Resolver404:
            pass
           
        response = get_response(request)

        # Code to be executed for each request/response after
        # the view is called.

        return response

    return middleware