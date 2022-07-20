from django.contrib import admin
from main.models import Post, User, Profile, Comment, Vote
# Register your models here.
admin.site.register(User)
admin.site.register(Profile)

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_filter = ('is_local', "override_mean")

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_filter = ('is_local', "override_mean")
    readonly_fields = ('parent_id', 'post_id')

admin.site.register(Vote)