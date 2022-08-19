import os

from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'red3.settings')

app = Celery('red3', backend='redis://localhost:6379', broker='redis://localhost:6379')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
# app.config_from_object('django.conf:settings', namespace='CELERY')

app.conf.update(
    result_extended=True,
    task_track_started=True,
    beat_schedule={
        'updateAllListing': {'task': 'main.tasks.updateAllListing','schedule': 60*5,},
        'updateSomeComments': {'task': 'main.tasks.updateSomeComments','schedule': 60,},
        'updatePostCacheAllSorts': {'task': 'main.tasks.updatePostCacheAllSorts','schedule': 60,},
    },
)

# Load task modules from all registered Django apps.
app.autodiscover_tasks()