import base64
import os
from datetime import datetime

import requests
from django import forms
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from main.tasks import updatePostCache
from main.utils import rateLimitByIp

from ..forms import CommentForm, PostForm
from ..models import Comment, Post


def hs_check_comment(comment):
  data = {
    "token": os.environ['MODERATE_HATE_SPEECH_TOKEN'],
    "text": comment
  }
  response = requests.post("https://api.moderatehatespeech.com/api/v1/toxic/", json=data).json()
  return response['response'] == "Success" and response["class"] == "flag" and float(response["confidence"]) > 0.9

@require_http_methods(["GET", "POST"])
def submitPost(request):
    renderForm = lambda form: render(request, 'main/submitPost.html', {'form': form})

    if not request.method == 'POST':
        return renderForm(PostForm())
    else:
        limitReponse = rateLimitByIp(request, 'submitPostRequest', 5)
        if limitReponse:
            return limitReponse

        form = PostForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data['title']
            text = form.cleaned_data['text']
            link = form.cleaned_data['link']
            oldContentHash = form.cleaned_data["contentHash"]
            overrideMean = form.cleaned_data['overrideMeanTag']

            combinedContent = f'{title}\n{text}'

            mean = hs_check_comment(combinedContent)

            newContentHash = base64.b64encode(combinedContent.encode('ascii'))

            if not str(newContentHash) == str(oldContentHash) and mean:
                form = PostForm(request.POST.dict() | {'contentHash': newContentHash})
                form.add_error(None,"Warning: mean. Change your submission, override the tag or submit anyways")
                form.fields['overrideMeanTag'].widget = forms.widgets.CheckboxInput()
                return renderForm(form)

            limitReponse = rateLimitByIp(request, 'submitPostSave', 1)
            if limitReponse:
                return limitReponse

            dbPost = Post(
                title = title,
                text = text,
                external_link = link,
                created = datetime.now(tz=timezone.utc),
                is_local = True,
                user_name = request.user.username,
                mean = mean or overrideMean,
                override_mean = overrideMean,
            )
            dbPost.save()
            updatePostCache.delay('new')
            return HttpResponseRedirect(reverse('main:detail', kwargs={'pk':dbPost.id}))

@require_http_methods(["GET", "POST"])
def submitComment(request, postId, commentId=None):
    renderForm = lambda form: render(request, 'main/submitComment.html', {'form': form, 'postId': postId, 'commentId': commentId})

    if not request.method == 'POST':
        return renderForm(CommentForm())
    else:
        limitReponse = rateLimitByIp(request, 'submitCommentRequest', 5)
        if limitReponse:
            return limitReponse

        form = CommentForm(request.POST)
        if form.is_valid():
            text = form.cleaned_data['text']
            oldContentHash = form.cleaned_data["contentHash"]
            mean = hs_check_comment(text)
            overrideMean = form.cleaned_data['overrideMeanTag']

            newContentHash = base64.b64encode(text.encode('ascii'))
            if not newContentHash == oldContentHash and mean:
                form = CommentForm(request.POST.dict() | {'contentHash': newContentHash})
                form.add_error(None,"Warning: mean. Change your comment, override the tag or submit anyways")
                form.fields['overrideMeanTag'].widget = forms.widgets.CheckboxInput()
                return renderForm(form)

            limitReponse = rateLimitByIp(request, 'submitCommentSave', 1)
            if limitReponse:
                return limitReponse

            if commentId is None:
                parent = None
                post = Post.objects.get(id=postId)
            else:
                parent = Comment.objects.get(id=commentId)
                post = parent.post_id
            
            dbComment = Comment(
                text = text,
                created = datetime.now(tz=timezone.utc),
                parent_id = parent,
                post_id = post,
                removed_from_reddit = False,
                is_local = True,
                user_name = request.user.username,
                mean = mean or overrideMean,
                override_mean = overrideMean,
            )
            dbComment.save()
            return HttpResponseRedirect(reverse('main:detail', kwargs={'pk':postId}))
