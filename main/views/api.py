import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from math import ceil

from celery.result import AsyncResult
from django.core.cache import cache
from django.http import (HttpResponseBadRequest, HttpResponseNotFound,
                         HttpResponseRedirect, JsonResponse)
from django.urls import reverse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods

from ..models import Comment, Post, Profile, Vote
from ..tasks import listingCacheKey, loadRedditPostTask, updateRedditComments, addReputation
from ..utils import rateLimit, rateLimitByIp
from .utils import (ALL_LISTING_ORDER_BY, NEW, CommentSerializer, CommentTree,
                    PostSerializer, ProfileSerializer)
from .views import getProfileOrDefault


@require_http_methods(["GET"])
def postJson(request, pk):
    post = Post.objects.filter(id=pk).first()
    if not post:
        return HttpResponseNotFound
    return JsonResponse({'post': PostSerializer(post).data,})

@require_http_methods(["GET"])
def commentsJson(request, pk):
    post = Post.objects.filter(id=pk).first()
    if not post:
        return HttpResponseNotFound
    comments = list(Comment.objects.filter(post_id=pk))
    comments = [addReputation(comment) for comment in comments]
    commentTree = CommentTree(comments)
    return JsonResponse({'comments': [x.toDict() for x in commentTree.root]})


@require_http_methods(["GET"])
def profileJson(request):
    return JsonResponse(ProfileSerializer(getProfileOrDefault(request)).data)

@require_http_methods(["GET"])
def commentVotesJson(request, postId):
    post = Post.objects.filter(id=postId).first()
    if not post:
        return HttpResponseNotFound
    comments = Comment.objects.filter(post_id=postId)
    votes = Vote.objects.filter(thing_uuid__in=[x.thing_uuid for x in comments], user=request.user.id)
    votes = {x.thing_uuid: x.direction for x in votes}
    return JsonResponse(votes)



def is_valid_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False

@require_http_methods(["POST"])
def votesJson(request):
    if not request.user.is_authenticated:
        return JsonResponse(dict())
    thingUUIDs = None
    try:
        json_data = json.loads(request.body)
        thingUUIDs = json_data['list']
        invalid = [e for e in thingUUIDs if not is_valid_uuid(e)]
        if len(invalid) > 0:
            return HttpResponseBadRequest('Invalid uuid entries')
    except:
        return HttpResponseBadRequest('Error reading json')
    votes = Vote.objects.filter(thing_uuid__in=thingUUIDs, user=request.user.id)
    votes = {str(x.thing_uuid): x.direction for x in votes}
    return JsonResponse(votes)

@require_http_methods(["GET"])
def postsJson(request, sort):
    page_number = int(request.GET.get('page')) if request.GET.get('page') else 1
    val = cache.get(listingCacheKey(sort))
    if not val:
        return JsonResponse({'list':[], 'numPages': 0})
    else:
        PAGE_SIZE=200
        l = val['list']
        pagedList = l[(page_number-1)*PAGE_SIZE:(page_number)*PAGE_SIZE]
        response = JsonResponse({'list':pagedList, 'numPages': ceil(len(l) / PAGE_SIZE)})
        response['Cache-Control'] = 'public, max-age=%d' % 60
        return response

@require_http_methods(["POST"])
def loadRedditComments(request, pk):
    post = Post.objects.filter(id=pk).first()
    if not post or post.is_local:
        return HttpResponseNotFound()
        
    limitResponse = rateLimit('loadRedditCommentsCount', 30)
    if limitResponse:
        return limitResponse

    limitResponse = rateLimitByIp(request, 'loadRedditCommentsIp', 2)
    if limitResponse:
        return limitResponse
    
    res = updateRedditComments.delay(pk)
    return JsonResponse({'url': reverse('main:viewTask', args=[res.id])})

@require_http_methods(["GET"])
def viewTask(request, pk):
    res = AsyncResult(pk)
    return JsonResponse({'status':res.status, 'result': res.result})

@require_http_methods(["POST"])
def loadRedditPost(request, pk):
    match = re.match(r'^([A-Za-z0-9]{1,15})$', pk)
    if not match:
        return HttpResponseBadRequest('Not a reddit id')
    redditId = match.group(1)
    post = Post.objects.filter(reddit_id=redditId).first()
    if post:
        return HttpResponseRedirect(reverse('main:detail', kwargs={'pk':post.id}))
        
    limitResponse = rateLimit('loadRedditCommentsCount', 30)
    if limitResponse:
        return limitResponse

    limitResponse = rateLimitByIp(request, 'loadRedditCommentsIp', 2)
    if limitResponse:
        return limitResponse
    
    res = loadRedditPostTask.delay(pk)
    return JsonResponse({'url': reverse('main:viewTask', args=[res.id])})

