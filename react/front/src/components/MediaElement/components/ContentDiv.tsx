import Media from './Media'
import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { ImSpinner2 } from "react-icons/im";

export function ContentDiv({ redditUrl }: { redditUrl: string }) {
    const [post, setPost] = useState<any | null>(null);
    const [showSpinner, setShowSpinner] = useState(true);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);
    // cors failure without www
    redditUrl = redditUrl.replace(/^https:\/\/reddit.com/, "https://www.reddit.com")
    useEffect(() => {
        axios.get(redditUrl + ".json", {
            params: {
                raw_json: 1,
                profile_img: true,
                sr_detail: true,
            },
        }).then((res) => {
            setPost(res?.data?.[0]?.data?.children?.[0]?.data)
        }).catch((error) => {
            console.log(error);
        })
    }, [redditUrl]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver((event) => {
            const { width, height } = event[0].contentRect;
            setContainerSize({ width, height })
        });

        if (containerRef?.current) {
            resizeObserver.observe(containerRef.current);
        }
    }, [containerRef]);
    return <div ref={containerRef} className={`h-[75vh] w-full px-2 bg-gray-500 ${showSpinner ? "overflow-y-hidden": "overflow-y-scroll"} overflow-x-hidden`}>
        {showSpinner && <div className="relative mx-auto w-full h-full">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <ImSpinner2 className="w-8 h-8 animate-spin" />
            </div>
        </div>}
        {post && <Media post={post} setShowSpinner={setShowSpinner} containerSize={containerSize} />}
    </div>
}