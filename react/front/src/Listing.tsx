
import axios from 'axios';
import { ReactComponent as DownArrow } from './svg/arrow-down-line.svg';
import { ReactComponent as LeftArrow } from './svg/arrow-left-line.svg';
import { ReactComponent as RightArrow } from './svg/arrow-right-line.svg';
import { ReactComponent as UpArrow } from './svg/arrow-up-line.svg';
import { ReactComponent as DiscussLine } from './svg/discuss-line.svg';
import { ReactComponent as LinkSvg } from './svg/link.svg';
import { ReactComponent as RedditLine } from './svg/reddit-line.svg';
import TextSvg from './svg/text.svg';


export function URL_DETAIL(id) {
    return `/${id}/`;
}

export function URL_UPVOTE(id) {
    return `/upvote/${id}/`;
}

export function URL_DNVOTE(id) {
    return `/dnvote/${id}/`;
}

const PAGE_SIZE = 25;

export function Listing({ posts, votes, profile, page, setters }) {
    const filteredPosts = posts.filter(post => (
        (!post.mean || profile.show_mean)
        && (!post.nsfw || profile.show_nsfw)));
    const pagedPosts = filteredPosts.filter((_, i) => i >= (page - 1) * PAGE_SIZE && i < page * PAGE_SIZE)

    const numPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
    const hasPrevPage = page > 1;
    const hasNextPage = page < numPages;

    if (pagedPosts.length === 0) {
        return <p>No posts are available</p>
    } else {
        return <>
            <ul className="divide-y divide-gray-500">
                {pagedPosts.map((post, i) => <Post key={i} {... { post, votes, setters }} />)}
            </ul>
            <hr className="border-gray-500" />
            <div className="pagination">
                <div className="flex flex-row items-center justify-center">
                    <button title="previous page" onClick={() => setters.updatePage(page - 1)} disabled={!hasPrevPage}>
                        <LeftArrow style={{ fill: (hasPrevPage ? "#d946ef" : "#E5E7EB") }} className="w-6" />
                    </button>
                    <div>
                        page {page} of {numPages}
                    </div>
                    <button title="next page" onClick={() => setters.updatePage(page + 1)} disabled={!hasNextPage}>
                        <RightArrow style={{ fill: (hasNextPage ? "#d946ef" : "#E5E7EB") }} className="w-6" />
                    </button>

                </div>
            </div>
        </>
    }
}

function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

export function timeSinceShort(value: Date) {
    let seconds = Math.floor((new Date().getTime() - new Date(value).getTime()) / 1000);
    let days = seconds / 86400;
    if (days > 365) {
        return `${(days / 365).toFixed(1)}y`;
    } else if (days >= 1) {
        return `${days.toFixed(1)}d`;
    } else {
        return `${(seconds / 3600).toFixed(1)}h`;
    }
}

export function netloc(text) {
    if (!text) {
        return 'self';
    } else {
        try {
            let url = new URL(text);
            return url.hostname;
        } catch (_) {
            return 'unknown';
        }
    }
}

export function getCsrfToken() {
    return (document.querySelector('[name=csrfmiddlewaretoken]') as any)?.value;
}


function vote(post, isUpVote, updateVote) {
    updateVote(post.thing_uuid, isUpVote);
    axios.post(URL_UPVOTE(post.thing_uuid), {}, { headers: { 'X-CSRFToken': getCsrfToken() } })
        .then(result => {
            if (result.data.reload) {
                window.location.reload();
            }
        }).catch(err => console.error(err))

}
export function Post({ post, votes, setters }) {
    const voteDirection = votes ? votes[post.thing_uuid] : null;
    const disableVote = !votes;
    return <div>
        <Tags post={post} />
        <div className="flex flex-row flex-wrap justify-start py-1">
            <div className="px-2 grow basis-0 flex justify-center">
                {isValidHttpUrl(post.thumbnail)
                    ? <a href={post.external_link}>
                        <img loading="lazy" className="max-w-none h-min" width="70" height="70" src={post.thumbnail} alt="" />
                    </a>
                    : <img className="max-w-none h-min" width="70" height="70" src={TextSvg} alt="" />
                }
            </div>
            <div className="grow basis-1/2 sm:basis-4/5">
                <a href={URL_DETAIL(post.id)}>
                    {post.title}
                </a>
            </div>
        </div>
        <div className="flex flex-row flex-wrap justify-around py-1 text-gray-500 text-center gap-x-1">
            <div className="md:w-1/5 text-center">{post.subreddit_name_prefixed || "mm"}</div>
            <div className="md:w-1/5 text-center">{post.user_name || "anon"}</div>
            <div className="md:w-1/5 text-center">{timeSinceShort(post.created)}</div>
            <div className="md:w-1/5 text-center">{netloc(post.external_link)}</div>
        </div>
        <div className="sm:flex sm:flex-row sm:justify-end">
            <div className="flex flex-row justify-around py-1 sm:w-1/2 lg:w-1/3">
                <button title="up vote" onClick={() => vote(post, true, setters.updateVote)} disabled={disableVote}>
                    <UpArrow style={{ fill: (voteDirection === "UP" ? "#F97316" : "#d946ef") }} className="w-6" />
                </button>
                <button title="down vote" onClick={() => vote(post, false, setters.updateVote)} disabled={disableVote}>
                    <DownArrow style={{ fill: (voteDirection === "DN" ? "#F97316" : "#d946ef") }} className="w-6" />
                </button>
                <div id={`external-link-${post.id}`}><IconLink link={post.external_link} Img={LinkSvg} title="external link" /></div>
                <div id={`reddit-link-${post.id}`}><IconLink link={post.reddit_link} Img={RedditLine} title="reddit link" /></div>
                <div><IconLink link={URL_DETAIL(post.id)} Img={DiscussLine} title="view comments" /></div>

            </div>
        </div>
    </div>
}

export function Tags({ post }) {
    const TAG_FIELDS = ['nsfw', 'mean', 'reddit_locked'];
    const activeFields = TAG_FIELDS.filter(field => post[field]);
    if (activeFields.length > 0) {
        return <div className="flex flex-row justify-around flex-wrap py-1">
            {activeFields.map((field, i) => <div key={i} className="text-red-600">{field}</div>)}
        </div>
    } else {
        return <></>;
    }
}

export function IconLink({ link, Img, title }) {
    const imgEle = <Img style={{ fill: (link ? "#d946ef" : "#E5E7EB") }} className="w-6" width={24} height={24} />;
    if (link) {
        return <a title={title} href={link}>
            {imgEle}
        </a>
    } else {
        return <>{imgEle}</>;
    }
}