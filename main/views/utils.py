import json
from heapq import heappop, heappush

from django.db.models import F
from django.db.models.functions import Abs, Extract, Greatest, Log, Sign
from rest_framework import serializers

from ..models import Comment, Post, Profile, Vote, Reputation

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


def addReputation(obj):
    reputations = list(Reputation.objects.filter(user_name = obj['user_name']))
    for reputation in reputations:
        obj[reputation.tag] = reputation.value
    return obj

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
        self.calculateCollapseOrder()
        
    def setNextParent(self, children, depth = 0):
        for child in reversed(children):
            child.depth = depth
            if not child.parent_id:
                child.next_parent_id = None
            else:
                parent = self.hashNodes[child.parent_id]
                child.next_parent_id = parent.next_id if parent.next_id else parent.next_parent_id
            self.setNextParent(child.children, depth + 1)

    def calculateCollapseOrder(self):
        pushnode = lambda h, node: heappush(h, (-node.score, node))
        heap = []
        count = 1
        [pushnode(heap, node) for node in self.root]
        while(len(heap) > 0):
            node = heappop(heap)[1]
            node.collapseOrder = count
            count += 1
            [pushnode(heap, node) for node in node.children]

class CommentTreeNode:
    def __init__(self, comment):
        self.children = []
        self.comment = CommentSerializer(comment).data
        self.id = comment.id
        self.parent_id = comment.parent_id_id
        self.score = comment.score + comment.reddit_score
        self.next_id = None
        self.prev_id = None
        self.next_parent_id = None
        self.collapseOrder = None
    def __lt__(self,other):
        return self.score < other.score
    def toDict(self):
        newDict = self.__dict__
        newDict = addReputation(newDict)
        newDict['children'] = [x.toDict() for x in self.children]
        return newDict

