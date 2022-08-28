import muxjs from 'mux.js';
import { useEffect, useRef } from "react";



export default function VideoHandler({ videoInfo, audio, onLoadingComplete }) {
    if (!videoInfo?.hasAudio && !!audio) {
        return <SeparateAudioVideoHandler videoUrl={videoInfo.url} audioUrl={audio} onLoadingComplete={onLoadingComplete} />
    } else {
        console.log("VideoHandler")
        return <video className="max-h-screen"
            controls={true} autoPlay={false} muted loop preload="auto" playsInline draggable={false}
            onLoadStart={onLoadingComplete}>
            <source data-src={videoInfo.url} src={videoInfo.url} type="video/mp4" />
        </video>
    }
}

export function SeparateAudioVideoHandler({ videoUrl, audioUrl, onLoadingComplete }) {
    const video = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        async function loadVideoUrl(url) {
            try {
                const vidBlob = await (await fetch(url)).blob();
                const vidBuff = await vidBlob.arrayBuffer();
                const vidInt8 = new Int8Array(vidBuff);
                const probe = muxjs.mp4.probe.tracks(vidInt8)
                const codec = probe[0].codec;
                const mimeCodec = `video/mp4; codecs="${codec}"`;
                return {
                    arrayBuffer: vidBuff,
                    mimeCodec,
                }
            } catch (error) {
                return { error };
            }
        }

        async function loadVideo() {
            const sources = [] as any;
            if (!('MediaSource' in window)) {
                console.error("MediaSource unsupported");
                return;
            }
            if (video.current === null) {
                console.error('videoRef not set');
                return;
            }
            for (const url of [videoUrl, audioUrl]) {
                const { arrayBuffer, mimeCodec, error } = await loadVideoUrl(url);
                console.log({ mimeCodec, error, url })
                if (error || !mimeCodec) {
                    console.error(error);
                } else if (!MediaSource.isTypeSupported(mimeCodec)) {
                    console.error(`Unsupported MIME type or codec: ${mimeCodec}`);
                } else {
                    sources.push({ arrayBuffer, mimeCodec });
                }
            }

            if (sources.length === 0) {
                console.error("No supported sources");
                return;
            }

            let mediaSource: MediaSource;

            mediaSource = new MediaSource();
            video.current.src = URL.createObjectURL(mediaSource);
            let openSources = sources.length;
            const updateEnd = () => {
                openSources -= 1;
                if (openSources === 0) {
                    mediaSource.endOfStream();
                    video.current?.play();
                }
            }
            for (const { arrayBuffer, mimeCodec } of sources) {
                mediaSource.addEventListener('sourceopen', () => {
                    const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
                    sourceBuffer.addEventListener('updateend', updateEnd);
                    sourceBuffer.appendBuffer(arrayBuffer);
                });
            }
        }
        loadVideo();
    }, [audioUrl, videoUrl]);
    return <video className="max-h-screen"
        ref={video} controls={true} autoPlay={false} muted loop preload="auto" playsInline draggable={false}
        onLoadStart={onLoadingComplete}>
    </video>
}