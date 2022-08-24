import { ReactComponent as DownArrow } from 'svg/arrow-down-line.svg';
import { ReactComponent as UpArrow } from 'svg/arrow-up-line.svg';
import { vote } from 'utils';

export function UpVote({ thing, votes, updateVote }) {
    const active = (votes ? votes[thing.thing_uuid] : null) === "UP" 
    return <button title="up vote" onClick={() => vote(thing, true, updateVote)} disabled={!votes}>
        <UpArrow className={`w-6 ${active ? "fill-orange-500" : "fill-fuchsia-500"}`} width={24} height={24}/>
    </button>
}

export function DownVote({ thing, votes, updateVote }) {
    const active = (votes ? votes[thing.thing_uuid] : null) === "DN" 
    return <button title="down vote" onClick={() => vote(thing, false, updateVote)} disabled={!votes}>
        <DownArrow className={`w-6 ${active ? "fill-orange-500" : "fill-fuchsia-500"}`}  width={24} height={24}/>
    </button>
}