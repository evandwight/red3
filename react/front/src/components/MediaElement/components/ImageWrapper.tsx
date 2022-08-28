import { AiOutlineTwitter } from "react-icons/ai";
import { ImSpinner2 } from "react-icons/im";
import { BsBoxArrowInUpRight } from "react-icons/bs";
import { TwitterTweetEmbed } from "react-twitter-embed";


const scrollStyle = " scrollbar-thin scrollbar-thumb-th-scrollbar scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full ";

export function ImageWrapper({ post, mediaLoaded, imageInfo, onLoadingComplete }) {
    const externalLink = (
        <a
            aria-label="external link"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-grow items-center gap-1 px-0.5 py-2 mt-auto text-xs text-th-link hover:text-th-linkHover bg-black/80 md:bg-black/0 md:group-hover:bg-black/80 bg-opacity-50 "
            target={"_blank"}
            rel="noreferrer"
            href={post?.url}
        >
            <span className="ml-2 md:opacity-0 group-hover:opacity-100">
                {post?.url?.split("?")?.[0]}
            </span>
            <BsBoxArrowInUpRight className="flex-none w-6 h-6 ml-auto mr-2 text-white group-hover:scale-110 " />
        </a>
    );

    return (
        <div className="flex items-center justify-center relative overflow-hidden">
            {post?.mediaInfo?.isTweet && (
                <div className="absolute flex w-full h-full bg-[#1A8CD8] rounded-lg  ">
                    <AiOutlineTwitter className="absolute z-20 right-2 top-2 w-10 h-10 fill-[#E7E5E4] group-hover:scale-125 transition-all " />
                </div>
            )}
            {post?.mediaInfo?.isLink && (
                <div
                    className={
                        "absolute bottom-0 z-20 flex items-end w-full overflow-hidden break-all " +
                        (post?.mediaInfo?.isTweet ? " rounded-b-lg " : "")
                    }
                >
                    {externalLink}
                </div>
            )}
            <img
                src={imageInfo.url}
                alt={post?.title}
                onLoad={onLoadingComplete}
                className={(post?.mediaInfo?.isTweet ? "object-contain  " : "") + " max-w-full max-h-screen mx-auto"}
            />
        </div>
    )
}

export function IFrameTweet({ post }) {
    return <div className={`bg-transparent ${scrollStyle}`}>
        <TwitterTweetEmbed
            placeholder={
                <div className="relative mx-auto border rounded-lg border-th-border w-60 h-96 animate-pulse bg-th-base">
                    <div className="absolute w-full h-full">
                        <AiOutlineTwitter className="absolute w-7 h-7 right-2 top-2 fill-[#1A8CD8]" />
                    </div>
                </div>
            }
            options={{theme: "dark",align: "center",}}
            tweetId={post.url.split("/")[post.url.split("/").length - 1].split("?")[0]}
        />
    </div>
}

export function IFrameImage({iFrame, imgHeight}) {
    return <div className={"relative w-full"} style={{height:`${imgHeight}px`}}>
        <div className="w-full h-full max-h-[75vh]"
            dangerouslySetInnerHTML={{ __html: iFrame.outerHTML }}
        ></div>
    </div>
}