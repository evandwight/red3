import { useWindowSize } from "@react-hook/window-size";
import Gallery from "components/MediaElement/components/Gallery";
import React from "react";
import { useEffect, useRef, useState } from "react";
import { BsBoxArrowInUpRight } from "react-icons/bs";
import { findMediaInfo } from "../lib/utils";
import { IFrameImage, IFrameTweet, ImageWrapper } from './ImageWrapper';
// VideoHandler is large (uses mux.js) reduce initial bundle size by lazy loading
const VideoHandler = React.lazy(() => import('./VideoHandler'));

let regex = /([A-Z])\w+/g;
async function fileExists(url) {
    return true;
}

const Media = ({
    post,
    postMode = true,
    setShowSpinner,
}) => {
    const [windowWidth, windowHeight] = useWindowSize();
    const mediaRef = useRef<HTMLDivElement>(null);
    const [isGallery, setIsGallery] = useState(false);
    const [galleryInfo, setGalleryInfo] = useState([]);
    const [isImage, setIsImage] = useState(false);
    const [isMP4, setIsMP4] = useState(false);
    const [isTweet, setIsTweet] = useState(false);
    const [imageInfo, setImageInfo] = useState({ url: "", height: 0, width: 0 });
    const [videoInfo, setVideoInfo] = useState({
        url: "",
        height: 0,
        width: 0,
        hasAudio: false,
    });
    const [videoAudio, setvideoAudio] = useState("");
    const [mediaLoaded, setMediaLoaded] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const onLoaded = () => {
        setMediaLoaded(true);
        setShowSpinner(false);
    };

    const [isIFrame, setIsIFrame] = useState(false);
    const [iFrame, setIFrame] = useState<Element|null>();

    useEffect(() => {
        //
        return () => {
            setIsIFrame(false);
            setIFrame(null);
        };
    }, [post]);

    useEffect(() => {
        const DOMAIN = window?.location?.hostname ?? "menosmalo.com";
        const shouldLoad = () => {
            if (!post) return false;
            if (!post.url) return false;
            if (!post.title) return false;
            if (!post.subreddit) return false;
            return true;
        };

        const initialize = async () => {
            if (!post?.["mediaInfo"]) {
                let m = await findMediaInfo(post, false, DOMAIN);
                post["mediaInfo"] = m;
            }
            let a, b, c;
            if (post["mediaInfo"].isVideo && !post?.selftext_html) {
                b = await findVideo();
            }
            if (post["mediaInfo"].isIframe) {
                c = await findIframe();
            }
            if (!b && !post?.selftext_html) {
                a = await findImage();
            }
            a || b || c || post?.selftext_html ? setLoaded(true) : setLoaded(false);
        };

        const checkURL = (url) => {
            const placeholder =
                "https://www.publicdomainpictures.net/pictures/280000/velka/not-found-image-15383864787lu.jpg"; //"http://goo.gl/ijai22";
            //if (!url) return placeholder;
            if (!url?.includes("http")) return placeholder;
            return url;
        };

        const findAudio = async (url) => {
            let a: string = url;
            a = a.replace(regex, "DASH_audio");
            let status = await fileExists(a);
            //console.log(status);
            if (status) {
                setvideoAudio(a);
            } else {
                a = a.split("DASH")[0] + "audio";
                status = await fileExists(a);
                if (status) setvideoAudio(a);
                else setvideoAudio("");
            }
        };

        const findVideo = async () => {
            let optimize = "720";
            let url = "";

            if (post?.mediaInfo?.videoInfo) {
                url = post.mediaInfo.videoInfo.url;
                if (url.includes("DASH_1080")) {
                    url = url.replace("DASH_1080", `DASH_${optimize}`);
                }
                setVideoInfo({
                    url: url,
                    height: post.mediaInfo.videoInfo.height,
                    width: post.mediaInfo.videoInfo.width,
                    hasAudio: post.mediaInfo.videoInfo?.hasAudio,
                });
                await findImage();
                if (url.includes("v.redd.it")) {
                    findAudio(post.mediaInfo.videoInfo.url);
                }
                setIsMP4(true);
                setIsImage(false);
                return true;
            }
            return false;
        };

        const findIframe = async () => {
            if (post?.mediaInfo?.iFrameHTML) {
                setIFrame(post.mediaInfo.iFrameHTML);
                setIsIFrame(true);
                return true;
            } else {
                return false;
            }
        };

        const findImage = async () => {
            if (post.url.includes("twitter.com")) {
                setIsTweet(true);
                setIsIFrame(true);
                //return true;
            }

            if (post?.mediaInfo?.gallery) {
                setGalleryInfo(post.mediaInfo.gallery);
                setIsGallery(true);
                return true;
            } else if (post?.mediaInfo?.imageInfo) {
                let num = post.mediaInfo.imageInfo.length - 1;

                //choose smallest image possible
                let done = false;
                let width = windowWidth; // screen.width;
                post.mediaInfo.imageInfo.forEach((res, i) => {
                    if (!done) {
                        if (res.width > width) {
                            num = i;
                            done = true;
                        }
                    }
                });
                let imgheight = post.mediaInfo.imageInfo[num].height;
                let imgwidth = post.mediaInfo.imageInfo[num].width;
                setImageInfo({
                    url: checkURL(post.mediaInfo.imageInfo[num].url.replace("amp;", "")),
                    height: imgheight,
                    width: imgwidth,
                });
                setIsImage(true);
                return true;
                // }
            }
            return false;
        };

        if (shouldLoad()) {
            initialize();
        } else {
        }
        return () => {
            setIsGallery(false);
            setIsIFrame(false);
            setGalleryInfo([]);
            setIsImage(false);
            setIsMP4(false);
            setIsTweet(false);
            setImageInfo({ url: "", height: 0, width: 0 });
            setVideoInfo({ url: "", height: 0, width: 0, hasAudio: false });
            setMediaLoaded(false);
            setLoaded(false);
        };
    }, [post]);

    useEffect(()=>{
        if (isIFrame) {
            setShowSpinner(false);
        }
        if (!post?.mediaInfo?.isLink && !isImage && !isMP4 && !isIFrame && !isGallery) {
            setShowSpinner(false);
        }
    },[post, isImage, isMP4, isIFrame, isGallery, setShowSpinner]);

    let child;
    if (!loaded) {
        child = <></>
    } else if (!post?.mediaInfo?.isLink && !isImage && !isMP4 && !isIFrame && !isGallery) {
        child = <div>
            <a aria-label="external link"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center flex-grow gap-1 px-2 py-2 mt-auto text-xs bg-opacity-50 bg-black/80 text-th-link hover:text-th-linkHover "
                target={"_blank"}
                rel="noreferrer"
                href={post?.url}>
                <span className="opacity-100 ">{post?.url?.split("?")?.[0]}</span>
                <BsBoxArrowInUpRight className="flex-none w-6 h-6 ml-auto text-white group-hover:scale-110 " />
            </a>
        </div>
    } else if (isImage && !isIFrame && !isMP4) {
        child = <ImageWrapper {...{post, mediaLoaded, imageInfo, onLoadingComplete: onLoaded}} />
    } else if (isGallery) {
        child = <Gallery
          images={galleryInfo}
          maxheight={windowHeight*0.75}
          postMode={true}
          mediaRef={mediaRef}
          uniformHeight={false}
        />
    } else if (isTweet) {
        child = <IFrameTweet post={post}/>
    } else if (isIFrame && !isTweet) {
        child = <IFrameImage iFrame={iFrame} imgHeight={windowHeight*0.75}/>
    } else if (isMP4 && !isIFrame) {
        child = <div className="flex flex-col items-center flex-none ">
            <VideoHandler videoInfo={videoInfo} audio={videoAudio} onLoadingComplete={onLoaded}/>
        </div>
    } else {
        child = <div>Unknown media</div>
    }

    return <div className="block select-none group" ref={mediaRef}>
        {child}
    </div>
};

export default Media;
