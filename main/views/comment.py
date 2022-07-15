from django.conf import settings
from ..models import Post, Comment, Vote, Profile
from .views import getProfileOrDefault, applyVotes
from django.http import HttpResponseNotFound, JsonResponse
from django.shortcuts import render
from ..utils import conditional_cache
from django.views.decorators.cache import cache_page

def flattenComments(commentForest, depth):
    flatComments = []
    for comment in commentForest:
        comment.depth = depth
        flatComments.append("START_DIV")
        flatComments.append(comment)
        flatComments.extend(flattenComments(comment.children, depth+1))
        flatComments.append("END_DIV")
    return flatComments


def textToHtml(text):
    return text.split('\n\n')


def treeifyComments(comments):
    hashComments = {x.id: x for x in comments}
    depth0 = []
    for comment in comments:
        comment.children = []
    for comment in comments:
        if comment.parent_id_id:
            hashComments[comment.parent_id_id].children.append(comment)
        else:
            depth0.append(comment)
    return depth0

def applyProfile(comments, profile):
    for comment in comments:
        comment.hidden = False
        if not profile.show_nsfw and comment.nsfw:
            comment.hidden = True
            comment.hidden_reason = '[hiding nsfw]' 
        if not profile.show_mean and comment.mean:
            comment.hidden = True
            comment.hidden_reason = '[hiding mean]'


@conditional_cache(decorator=cache_page(60))
def postDetails(request, pk):
    post = Post.objects.filter(id=pk).first()
    if not post:
        return HttpResponseNotFound
    comments = list(Comment.objects.filter(post_id=pk))
    comments.sort(key=lambda x: x.reddit_score + x.score, reverse=True)
    depth0 = treeifyComments(comments)
    profile = getProfileOrDefault(request)
    applyProfile(comments, profile)

    if request.user.is_authenticated:
        userId = request.user.id
        postVote =  Vote.objects.filter(thing_uuid = post.thing_uuid, user = userId).first()
        if postVote:
            post.vote = postVote.direction
        applyVotes(comments, userId)

    flatComments = flattenComments(depth0, 0)
    return render(request, 'main/post_detail.html', {'post': post, 'comments':depth0, 'flatComments': flatComments})
