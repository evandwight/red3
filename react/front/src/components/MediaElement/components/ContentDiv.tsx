import Media from './Media'
import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ImSpinner2 } from "react-icons/im";

export function ContentDiv({ redditUrl }: { redditUrl: string }) {
    const [post, setPost] = useState<any | null>(null);
    const [showSpinner, setShowSpinner] = useState(true);
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
    }, [redditUrl])
    return <div>
        {showSpinner && <div className="relative mx-auto h-64 w-full">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <ImSpinner2 className="w-8 h-8 animate-spin" />
            </div>
        </div>}
        {post && <Media post={post} setShowSpinner={setShowSpinner} />}
    </div>
}