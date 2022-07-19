from heapq import heappush, heappop
from django.conf import settings
from ..models import Post, Comment, Vote, Profile
from .views import getProfileOrDefault, applyVotes
from django.http import HttpResponseNotFound, JsonResponse
from django.shortcuts import render
from ..utils import conditional_cache
from django.views.decorators.cache import cache_page

def flattenComments(commentForest, depth, collapsedSection):
    flatComments = []
    appendEndCollapsed = False
    for comment in commentForest:
        comment.depth = depth
        if not collapsedSection and comment.collapsed:
            collapsedSection = ["START_DIV_COLLAPSED", comment.id, 0, depth]
            appendEndCollapsed = True
            flatComments.append(collapsedSection)
        if collapsedSection:
            collapsedSection[2] += 1
        flatComments.append(comment)
        flatComments.extend(flattenComments(comment.children, depth+1, collapsedSection))

    if appendEndCollapsed:
        flatComments.append(["END_DIV_COLLAPSED", None])
    return flatComments


def textToHtml(text):
    return text.split('\n\n')


def setPrevNext(children):
    for i, child in enumerate(children):
        child.prev_id = children[i-1].id if i > 0 else None
        child.next_id = children[i+1].id if (i < len(children) - 1) else None

def setNextParent(children, hashComments):
    for child in reversed(children):
        if not child.parent_id_id:
            child.next_parent_id = None
        else:
            parent = hashComments[child.parent_id_id]
            child.next_parent_id = parent.next_id if parent.next_id else parent.next_parent_id
        setNextParent(child.children, hashComments)

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
    for comment in comments:
        setPrevNext(comment.children)
    setPrevNext(depth0)
    setNextParent(depth0, hashComments)
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

def heapPushAll(heap, comments):
    for comment in comments:
        heappush(heap, (-(comment.reddit_score + comment.score), comment.id, comment))

def collapse(comments):
    heap = []
    heapPushAll(heap, comments)
    for i in range(1, 50):
        comment = heappop(heap)[2]
        if comment.reddit_score < 1:
            break
        comment.collapsed = False
        heapPushAll(heap, comment.children)

# @conditional_cache(decorator=cache_page(60))
def postDetails(request, pk):
    post = Post.objects.filter(id=pk).first()
    if not post:
        return HttpResponseNotFound
    comments = list(Comment.objects.filter(post_id=pk))
    comments.sort(key=lambda x: x.reddit_score + x.score, reverse=True)
    depth0 = treeifyComments(comments)
    profile = getProfileOrDefault(request)
    applyProfile(comments, profile)
    for comment in comments:
        comment.collapsed = True
    collapse(depth0)

    if request.user.is_authenticated:
        userId = request.user.id
        postVote =  Vote.objects.filter(thing_uuid = post.thing_uuid, user = userId).first()
        if postVote:
            post.vote = postVote.direction
        applyVotes(comments, userId)

    flatComments = flattenComments(depth0, 0, None)
    return render(request, 'main/post_detail.html', {'post': post, 'comments':depth0, 'flatComments': flatComments})
