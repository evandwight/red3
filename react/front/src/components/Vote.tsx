import axios from 'axios';
import { useEffect, useState } from 'react';
import { ReactComponent as DownArrow } from 'svg/arrow-down-line.svg';
import { ReactComponent as UpArrow } from 'svg/arrow-up-line.svg';
import { getCsrfToken, URL_DNVOTE, URL_UPVOTE } from 'utils';

export function sendVote(thing, isUpVote, setVote) {
    setVote((prevVote) => isUpVote ? (prevVote === "UP" ? "" : "UP") : (prevVote === "DN" ? "" : "DN"));
    let url = isUpVote ? URL_UPVOTE(thing.thing_uuid) : URL_DNVOTE(thing.thing_uuid);
    axios.post(url, {}, { headers: { 'X-CSRFToken': getCsrfToken() } })
        .then(result => {
            if (result.data.reload) {
                window.location.reload();
            }
        }).catch(err => console.error(err))

}

export function VoteButtons({ thing, initialVotes }) {
    const [vote, setVote] = useState("");
    useEffect(() => {
        if (initialVotes) {
            setVote(initialVotes[thing.thing_uuid])
        }
    }, [thing, initialVotes])
    return <>
        <button title="up vote" onClick={() => sendVote(thing, true, setVote)} disabled={!initialVotes}>
            <UpArrow className={`w-6 ${vote === "UP" ? "fill-orange-500" : "fill-fuchsia-500"}`} width={24} height={24} />
        </button>
        <button title="down vote" onClick={() => sendVote(thing, false, setVote)} disabled={!initialVotes}>
            <DownArrow className={`w-6 ${vote === "DN" ? "fill-orange-500" : "fill-fuchsia-500"}`} width={24} height={24} />
        </button>
    </>
}