from django.urls import path
from django.views.generic import RedirectView
from django.views.generic.base import TemplateView

from .views import api, submit, views, vote

app_name = 'main'

urlpatterns = [
    path('robots.txt', TemplateView.as_view(template_name="main/robots.txt", content_type="text/plain")),
    path('', RedirectView.as_view(url='/listing/sort=hot'), name='index'),
    path('listing/sort=<str:sort>', views.listingNew, name='listingSort'),
    path('sortListing', views.sortListings, name='sortListing'),
    path('details/post=<int:pk>/', views.postDetails, name='detail'),
    path('submitPost/', submit.submitPost, name='submitPost'),
    path('submitComment/<int:postId>/<int:commentId>/', submit.submitComment, name='submitComment'),
    path('submitComment/<int:postId>/', submit.submitComment, name='submitComment'),
    path('profile', views.editProfile, name='profile'),
    path('upvote/<str:pk>/', vote.upvote, name='upvote'),
    path('downvote/<str:pk>/', vote.downvote, name='downvote'),
    path('search', views.search, name='search'),
    path('api/listing/sort=<str:sort>', api.postsJson, name="apiPosts"),
    path('api/details/post=<int:pk>', api.postJson, name="apiPostDetails"),
    path('api/comments/post=<int:pk>', api.commentsJson, name="apiComments"),
    path('api/votes', api.votesJson, name="apiVotes"),
    path('api/profile', api.profileJson, name="apiProfile"),
    path('api/loadRedditComments/<int:pk>', api.loadRedditComments, name='loadRedditComments'),
    path('api/viewTask/<str:pk>', api.viewTask, name='viewTask'),
    path('api/loadRedditPost/<slug:pk>', api.loadRedditPost, name='loadRedditPost'),
]
