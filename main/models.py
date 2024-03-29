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
    created = models.DateTimeField(db_index=True,)
    reddit_id = models.CharField(
        max_length=64, unique=True, null=True, blank=True)
    score = models.IntegerField(default=0)
    reddit_score = models.IntegerField(default=0)
    upvote_ratio = models.FloatField(default=1)
    reddit_link = models.TextField(null=True)
    external_link = models.TextField(null=True)
    thumbnail = models.TextField(null=True)
    text = models.TextField(null=True, blank=True)
    subreddit_name_prefixed = models.TextField(null=True)
    user_name = models.TextField(null=True)
    nsfw = models.BooleanField(null=True)
    is_local = models.BooleanField(default=False)
    reddit_locked = models.BooleanField(default=False)
    mean = models.BooleanField(default=False)
    override_mean = models.BooleanField(default=False)
    thing_uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True)
    comment_update_time = models.DateTimeField(null=True)

    def __str__(self):
        return f'{self.title[:200]} --- by {self.user_name}'


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
        return f'{self.text[:200]} --- by {self.user_name}'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    show_nsfw = models.BooleanField('Show nsfw', default=False)
    show_mean = models.BooleanField('Show mean', default=False)
    show_reddit_removed = models.BooleanField('Show reddit_removed', default=False)
    show_asocial = models.BooleanField('Show asocial', default=False)
    show_political_junkie = models.BooleanField('Show political_junkie', default=False)
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

class Reputation(models.Model):
    user_name = models.TextField(null=False, blank=False)
    tag = models.TextField(null=False, blank=False)
    value = models.BooleanField(null=False, default=False)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user_name', 'tag'], name="unique_user_name_tag_combination"
            )
        ]