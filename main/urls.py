from django.urls import path
from django.views.generic import RedirectView
from django.views.generic.base import TemplateView
from .views import views, submit, vote, comment


app_name = 'main'

urlpatterns = [
    path('robots.txt', TemplateView.as_view(template_name="main/robots.txt", content_type="text/plain")),
    path('', RedirectView.as_view(url='/listing/sort=hot'), name='index'),
    path('listing/sort=<str:sort>', views.listingNew, name='listingSort'),
    path('sortListing', views.sortListings, name='sortListing'),
    path('<int:pk>/', comment.postDetails, name='detail'),
    path('loadRedditComments/<int:pk>/', views.loadRedditComments, name='loadRedditComments'),
    path('submitPost/', submit.submitPost, name='submitPost'),
    path('submitComment/<int:postId>/<int:commentId>/', submit.submitComment, name='submitComment'),
    path('submitComment/<int:postId>/', submit.submitComment, name='submitComment'),
    path('profile', views.editProfile, name='profile'),
    path('viewTask/<str:pk>/', views.viewTask, name='viewTask'),
    path('upvote/<str:pk>/', vote.upvote, name='upvote'),
    path('downvote/<str:pk>/', vote.downvote, name='downvote'),
    path('search', views.search, name='search'),
]