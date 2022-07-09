from .settings import *
print("debug")
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1']
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_SSL_REDIRECT = False
SECURE_HSTS_PRELOAD = False
del SESSION_ENGINE

INTERNAL_IPS = [
    # ...
    "127.0.0.1",
    # ...
]

# INSTALLED_APPS = INSTALLED_APPS + [ "debug_toolbar"]

# MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware",] + MIDDLEWARE