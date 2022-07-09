from datetime import datetime
from django.utils import timezone
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from ..models import Post, Comment
from ..forms import PostForm, CommentForm
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django import forms
import base64
import requests
import os
                
def hs_check_comment(comment):
  data = {
    "token": os.environ['MODERATE_HATE_SPEECH_TOKEN'],
    "text": comment
  }
  response = requests.post("https://api.moderatehatespeech.com/api/v1/toxic/", json=data).json()
  return response['response'] == "Success" and response["class"] == "flag" and float(response["confidence"]) > 0.9


def submitPost(request):
    renderForm = lambda form: render(request, 'main/submitPost.html', {'form': form})

    if not request.method == 'POST':
        return renderForm(PostForm())
    else:
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
            return HttpResponseRedirect(reverse('main:detail', kwargs={'pk':dbPost.id}))

def submitComment(request, postId, commentId=None):
    renderForm = lambda form: render(request, 'main/submitComment.html', {'form': form, 'postId': postId, 'commentId': commentId})

    if not request.method == 'POST':
        return renderForm(CommentForm())
    else:
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