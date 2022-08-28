import muxjs from 'mux.js';
import { useEffect, useRef, useState } from "react";



export default function VideoHandler({ videoInfo, audio, onLoadingComplete }) {
    if (!videoInfo?.hasAudio && !!audio && ('MediaSource' in window)) {
        console.log('separate audio')
        return <SeparateAudioVideoHandler videoUrl={videoInfo.url} audioUrl={audio} onLoadingComplete={onLoadingComplete} />
    } else {
        console.log('all in one')
        return <video className="max-h-full max-w-full"
            controls autoPlay muted loop preload="auto" playsInline draggable={false}
            onLoadStart={onLoadingComplete}>
            <source data-src={videoInfo.url} src={videoInfo.url} type="video/mp4" />
        </video>
    }
}

async function* loadVideoSegments(url) {
    try {
        const reader = await fetch(url).then((response) => {
            if (response?.body === null) {
                throw new Error("response null, no video");
            }
            return response.body.getReader();
        });
        while (true) {
            const result = await reader.read();
            if (result.done) {
                break;
            }
            yield result.value;
        }
    } catch (error) {
        console.error(error);
    }
    return;
}
function getMimeType(firstSegment) {
    const probe = muxjs.mp4.probe.tracks(firstSegment)
    const codec = probe[0].codec;
    return `video/mp4; codecs="${codec}"`;
}

async function loadVideoUrl(url) {
    try {
        const vidBlob = await (await fetch(url)).blob();
        const vidBuff = await vidBlob.arrayBuffer();
        const vidInt8 = new Int8Array(vidBuff);
        const mimeCodec = getMimeType(vidInt8);
        if (!MediaSource.isTypeSupported(mimeCodec)) {
            throw new Error(`Unsupported MIME type or codec: ${mimeCodec}`);
        }
        return {
            arrayBuffer: vidBuff,
            mimeCodec,
        }
    } catch (error) {
        return { error };
    }
}

export function SeparateAudioVideoHandler({ videoUrl, audioUrl, onLoadingComplete }) {
    const video = useRef<HTMLVideoElement>(null);
    const [play, setPlay] = useState(false);
    useEffect(() => {
        if (play) {
            video.current?.play();
        }
    },[play])
    useEffect(() => {
        async function loadVideo() {
            if (video.current === null) {
                console.error('videoRef not set');
                return;
            }

            let mediaSource = new MediaSource();

            const generator = loadVideoSegments(videoUrl);
            const firstSegmentResult = await generator.next();
            let first = true;
            mediaSource.addEventListener('sourceopen', async () => {
                if (firstSegmentResult.done) {
                    throw new Error("no first segment");
                }
                const mimeCodec = getMimeType(firstSegmentResult.value);
                const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
                const addBuffer = async () => {
                    const result = await generator.next();
                    if (result.done) {
                        mediaSource.endOfStream();
                    } else {
                        sourceBuffer.appendBuffer(result.value.buffer);
                    }
                    if (first) {
                        first = false;
                        onLoadingComplete();
                        setPlay(true);
                    }
                }
                sourceBuffer.addEventListener('updateend', addBuffer);
                sourceBuffer.appendBuffer(firstSegmentResult.value.buffer);
            });

            const audioData = await loadVideoUrl(audioUrl);
            let { arrayBuffer, mimeCodec, error } = audioData;
            if (error) {
                console.error(error);
            } else {
                mediaSource.addEventListener('sourceopen', () => {
                    const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec as any);
                    sourceBuffer.addEventListener('updateend', () => {
                    });
                    sourceBuffer.appendBuffer(arrayBuffer as any);
                });
            }

            const url = URL.createObjectURL(mediaSource);
            video.current.src = URL.createObjectURL(mediaSource);
            URL.revokeObjectURL(url);
        }
        loadVideo();
    }, [audioUrl, videoUrl, onLoadingComplete]);

    return <video className={`max-h-full max-w-full ${play ? "" : "invisible"}`}
        ref={video} controls autoPlay={false} muted loop preload="auto" playsInline draggable={false}>
    </video>
}