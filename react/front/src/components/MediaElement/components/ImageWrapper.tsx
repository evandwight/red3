import { TwitterTweetEmbed } from "react-twitter-embed";


const scrollStyle = " scrollbar-thin scrollbar-thumb-th-scrollbar scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full ";

export function ImageWrapper({ post, imageInfo, onLoadingComplete }) {
    return <img
        src={imageInfo.url}
        alt={post?.title}
        onLoad={onLoadingComplete}
        className={(post?.mediaInfo?.isTweet ? "object-contain  " : "") + " max-h-full max-w-full"}
    />
}

export function IFrameTweet({ post, onLoadingComplete }) {
    return <div className={`relative overflow-hidden bg-transparent ${scrollStyle}`}>
        <TwitterTweetEmbed
            options={{ theme: "dark", align: "center" }}
            tweetId={post.url.split("/")[post.url.split("/").length - 1].split("?")[0]}
            onLoad={onLoadingComplete}
        />
    </div>
}

export function IFrameImage({ iFrame }) {
    return <div className="relative w-full h-full" dangerouslySetInnerHTML={{ __html: iFrame.outerHTML }} />
}