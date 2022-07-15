from pickle import TRUE
import json
from django.forms.models import model_to_dict

from django.db import models
from django.contrib.auth.models import User
import uuid

from django.contrib.auth.models import AbstractUser
from django.contrib import admin


class User(AbstractUser):
    pass


class Post(models.Model):
    title = models.TextField()
    created = models.DateTimeField()
    reddit_id = models.CharField(
        max_length=64, unique=True, null=True, blank=True)
    score = models.IntegerField(default=0)
    reddit_score = models.IntegerField(default=0)
    upvote_ratio = models.FloatField(default=1)
    reddit_link = models.TextField(null=True)
    external_link = models.TextField(null=True)
    text = models.TextField(null=True, blank=True)
    subreddit_name_prefixed = models.TextField(null=True)
    user_name = models.TextField(null=True)
    nsfw = models.BooleanField(null=True)
    is_local = models.BooleanField(default=False)
    mean = models.BooleanField(default=False)
    override_mean = models.BooleanField(default=False)
    thing_uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return self.title


class Comment(models.Model):
    post_id = models.ForeignKey(Post, null=True, on_delete=models.DO_NOTHING)
    text = models.TextField()
    created = models.DateTimeField()
    reddit_id = models.CharField(
        max_length=64, unique=True, null=True, blank=True)
    score = models.IntegerField(default=0)
    reddit_score = models.IntegerField(default=0)
    reddit_link = models.TextField(null=True, blank=True)
    parent_id = models.ForeignKey(
        "self", on_delete=models.DO_NOTHING, null=True, blank=True)
    parent_reddit_id = models.CharField(max_length=64, null=True, blank=True)
    user_name = models.TextField(null=True, blank=True)
    removed_from_reddit = models.BooleanField(default=False)
    is_local = models.BooleanField(default=False)
    nsfw = models.BooleanField(default=False)
    mean = models.BooleanField(default=False)
    extra = models.JSONField(default=dict)
    override_mean = models.BooleanField(default=False)
    thing_uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return self.text


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    show_nsfw = models.BooleanField('Show nsfw', default=False)
    show_mean = models.BooleanField('Show mean', default=False)
    ip_address = models.GenericIPAddressField(null=True)

    def __str__(self):
        return json.dumps(model_to_dict(self))


class Vote(models.Model):
    class Direction(models.TextChoices):
        UP = 'UP', 'Up'
        DOWN = 'DN', 'Down'
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    thing_uuid = models.UUIDField()
    direction = models.CharField(
        max_length=2, choices=Direction.choices, default=None, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'thing_uuid'], name="unique_user_thing_combination"
            )
        ]

admin.site.register(User)
admin.site.register(Profile)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Vote)