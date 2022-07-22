from heapq import heappush, heappop
from django.conf import settings
from ..models import Post, Comment, Vote, Profile
from .views import getProfileOrDefault, applyVotes
from django.http import HttpResponseNotFound, JsonResponse
from django.shortcuts import render
from ..utils import conditional_cache
from django.views.decorators.cache import cache_page

class CommentTree:
    def __init__(self, comments):
        self.nodes = [CommentTreeNode(x) for x in comments]
        self.nodes.sort(reverse=True)
        self.hashNodes = {node.id: node for node in self.nodes}
        self.root = []

        #populate tree
        for node in self.nodes:
            children = self.hashNodes[node.parent_id].children if node.parent_id else self.root
            prevNode = children[-1] if len(children) > 0 else None
            if prevNode:
                prevNode.next_id = node.id
                node.prev_id = prevNode.id
            children.append(node)

        self.setNextParent(self.root)
        self.collapse(50)
        
    def setNextParent(self, children, depth = 0):
        for child in reversed(children):
            child.depth = depth
            if not child.parent_id:
                child.next_parent_id = None
            else:
                parent = self.hashNodes[child.parent_id]
                child.next_parent_id = parent.next_id if parent.next_id else parent.next_parent_id
            self.setNextParent(child.children, depth + 1)

    def collapse(self, maxShown):
        pushnode = lambda h, node: heappush(h, (-node.score, node))
        heap = []
        [pushnode(heap, node) for node in self.root]
        for i in range(1, maxShown):
            if len(heap) == 0:
                break
            node = heappop(heap)[1]
            if node.score < 0:
                break
            node.collapsed = False
            [pushnode(heap, node) for node in node.children]

    def flatten(self):
        return self.flattenRecurse(self.root, None)

    def flattenRecurse(self, children, collapsedSection):
        flatComments = []
        appendEndCollapsed = False
        for node in children:
            if not collapsedSection and node.collapsed:
                collapsedSection = ["START_DIV_COLLAPSED", node.id, 0, node.depth]
                appendEndCollapsed = True
                flatComments.append(collapsedSection)
            if collapsedSection:
                collapsedSection[2] += 1
            flatComments.append(node)
            flatComments.extend(self.flattenRecurse(node.children, collapsedSection))

        if appendEndCollapsed:
            flatComments.append(["END_DIV_COLLAPSED", None])
        return flatComments

class CommentTreeNode:
    def __init__(self, comment):
        self.children = []
        self.comment = comment
        self.id = comment.id
        self.parent_id = comment.parent_id_id
        self.score = comment.score + comment.reddit_score
        self.next_id = None
        self.prev_id = None
        self.next_parent_id = None
        self.collapsed = True
    def __lt__(self,other):
        return self.score < other.score

def textToHtml(text):
    return text.split('\n\n')

def applyProfile(comments, profile):
    for comment in comments:
        comment.hidden = False
        if not profile.show_nsfw and comment.nsfw:
            comment.hidden = True
            comment.hidden_reason = '[hiding nsfw]' 
        if not profile.show_mean and comment.mean:
            comment.hidden = True
            comment.hidden_reason = '[hiding mean]'

# @conditional_cache(decorator=cache_page(60))
def postDetails(request, pk):
    post = Post.objects.filter(id=pk).first()
    if not post:
        return HttpResponseNotFound
    comments = list(Comment.objects.filter(post_id=pk))
    commentTree = CommentTree(comments)
    flatComments = commentTree.flatten()

    profile = getProfileOrDefault(request)
    applyProfile(comments, profile)
    if request.user.is_authenticated:
        userId = request.user.id
        postVote =  Vote.objects.filter(thing_uuid = post.thing_uuid, user = userId).first()
        if postVote:
            post.vote = postVote.direction
        applyVotes(comments, userId)

    return render(request, 'main/post_detail.html', {'post': post, 'flatComments': flatComments})
