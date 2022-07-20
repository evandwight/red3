from django.contrib import admin
from main.models import Post, User, Profile, Comment, Vote

# Register your models here.
admin.site.register(Profile)

class ProfileInline(admin.StackedInline):
    model = Profile

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    inlines = [ProfileInline,]

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_filter = ('is_local', "override_mean")

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_filter = ('is_local', "override_mean")
    readonly_fields = ('parent_id', 'post_id')

admin.site.register(Vote)