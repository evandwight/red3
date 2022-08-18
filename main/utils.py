from django.core.cache import cache
from django.http import HttpResponse

def get_client_ip(request):
    return request.META.get('HTTP_X_REAL_IP')

def rateLimitByIp(request, key, ratePerMinute):
    ipKey = f'{key}-{get_client_ip(request)}'
    return rateLimit(ipKey, ratePerMinute)

def rateLimit(key, ratePerMinute):
    count = cache.get_or_set(key, 0, timeout=60)
    
    if count >= ratePerMinute:
        return HttpResponse(content="Too many requests", status= 429)
    else:
        try:
            cache.incr(key, delta=1)
        except:
            pass # between getting the key and incrementing the key it could expire.  
    return False

def conditional_cache(decorator):
    """ Returns decorated view if user is not authenticated. Un-decorated otherwise """

    def _decorator(view):

        decorated_view = decorator(view)  # This holds the view with cache decorator

        def _view(request, *args, **kwargs):

            if request.user.is_authenticated:     # If user is staff
                return view(request, *args, **kwargs)  # view without @cache
            else:
                return decorated_view(request, *args, **kwargs) # view with @cache

        return _view

    return _decorator