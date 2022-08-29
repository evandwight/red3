import Gallery from "components/MediaElement/components/Gallery";
import type { RedditMediaState } from "components/MediaElement/lib/redditMediaState";
import { getRedditMediaState } from "components/MediaElement/lib/redditMediaState";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ReactComponent as LinkSvg } from 'svg/link.svg';

import { IFrameImage, IFrameTweet, ImageWrapper } from './ImageWrapper';
// VideoHandler is large (uses mux.js) reduce initial bundle size by lazy loading
const VideoHandler = React.lazy(() => import('./VideoHandler'));

const Media = ({
    post,
    setShowSpinner,
    containerSize,
}) => {
    const mediaRef = useRef<HTMLDivElement>(null);
    const [redditMediaState, setRedditMediaState] = useState<RedditMediaState>({ isLoaded: false });

    const onLoaded = useCallback(() => {
        setShowSpinner(false);
    }, [setShowSpinner]);

    useEffect(() => {
        getRedditMediaState(post, containerSize).then((ms) => {
            setRedditMediaState(ms);
            const { isMP4, isImage, isIFrame, isTweet, isGallery } = ms;
            if ((isIFrame && !ms.isTweet)
                || (!isImage && !isTweet && !isMP4 && !isIFrame && !isGallery)) {
                onLoaded();
            }
        });
    }, [post, containerSize, onLoaded]);

    let child;
    const { isLoaded,
        isMP4, isImage, isIFrame, isTweet, isGallery,
        galleryInfo, imageInfo, videoInfo, videoAudio, iFrame } = redditMediaState;

    if (!isLoaded) {
        child = <></>
    } else if (isImage && !isIFrame && !isMP4) {
        child = <ImageWrapper {...{ post, imageInfo, onLoadingComplete: onLoaded, containerSize }} />
    } else if (isGallery) {
        child = <Gallery
            images={galleryInfo}
            maxheight={containerSize.height}
            postMode={true}
            mediaRef={mediaRef}
            uniformHeight={false}
            onLoadingComplete={onLoaded}
        />
    } else if (isTweet) {
        child = <IFrameTweet post={post} onLoadingComplete={onLoaded} />
    } else if (isIFrame && !isTweet) {
        child = <IFrameImage iFrame={iFrame} />
    } else if (isMP4 && !isIFrame) {
        child = <VideoHandler videoInfo={videoInfo} audio={videoAudio} onLoadingComplete={onLoaded} />
    } else {
        child = <a title="external link" href={post.external_link}>
            <LinkSvg className="max-h-full max-w-full fill-gray-800 mx-auto" transform="scale(3)" title="external link" />
        </a>;
    }
    
    return <div className="flex justify-center items-center w-full h-full" ref={mediaRef}>
        {child}
    </div>
};

export default Media;
