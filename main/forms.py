from django import forms
from django.forms import ModelForm
from .models import Profile
from django.core.exceptions import ValidationError

class PostForm(forms.Form):
    title = forms.CharField(label='Title' , max_length=2000,\
        widget=forms.Textarea(attrs={'class': 'w-full h-24 text-black', 'autofocus': True}))
    text = forms.CharField(label='Text' , max_length=5000, required=False,\
        widget=forms.Textarea(attrs={'class': 'w-full h-64 text-black'}))
    link = forms.URLField(label='Link' , max_length=2000, required=False)
    overrideMeanTag = forms.BooleanField(widget=forms.HiddenInput(), label='Override mean tag', required=False)
    contentHash = forms.CharField(widget=forms.HiddenInput(), required=False)

class CommentForm(forms.Form):
    text = forms.CharField(label='Text' , max_length=5000,\
        widget=forms.Textarea(attrs={'class': 'w-full h-64 text-black', 'autofocus': True}))
    overrideMeanTag = forms.BooleanField(widget=forms.HiddenInput(), label='Override mean tag', required=False)
    contentHash = forms.CharField(widget=forms.HiddenInput(), required=False)

class SearchForm(forms.Form):
    searchTerm = forms.CharField(label='Search for reddit id or url' , max_length=5000)

class ProfileForm(ModelForm):
    class Meta:
        model = Profile
        fields = ['show_nsfw', "show_mean"]