

import { IconLink } from 'components/IconLink';
import { Tags, UserText } from 'components/Post';
import { DownVote, UpVote } from 'components/Vote';
import { ReactComponent as ReplyLine } from 'svg/reply-line.svg';
import { filterByProfile, filterReason, timeSinceShort, URL_SUBMIT_COMMENT } from 'utils';


export function Comments({ post, nodes, profile, votes, setters }) {
    return <div>
        {nodes.map((node, i) => {
            let { comment } = node;
            const hidden = filterByProfile(comment, profile);
            return <div>
                <div key={i} className="flex flex-row py-1 sm:py-4" id={`comment-${node.id}`}>
                    <div className={`flex flex-none justify-end px-2 comment-depth-${Math.min(node.depth, 9)}`}>
                        <div className={`w-1 h-full py-2 rounded-sm self-center comment-depth-color-${node.depth % 6}`}></div>
                    </div>
                    <div className="grow">
                        <Tags post={comment} />
                        {hidden
                            ? <div>
                                <div><UserText text={comment.text} /></div>
                                <CommentInfo comment={comment} />
                                <CommentButtons {...{ post, comment, votes, setters }} />
                                <CommentNavigation {... { node, setters }} />
                            </div>
                            : <div>
                                {filterReason(comment, profile)}
                            </div>}
                    </div>
                </div>
                {hidden && <div>
                    <Comments {... {post, nodes:node.children, profile, votes, setters}}/>
                </div>}
            </div>
        })}
    </div>
}

export function CommentInfo({ comment }) {
    return <div className="flex flex-row flex-wrap justify-around py-1 text-gray-500 text-center gap-x-1">
        <div className="md:w-1/5 text-center">{comment.user_name || "anon"}</div>
        <div className="md:w-1/5 text-center">{timeSinceShort(comment.created)}</div>
    </div>
}

export function CommentButtons({ post, comment, votes, setters }) {
    return <div className="sm:flex sm:flex-row sm:justify-end">
        <div className="flex flex-row justify-around py-1 sm:w-1/2 lg:w-1/3">
            <UpVote thing={comment} votes={votes} updateVote={setters.updateVote} />
            <DownVote thing={comment} votes={votes} updateVote={setters.updateVote} />
            <div><IconLink link={URL_SUBMIT_COMMENT(post.id, comment.id)} Img={ReplyLine} title="submit comment" /></div>
        </div>
    </div>
}

export function CommentLink({ id, text, updateFocusComment }) {
    if (id) {
        return <button className="text-fuschia-600" onClick={() => updateFocusComment(id)}>{text}</button>
    } else {
        return <span className="text-gray-500">{text}</span>
    }
}

export function CommentNavigation({ node, setters }) {
    const click = setters.updateFocusComment;
    return <div className="sm:flex sm:flex-row sm:justify-end">
        <div className="flex flex-row justify-around py-1 sm:w-1/2 lg:w-1/3 text-fuchsia-500">
            <CommentLink id={node.parent_id} text="parent" updateFocusComment={click} />
            <CommentLink id={node.next_parent_id} text="next parent" updateFocusComment={click} />
            <CommentLink id={node.prev_id} text="prev" updateFocusComment={click} />
            <CommentLink id={node.next_id} text="next" updateFocusComment={click} />
        </div>
    </div>
}