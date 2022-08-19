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
        'updateAllListing': {'task': 'main.tasks.updateAllListing','schedule': crontab(minute="0,5,10,15,20,25,30,35,40,45,50,55"),},
        'updateSomeComments': {'task': 'main.tasks.updateSomeComments','schedule': 60,},
        'updatePostCache-hot': {'task': 'main.tasks.updatePostCache', 'args': ['hot'], 'schedule': crontab(minute="1,6,11,16,21,26,31,36,41,46,51,56"),},
        'updatePostCache-new': {'task': 'main.tasks.updatePostCache', 'args': ['new'],'schedule': 60,},
        'cleanDb': {'task': 'main.tasks.cleanDb','schedule': crontab(hour=4, minute=0),},
    },
)

# Load task modules from all registered Django apps.
app.autodiscover_tasks()
