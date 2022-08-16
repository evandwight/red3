from django.shortcuts import render
from django.urls import reverse

from ..models import Post, Profile, Vote
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseNotFound, JsonResponse
from ..tasks import updateRedditComments
from celery.result import AsyncResult
from django.core.paginator import Paginator
from ..forms import ProfileForm, SearchForm
from ..utils import rateLimit, rateLimitByIp, conditional_cache
from django.views.decorators.cache import cache_page
from .utils import ALL_LISTING_ORDER_BY, NEW
import re
from django.views.decorators.http import require_http_methods
from datetime import datetime, timedelta, timezone

@conditional_cache(decorator=cache_page(60))
@require_http_methods(["GET"])
def listing(request, sort=ALL_LISTING_ORDER_BY):
    profile = getProfileOrDefault(request)
    querySet = Post.objects.get_queryset()
    querySet = querySet.filter(created__gte=(datetime.now(tz=timezone.utc) - timedelta(days=2)))
    if not profile.show_nsfw:
        querySet = querySet.exclude(nsfw=True)
    if not profile.show_mean:
        querySet = querySet.exclude(mean=True)
    querySet = querySet.order_by(sort)
    paginator = Paginator(querySet, 25)  # Show 25 contacts per page.

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if request.user.is_authenticated:
        applyVotes(page_obj, request.user.id)

    return render(request, 'main/post_list.html', {'page_obj': page_obj})

@conditional_cache(decorator=cache_page(60))
@require_http_methods(["GET"])
def listingNew(request, sort):
    sortMap = {'new': NEW, 'hot': ALL_LISTING_ORDER_BY}
    sortVal = sortMap.get(sort)
    if sortVal:
        return listing(request, sortVal)
    else:
        HttpResponseNotFound()

@require_http_methods(["GET"])
def sortListings(request):
    return render(request, 'main/sortListing.html')

@require_http_methods(["GET", "POST"])
def search(request):
    if not request.method == 'POST':
        form =  SearchForm()
    else:
        form = SearchForm(request.POST)
        if form.is_valid():
            searchTerm = form.cleaned_data['searchTerm']
            match = re.match(r'^https?:\/\/.+\/r\/.+\/comments\/(.+)\/.+$', searchTerm) 
            if match:
                redditId = match.group(1)
            else:
                redditId = searchTerm

            post = Post.objects.filter(reddit_id = redditId).first()
            if post:
                return HttpResponseRedirect(reverse('main:detail', kwargs={'pk':post.id}))
            else:
                form.add_error(None,f"Not found - reddit id = '{redditId}'")
    return render(request, 'main/search.html', {'form': form})


def applyVotes(things, userId):
    votes = Vote.objects.filter(
        thing_uuid__in=[x.thing_uuid for x in things], user=userId)
    votes = {x.thing_uuid: x.direction for x in votes}
    for obj in things:
        obj.vote = votes.get(obj.thing_uuid)

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


def getProfile(user):
    return Profile.objects.get_or_create(user=user)[0]


def getProfileOrDefault(request):
    if request.user.is_authenticated:
        return getProfile(request.user)
    else:
        return Profile()

@require_http_methods(["GET", "POST"])
def editProfile(request):
    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=getProfile(request.user))
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse('main:profile'))
    else:
        form = ProfileForm(instance = getProfileOrDefault(request))

    return render(request, 'main/profile.html', {'form': form})


@require_http_methods(["GET"])
def viewTask(request, pk):
    res = AsyncResult(pk)
    return JsonResponse({'status':res.status})
