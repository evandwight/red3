from django.db.models import F
from django.db.models.functions import Abs, Extract, Greatest, Log, Sign
from rest_framework import serializers

from ..models import Comment, Post, Profile, Vote

ALL_LISTING_ORDER_BY = ((Extract(F("created"), 'epoch') - 1134028003)/45000 \
    + Log(10, Greatest(Abs(F("reddit_score") + F("score"))*2, 1))*Sign(F("reddit_score") + F("score"))) \
    .desc()

NEW = F('created').desc()


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = "__all__"

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = "__all__"
