# FILE: ./backend/celery_config.py
from celery import Celery
from constants import REDIS_URL

# This file *only* defines the Celery app instance
celery_app = Celery(
    "tasks", # This is the name of the main task module
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"] # Tell Celery to explicitly load 'tasks.py'
)

# We remove autodiscover_tasks, as 'include' is more explicit

# Optional: Add standard configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

@celery_app.task(name="celery.ping")
def ping():
    return "Celery is alive!"