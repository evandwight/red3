import muxjs from 'mux.js';
import { useEffect, useRef } from "react";



export default function VideoHandler({ videoInfo, audio, onLoadingComplete }) {
    if (!videoInfo?.hasAudio && !!audio) {
        return <SeparateAudioVideoHandler videoUrl={videoInfo.url} audioUrl={audio} onLoadingComplete={onLoadingComplete} />
    } else {
        return <video className="max-h-screen"
            controls={true} autoPlay={false} muted loop preload="auto" playsInline draggable={false}
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
    useEffect(() => {
        async function loadVideo() {
            if (!('MediaSource' in window)) {
                console.error("MediaSource unsupported");
                return;
            }
            if (video.current === null) {
                console.error('videoRef not set');
                return;
            }

            let mediaSource = new MediaSource();

            const generator = loadVideoSegments(videoUrl);

            mediaSource.addEventListener('sourceopen', async () => {
                const firstSegmentResult = await generator.next();
                if (firstSegmentResult.done) {
                    throw new Error("no first segment");
                }
                const mimeCodec = getMimeType(firstSegmentResult.value);
                const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
                const addBuffer = async () => {
                    const result = await generator.next();
                    if (result.done) {
                        mediaSource.endOfStream();
                        video.current?.play();
                    } else {
                        sourceBuffer.appendBuffer(result.value.buffer);
                    }
                }
                sourceBuffer.addEventListener('updateend', addBuffer);
                sourceBuffer.appendBuffer(firstSegmentResult.value.buffer);
                video.current?.play();
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
    }, [audioUrl, videoUrl]);
    return <video className="max-h-screen"
        ref={video} controls={true} autoPlay={false} muted loop preload="auto" playsInline draggable={false}
        onLoadStart={onLoadingComplete}>
    </video>
}








// const videoData = await loadVideoUrl(videoUrl);
// if (videoData.error) {
//     console.error(videoData.error);
//     return;
// }
// if (!videoData.arrayBuffer) {
//     return;
// }
// const NUM_CHUNKS = 20;
// const segments: any[] = [];
// for (let i = 0; i < NUM_CHUNKS; ++i) {
//     const chunkSize = Math.ceil(videoData.arrayBuffer?.byteLength / NUM_CHUNKS);
//     const startByte = chunkSize * i;
//     const chunk = videoData.arrayBuffer.slice(startByte, startByte + chunkSize);
//     segments.push(chunk);
// }
// console.log({segments});
// mediaSource.addEventListener('sourceopen', () => {
//     console.log(segments[0]);
//     const mimeCodec = getMimeType(new Uint8Array(segments[0]));
//     console.log({mimeCodec});
//     const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
//     const addBuffer = async () => {
//         if (segments.length === 0) {
//             console.log('done done')
//             mediaSource.endOfStream();
//             video.current?.play();
//         } else {
//             console.log('append buffer')
//             sourceBuffer.appendBuffer(segments.shift());
//         }
//     }
//     sourceBuffer.addEventListener('updateend', addBuffer);
//     addBuffer();
// });