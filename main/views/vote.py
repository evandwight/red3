from django.db import transaction
from django.db.models import F
from django.http import (HttpResponseNotAllowed,
                         HttpResponseNotFound,
                         JsonResponse)

from ..models import Comment, Post, Vote


def scoreAdjust(oldDirection, newDirection):
    m = {
        Vote.Direction.UP: 1,
        None: 0,
        Vote.Direction.DOWN: -1,
    }
    return m[newDirection] - m[oldDirection]


@transaction.atomic
def updateVote(thing, user, direction, thingFilter):
    vote = Vote.objects.filter(thing_uuid=thing.thing_uuid, user=user).first()
    oldDirection = vote.direction if vote else None
    if vote:
        if vote.direction == direction:
            vote.direction = None
        else:
            vote.direction = direction
    else:
        vote = Vote(thing_uuid=thing.thing_uuid,
                    user=user, direction=direction)
    vote.save()

    newDirection = vote.direction
    s = scoreAdjust(oldDirection, newDirection)
    thingFilter.update(score=F('score') + s)

    return vote.direction


def getThing(uuid):
    thing = Post.objects.filter(thing_uuid=uuid)
    if thing.exists():
        return thing
    return Comment.objects.filter(thing_uuid=uuid)


def vote(request, pk, direction):
    if not request.user.is_authenticated:
        return HttpResponseNotAllowed()
    user = request.user
    thingFilter = getThing(pk)
    thing = thingFilter.first()
    if not thing:
        return HttpResponseNotFound(str(pk))
    newDirection = updateVote(thing, user, direction, thingFilter)
    return JsonResponse({'direction': newDirection, 'reload': hasattr(request.user, 'isNewUser')})


def upvote(request, pk):
    return vote(request, pk, Vote.Direction.UP)


def downvote(request, pk):
    return vote(request, pk, Vote.Direction.DOWN)
