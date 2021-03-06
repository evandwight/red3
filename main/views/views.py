from django.shortcuts import render
from django.urls import reverse

from ..models import Post, Profile, Vote
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseNotFound
from django.contrib.auth.models import User
from ..tasks import updateRedditComments
from celery.result import AsyncResult
from django.db.models import F
from django.db.models.functions import Extract, Log, Greatest, Abs, Sign
from django.core.paginator import Paginator
from ..forms import ProfileForm
from ..utils import rateLimit, rateLimitByIp, conditional_cache
from django.views.decorators.cache import cache_page
from .utils import ALL_LISTING_ORDER_BY, NEW

@conditional_cache(decorator=cache_page(60))
def listing(request, sort=ALL_LISTING_ORDER_BY):
    profile = getProfileOrDefault(request)
    querySet = Post.objects.get_queryset()
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
def listingNew(request, sort):
    sortMap = {'new': NEW, 'hot': ALL_LISTING_ORDER_BY}
    sortVal = sortMap.get(sort)
    if sortVal:
        return listing(request, sortVal)
    else:
        HttpResponseNotFound()

def sortListings(request):
    return render(request, 'main/sortListing.html')


def applyVotes(things, userId):
    votes = Vote.objects.filter(
        thing_uuid__in=[x.thing_uuid for x in things], user=userId)
    votes = {x.thing_uuid: x.direction for x in votes}
    for obj in things:
        obj.vote = votes.get(obj.thing_uuid)

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
    return HttpResponseRedirect(reverse('main:viewTask', args=[res.id]))


def getProfile(user):
    return Profile.objects.get_or_create(user=user)[0]


def getProfileOrDefault(request):
    if request.user.is_authenticated:
        return getProfile(request.user)
    else:
        return Profile()


def editProfile(request):
    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=getProfile(request.user))
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse('main:profile'))
    else:
        form = ProfileForm(instance = getProfileOrDefault(request))

    return render(request, 'main/profile.html', {'form': form})


def viewTask(request, pk):
    res = AsyncResult(pk)
    result = None
    if res.ready():
        result = res.get()

    if res.name == 'main.tasks.updateRedditComments':
        redirect = reverse('main:detail', args=[res.args[0]])
    else:
        redirect = reverse('main:index')

    return render(request, 'main/viewTask.html', {'task': res, 'result': result, 'redirect': redirect})
