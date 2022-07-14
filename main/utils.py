from django.core.cache import cache
from django.http import HttpResponse

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

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