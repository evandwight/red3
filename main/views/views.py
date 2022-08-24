import re

from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods

from ..forms import ProfileForm, SearchForm
from ..models import Post, Profile, Vote
from ..utils import conditional_cache


@require_http_methods(["GET"])
def listingNew(request, sort):
    return render(request, 'main/post_list.html')

@require_http_methods(["GET"])
def postDetails(request, postId):
    return render(request, 'main/post_detail.html')

@conditional_cache(decorator=cache_page(60*5))
@require_http_methods(["GET"])
def sortListings(request):
    return render(request, 'main/sortListing.html')

@conditional_cache(decorator=cache_page(60*5))
@require_http_methods(["GET", "POST"])
def search(request):
    loadId = None
    if not request.method == 'POST':
        form =  SearchForm()
    else:
        form = SearchForm(request.POST)
        if form.is_valid():
            searchTerm = form.cleaned_data['searchTerm']
            match = re.match(r'^https?:\/\/.+\/r\/.+\/comments\/([A-Za-z0-9]+)\/.+$', searchTerm) 
            if match:
                redditId = match.group(1)
            else:
                redditId = searchTerm

            post = Post.objects.filter(reddit_id = redditId).first()
            if post:
                return HttpResponseRedirect(reverse('main:detail', kwargs={'pk':post.id}))
            else:
                form.add_error(None,f"Not found - reddit id = '{redditId}'")
                loadId = redditId
    return render(request, 'main/search.html', {'form': form, 'loadId': loadId})

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


def applyVotes(things, userId):
    votes = Vote.objects.filter(
        thing_uuid__in=[x.thing_uuid for x in things], user=userId)
    votes = {x.thing_uuid: x.direction for x in votes}
    for obj in things:
        obj.vote = votes.get(obj.thing_uuid)