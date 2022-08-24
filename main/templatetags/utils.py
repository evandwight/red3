from django import template
from datetime import datetime, timezone
from django.urls import reverse
from django.utils.html import format_html
from urllib.parse import urlparse
import re

register = template.Library()