from django.db.models import F
from django.db.models.functions import Extract, Log, Greatest, Abs, Sign

ALL_LISTING_ORDER_BY = ((Extract(F("created"), 'epoch') - 1134028003)/45000 \
    + Log(10, Greatest(Abs(F("reddit_score") + F("score"))*2, 1))*Sign(F("reddit_score") + F("score"))) \
    .desc()