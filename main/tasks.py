from celery import shared_task
import praw
from datetime import datetime, timezone, timedelta
from psaw import PushshiftAPI
import logging
from main.models import Post, Comment
import os
from django.db.models import Q, F
from main.views.utils import ALL_LISTING_ORDER_BY
                

logger = logging.getLogger(__name__)
 
nsfwSubreddits = 'gonewild+hentai+rule34+RealGirls+AsiansGoneWild+nsfw+PetiteGoneWild+ImGoingToHellForThis+gonewild30plus+NSFW_GIF+futanari+adorableporn+LegalTeens+BustyPetite+JizzedToThis+cumsluts+traps+TittyDrop+BiggerThanYouThought+GaybrosGoneWild+chubby+MassiveCock+yiff+BigBoobsGW+celebnsfw+pawg+JerkOffToCelebs+pussy+bigasses+thighdeology+collegesluts+ecchi+jobuds+ladybonersgw+milf+porn+GWCouples+BBW+ass+GodPussy+NSFWFunny+bigtiddygothgf+WouldYouFuckMyWife+darkjokes+holdthemoan+GirlsFinishingTheJob+HENTAI_GIF+MonsterGirl+nsfw_gifs+Baddieshub+OnOff+FemBoys+BreedingMaterial+Blowjobs+gonewildcurvy+kpopfap+workgonewild+anal+juicyasians+twinks+traphentai+Hotwife+WatchItForThePlot+TinyTits+AnimeMILFS+Overwatch_Porn+CuteLittleButts+Stacked+18_19+VerticalGifs+AsianHotties+trashyboners+palegirls+boobs+AzurLewd+cock+Amateur+bodyperfection+curvy+porninfifteenseconds+LabiaGW+paag+asstastic+Sissies+gonewildcolor+feet+LipsThatGrip+Ebony+suicidegirls+wincest+thick+AnalGW+hugeboobs+2busty2hide+assholegonewild+penis+Cuckold+Nudes+HappyEmbarrassedGirls+fitgirls+DadsGoneWild+HentaiBeast+onmww+bimbofetish+RealAhegao+IndiansGoneWild+wifesharing+Tgirls+nsfwhardcore+asshole+PreggoPorn+gwcumsluts+GoneWildPlus+altgonewild+ratemycock+gfur+Rule34LoL+Hotchickswithtattoos+normalnudes+grool+Shemales+Nude_Selfie+TooCuteForPorn+gonewildchubby+lesbians+JessicaNigri+xsmallgirls+GoneMild+latinas+boobbounce+bigtitsinbikinis+TotallyStraight+hentaimemes+burstingout+dirtykikpals+40plusGoneWild+DarkAngels+bois+transporn+bdsm+hardbodies+gwpublic+ghostnipples+Celebswithbigtits+deepthroat+IndianBabes+PokePorn+DeliciousTraps+Boobies+MorbidReality+gonewildcouples+Gonewild18+MedicalGore+Fire_Emblem_R34+BokuNoEroAcademia+tightdresses+gentlefemdom+ginger+biggerthanherhead+ThickDick+amateurgirlsbigcocks+WomenOfColor+amazingtits+theratio+foreskin+GoneWildTrans+buttplug+Upskirt+tanlines+lingerie+rearpussy+AnimeBooty+BadDragon+aa_cups+damngoodinterracial+freeuse+girlsinyogapants+BDSMGW+dykesgonewild+SlimThick+hotclub+PLASTT+HairyPussy+homegrowntits+PublicBoys+yuri+Sextrophies+UnderwearGW+AnimeFeet+dirtysmall+GoneWildHairy+SexyTummies+wholesomehentai+FitNakedGirls+RWBYNSFW+besthqporngifs+broslikeus+StraightGirlsPlaying+HugeHangers+Bulges+ShinyPorn+gothsluts+gaymersgonewild+AgedBeauty+hentaibondage+dirtypenpals+pantsu+ItsAmateurHour+bigonewild+Afrodisiac+PublicSexPorn+BigBoobsGonewild+gonewildaudio+squirting+Tentai+sexygirls+FestivalSluts+redheads+Misogynyfetish+GirlswithGlasses+phgonewild+NostalgiaFapping+JiggleFuck+mangonewild+DegradingHoles+animemidriff+JustHotWomen+Sexsells+ahegao+WhyEvenWearAnything+ButtsAndBareFeet+gaybears+WesternHentai+gayporn+NSFW_Japan+monsterdicks+wifepictrading+GoneWildCD+bigareolas+GuysFromBehind+Sissyperfection+Bondage+Natureisbrutal+GaySnapchat+hentai_irl+whenitgoesin+fortyfivefiftyfive+gettingherselfoff+nsfwcosplay+BigAnimeTiddies+couplesgonewild+PornStarletHQ+RateMyNudeBody+CosplayLewd+cleavage+thick_hentai+EngorgedVeinyBreasts+bigdickgirl+u_predsgirl92+blackchickswhitedicks+quiver+UpvotedBecauseButt+Sabrina_Nichole+Ifyouhadtopickone+FrogButt+SheLikesItRough+FlashingAndFlaunting+simps+gonewildstories+Teenboysgonewild+HugeDickTinyChick+ShemalesParadise+GoneWildSmiles+xxxcaptions+CelebrityButts+cuckoldcaptions+SluttyConfessions+PublicFlashing+STAWG+TrueFMK+Beardsandboners+Thicker+amateurcumsluts+NSFWBarista+bowsette+AssholeBehindThong+RedditorCum+IWantToSuckCock+slutwife+GabbieCarter+SnowWhites+Shadman+pelfie+AskRedditAfterDark+Innie+transformation+creampies+GWNerdy+cumfetish+Swingersgw+AngelaWhite+ThickThighs+GodAsshole+porn_gifs+RileyReid+ConfusedBoners+cosplaybutts+girlskissing+Artistic_Hentai+WrestleFap+sissycaptions+HungryButts+fuckdoll+BBW_Chubby+celebJObuds+Incest_Gifs+suctiondildos+facedownassup+lanarhoades+AutumnFalls+Balls+TessaFowler+MassiveTitsnAss+2Booty+ratemyboobs+treesgonewild+iwanttobeher+RepressedGoneWild+bustyasians+Pornheat+AvaAddams+AsianNSFW+Femdom+canthold+chastity+AreolasGW+Hitomi_Tanaka+tits+grailwhores+AssVsBoobs+boltedontits+assinthong+Workoutgonewild+SexInFrontOfOthers+SpreadEm+AmazingCurves+GroupOfNudeGirls+Humongousaurustits+AsianCuties+nude_snapchat+dirtyr4r+seethru+RetrousseTits+FurryPornSubreddit+Naruto_Hentai+TeensNSFW+pokies+chesthairporn+Pegging+Men2Men+momson+ChavGirls+BonerMaterial+Stuffers+femyiff+sissykik+ondww+HentaiSource+nsfwoutfits+CuteGuyButts+booty+SocialMediaSluts+doujinshi+GloryHo+RemyLaCroix+BBCparadise+IWantToBeHerHentai+GirlswithNeonHair+GoneWildScrubs+coltish+gifsgonewild+AdultNeeds+BBCSluts+randomsexiness+softies+whooties+CutCocks+CollegeAmateurs+LatinasGW+ddlg+cameltoe+GWAustralia+fitdrawngirls+NakedAdventures+RealPublicNudity+Tgifs+smallboobs+StormiMaya+petite+MiaMalkova+classysexy+DDLCRule34+Puffies+sources4porn+handholding+amateur_milfs+sissyhypno+DemiRoseMawby+VerifiedAmateurs+LiyaSilver+HotStuffNSFW+spreadeagle+LenaPaul+NekoIRL+Playboy+The_Best_NSFW_GIFS+Slut+torpedotits+fuckmeat+asiangirlswhitecocks+NieceWaidhofer+TheLostWoods+FauxBait+EraserNipples+Rule34Overwatch+hentaicaptions+HighMileageHoles+lactation+Nipples+1000ccplus+gilf+FaceFuck+littlespace+PantyPeel+Perfectdick+ssbbw+NSFWBOX+GonewildGBUK+FunWithFriends+SexyFrex+tanime+BBWGW+Slutoon+ChurchOfTheBBC+sarah_xxx+YouTubersGoneWild+u_PandoraNyxie+bikinis+BoobsBetweenArms+snapleaks+AgeplayPenPals+CumHentai+CheatingSluts+ThickChixxx+AsianGuysNSFW+OppaiLove+LingerieGW+stockings+maturemilf+Jia_Lissa+twerking+stupidslutsclub+AmateurPorn+60fpsporn+OldSchoolCoolNSFW+javdreams+Hentai4Everyone+guro+BreastEnvy+DrunkDrunkenPorn+manass+pornID+BrownHotties+downblouse+distension+piercednipples+NSFW_Snapchat+HorsecockFuta+FtMPorn+nextdoorasians+tightywhities+jacking+CamSluts+TributeMe+GayChubs+usedpanties+furryporn+NSFWfashion+ShinMegamiHentai+NSFWverifiedamateurs+BaileyJay+tipofmypenis+GoneErotic+CelebrityCandids+BestPornInGalaxy+PornStarHQ+SexyButNotPorn+GayGifs+HentaiParadise+BonersInPublic+KylieJenner+gayotters+FuckingPerfect+YogaPants+thighhighs+BBCsissies+EmilyBloom+ProgressiveGrowth+gaynsfw+HoleWreckers+PornMemes+CedehsHentai+LingeriePlus+ChiveUnderground+OnOffCelebs+creampie+anal_gifs+traaNSFW+yaoi+BestTits+DadsAndBoys+RealHomePorn+WhiteCheeks+Ahegao_IRL+mila_azul+Break_Yo_Dick_Thick+stripgirls+nudesfeed+gaystoriesgonewild+TheEroticSalon+Pee+SoHotItHurts+Breeding+jilling+UpskirtHentai+ChangingRooms+PantiesToTheSide+cumflation+NataLee+DirtySnapchat+Dbz34+BreakingTheSeal+FacialFun+CasualJiggles+Anal_witch+legs+FootFetish+O_Faces+Paizuri+braless+BoutineLA+AlexisTexas+Feet_NSFW+ElsaJean+Rule34RainbowSix+SissyChastity+AmateurSlutWives+ClopClop+titfuck+cheatingwives+datgap+Ohlympics+swingersr4r+Fay_Suicide+AdrianaChechik+pronebone+ChubbyDudes+FilthyGirls+NSFW411+Alisai+Lesbian_gifs+abelladanger+Ratemypussy+TeenTitansPorn+SexyFlightAttendants_+CarlieJo+Page3Glamour+ThotClub+HighResNSFW+Evalovia+Adult_Social_Network+PerkyChubby+WaifusOnCouch+cuteasfuckbutclothed+Exxxtras+Hotwifecaption+thickloads+MalesMasturbating+RandomActsOfBlowJob+raceplay+unexpectedtitty+CheatingCaptions+TheMomNextDoor+nsfwanimegifs+IrinaSabetskaya+throatbarrier+hentaifemdom+dillion_harper+Bottomless_Vixens+collared'

reddit = praw.Reddit(
    client_id=os.environ['REDDIT_ID'],
    client_secret=os.environ['REDDIT_SECRET'],
    user_agent="linux:NA:1 (by u/evandwight)",
)

pushshift = PushshiftAPI()

@shared_task
def updateAllListing():
    sfwPosts = list(reddit.subreddit("all").hot(limit=500))
    nsfwPosts = list(reddit.subreddit(nsfwSubreddits).hot(limit=100))
    all = sfwPosts + nsfwPosts
    for redditPost in all:
        id = redditPost.id
        if Post.objects.filter(reddit_id=id).exists():
            dbPost = Post.objects.get(reddit_id= id)
            dbPost.reddit_score = redditPost.score
            dbPost.upvote_ratio = redditPost.upvote_ratio
            dbPost.reddit_locked = redditPost.locked
        else:
            dbPost = Post(
                reddit_id=id, 
                title=redditPost.title, 
                created=datetime.fromtimestamp(redditPost.created_utc, tz=timezone.utc),
                reddit_score=redditPost.score,
                upvote_ratio=redditPost.upvote_ratio,
                reddit_link="https://reddit.com" + redditPost.permalink,
                external_link=redditPost.url,
                subreddit_name_prefixed=redditPost.subreddit_name_prefixed,
                user_name=(redditPost.author and redditPost.author.name) or "reddit-anon",
                nsfw=redditPost.over_18,
                text=redditPost.selftext,
                thumbnail=redditPost.thumbnail,
                reddit_locked = redditPost.locked
                )
        dbPost.save()
    
def getComments(submissionId):
    comments = reddit.submission(submissionId).comments
    comments.replace_more(limit=0)
    comments = comments.list()
    for i, comment in enumerate(comments):
        if comment.score_hidden:
            comment.score = len(comments) - i
    return comments

def isCommentRemoved(comment):
    return comment.body == '[removed]' and comment.author is None

@shared_task
def updateRedditComments(id):
    post = Post.objects.get(id=id)
    if post.is_local:
        return
    comments = getComments(post.reddit_id)
    comments.sort(key=lambda comment: comment.depth)
    removedComments = []
    for comment in comments:
        dbComment = Comment.objects.filter(reddit_id = comment.id).first()
        if dbComment:
            dbComment.reddit_score = comment.score
            dbComment.removed_from_reddit = isCommentRemoved(comment)
        else:    
            parent_id = comment.parent_id
            parentComment = Comment.objects.get(reddit_id = parent_id[3:]) if parent_id.startswith("t1_") else None
            removedFromReddit = isCommentRemoved(comment)
            dbComment = Comment(
                text = comment.body,
                created = datetime.fromtimestamp(comment.created_utc, tz=timezone.utc),
                reddit_id = comment.id,
                reddit_score = comment.score,
                reddit_link = comment.permalink,
                parent_reddit_id = comment.parent_id,
                user_name = str(comment.author),
                post_id = post,
                parent_id = parentComment,
                removed_from_reddit = removedFromReddit,
                nsfw = False,
                mean = False,
                extra = {},
            )
            if removedFromReddit:
                removedComments.append(comment.id)
        dbComment.save()

    if len(removedComments) > 0:
        if len(removedComments) > 100:
            logger.warning('Too many removed comments to load from pushshift')
            removedComments = removedComments[:100]    
        pushshiftRemovedComments = list(pushshift.search_comments(ids=removedComments, limit=100, metadata=True))
        for psComment in pushshiftRemovedComments:
            dbComment = Comment.objects.filter(reddit_id = psComment.id).first()
            if dbComment:
                dbComment.text = psComment.body
                dbComment.user_name = psComment.author
                dbComment.removed_from_reddit = True
                dbComment.save()
    
    post.comment_update_time = datetime.now(tz=timezone.utc)
    post.save(update_fields=["comment_update_time"])


@shared_task
def updateSomeComments():
    hoursAgo = lambda hours: datetime.now(tz=timezone.utc) - timedelta(hours=hours)
    topIds = Post.objects.order_by(ALL_LISTING_ORDER_BY).values_list('id', flat=True)[:25]
    ids = Post.objects.filter((Q(comment_update_time__isnull=True) 
        | Q(comment_update_time__lt=hoursAgo(4)))
        & Q(created__gt=hoursAgo(12))
        & Q(id__in=topIds)) \
        .order_by(F('comment_update_time').asc(nulls_last=False)) \
        .values_list('id', flat=True)[:1]
    for id in ids:
        updateRedditComments(id)