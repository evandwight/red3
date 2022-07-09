from django.urls import path
from .views import views, submit, vote, comment


app_name = 'main'

urlpatterns = [
    path('', views.listing, name='index'),
    path('<int:pk>/', comment.postDetails, name='detail'),
    path('loadRedditComments/<int:pk>/', views.loadRedditComments, name='loadRedditComments'),
    path('submitPost/', submit.submitPost, name='submitPost'),
    path('submitComment/<int:postId>/<int:commentId>/', submit.submitComment, name='submitComment'),
    path('submitComment/<int:postId>/', submit.submitComment, name='submitComment'),
    path('profile', views.editProfile, name='profile'),
    path('viewTask/<str:pk>/', views.viewTask, name='viewTask'),
    path('upvote/<str:pk>/', vote.upvote, name='upvote'),
    path('downvote/<str:pk>/', vote.downvote, name='downvote'),
]