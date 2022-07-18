from django import template
from datetime import datetime, timezone
from django.urls import reverse
from django.utils.html import format_html
from django.core.validators import URLValidator
import re

register = template.Library()


@register.simple_tag
def commentIcons(postId, commentId, thing_uuid, vote):
    upvoteHref = f"/upvote/{thing_uuid}"
    downvoteHref = f"/downvote/{thing_uuid}"
    submitHref = f"/submitComment/{postId}/{commentId}"
    upActive = "-active" if vote == "UP" else ""
    downActive = "-active" if vote == "DN" else ""
    html = """
<div>
    <a href="{}" class="onclick-vote">
        <img src="/static/main/images/arrow-up-line{}.svg" class="w-6" id="vote-up-{}"/>
    </a>
</div>
<div>
    <a href="{}" class="onclick-vote">
        <img src="/static/main/images/arrow-down-line{}.svg" class="w-6" id="vote-dn-{}"/>
    </a>
</div>
<div>
    <a href="{}">
        <img src="/static/main/images/reply-line.svg" class="w-6" />
    </a>
</div>
"""
    return format_html(html,
        upvoteHref, upActive, thing_uuid,
        downvoteHref, downActive, thing_uuid,
        submitHref
    )        

@register.filter
def get_type(value):
    return type(value).__name__

@register.filter
def timeSinceShort(value):
    delta = datetime.now(tz=timezone.utc) - value
    if delta.days > 365:
        return f'{delta.days/365:.1f}y'
    elif delta.days > 0:
        return f'{delta.days:.0f}d'
    else:
        return f'{delta.seconds/3600:.1f}h'

@register.filter
def multiply(value, arg):
    return value * arg

@register.filter(name="min")
def minValue(a, b):
    return min(a, b)

@register.filter(name="mod")
def modValue(a, b):
    return a % b

@register.filter
def invertBoolean(value):
    return not value

@register.filter
def url2(a,b):
    return reverse(a, args=[b])

@register.filter
def isUrl(text):
    return text and URLValidator().regex.match(text) is not None

@register.filter
def isLoadable(url):
    if url.startswith("https://v.redd.it/"):
        return True
    else:
        return re.match(r'^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|svg)$', url) is not None

@register.filter
def textToHtmlNodes(text):
    return [dict(type="p", content=x) for x in text.split('\n\n')]