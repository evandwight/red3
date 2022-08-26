import { IconLink } from "components/IconLink";
import { VoteButtons } from "components/Vote";
import { ReactComponent as DiscussLine } from 'svg/discuss-line.svg';
import { ReactComponent as LinkSvg } from 'svg/link.svg';
import { ReactComponent as RedditLine } from 'svg/reddit-line.svg';
import { ReactComponent as RefreshLine } from 'svg/refresh-line.svg';
import { ReactComponent as ReplyLine } from 'svg/reply-line.svg';
import TextSvg from 'svg/text.svg';
import { isValidHttpUrl, netloc, timeSinceShort, URL_DETAIL, URL_LOAD_REDDIT_COMMENTS, URL_SUBMIT_COMMENT } from "utils";


export function ListPost({ post, initialVotes, setters }) {
    return <div>
        <Tags post={post} />
        <div className="flex flex-row flex-wrap justify-start py-1">
            <Thumbnail post={post} />
            <div className="grow basis-1/2 sm:basis-4/5">
                <a href={URL_DETAIL(post.id)}>
                    {post.title}
                </a>
            </div>
        </div>
        <PostInfo post={post} />
        <PostButtons {... { post, initialVotes, setters, isFull: false }} />
    </div>
}



export function Thumbnail({ post }) {
    return <div className="px-2 grow basis-0 flex justify-center">
        {isValidHttpUrl(post.thumbnail)
            ? <a title="link" href={post.external_link}>
                <img loading="lazy" className="max-w-none h-min" width="70" height="70" src={post.thumbnail} alt="" />
            </a>
            : <img className="max-w-none h-min" width="70" height="70" src={TextSvg} alt="" />
        }
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

export function PostInfo({ post }) {
    return <div className="flex flex-row flex-wrap justify-around py-1 text-gray-500 text-center gap-x-1">
        <div className="md:w-1/5 text-center">{post.subreddit_name_prefixed || "mm"}</div>
        <div className="md:w-1/5 text-center">{post.user_name || "anon"}</div>
        <div className="md:w-1/5 text-center">{timeSinceShort(post.created)}</div>
        <div className="md:w-1/5 text-center">{netloc(post.external_link)}</div>
    </div>
}

export function PostButtons({ post, initialVotes, isFull }) {
    return <div className="sm:flex sm:flex-row sm:justify-end">
        <div className="flex flex-row justify-around py-1 sm:w-1/2 lg:w-1/3">
            <VoteButtons thing={post} initialVotes={initialVotes}/>
            <div id={`external-link-${post.id}`}><IconLink link={post.external_link} Img={LinkSvg} title="external link" /></div>
            <div id={`reddit-link-${post.id}`}><IconLink link={post.reddit_link} Img={RedditLine} title="reddit link" /></div>
            {!isFull &&
                <div><IconLink link={URL_DETAIL(post.id)} Img={DiscussLine} title="view comments" /></div>}
            {isFull &&
                <div><IconLink link={URL_SUBMIT_COMMENT(post.id)} Img={ReplyLine} title="submit comment" /> </div>}
            {isFull && !post.is_local &&
                <div><IconLink link={URL_LOAD_REDDIT_COMMENTS(post.id)} Img={RefreshLine} title="refresh comments" /></div>}
        </div>
    </div>
}

export function MediaElement({ post }) {
    const regex = /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|svg)$/
    if (regex.test(post.external_link)) {
        return <div className="w-full border-dashed border-gray-600 border-2 text-center">
            <img alt="" className="max-w-full max-h-screen mx-auto" src={post.external_link} />
        </div>
    }  else {
        return <></>;
    }
}

export function UserText({ text }) {
    return <>
        {text.split('\n\n').map((t, i) => <p key={i}>{t}</p>)}
    </>
}

export function FullPost({ post, initialVotes }) {
    return <div className="py-1 sm:py-4">
        <Tags post={post} />
        <MediaElement post={post} />
        <div className="flex flex-row flex-wrap justify-start py-1">
            <Thumbnail post={post} />
            <div className="grow basis-1/2 sm:basis-4/5">
                <a href={URL_DETAIL(post.id)}>
                    {post.title}
                </a>
            </div>
        </div>
        {post.text && <div className="w-3/4 mx-auto">
            <UserText text={post.text} />
        </div>}
        <PostInfo post={post} />
        <PostButtons {... { post, initialVotes, isFull: true }} />
    </div>
}