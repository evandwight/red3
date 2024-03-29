

import { IconLink } from 'components/IconLink';
import { Tags, UserText } from 'components/Post';
import { VoteButtons } from 'components/Vote';
import { useState } from 'react';
import { ReactComponent as ReplyLine } from 'svg/reply-line.svg';
import { filterByProfile, filterReason, timeSinceShort, URL_SUBMIT_COMMENT } from 'utils';


export const COLLAPSE_COMMENT_LIMIT = 50;

export function Comments({ post, nodes, initialCollapse, overrideCollapse, parentId, profile, initialVotes, setters }) {
    const [maybeShouldCollapse, setMaybeShouldCollapse] = useState(initialCollapse[parentId]);
    const shouldCollapse = maybeShouldCollapse && !overrideCollapse;
    const expandedNodes = shouldCollapse ? nodes.filter(node => node.collapseOrder <= COLLAPSE_COMMENT_LIMIT) : nodes;
    const collapsedNodeCount = nodes.length - expandedNodes.length;
    return <div>
        {expandedNodes.map((node, i) => {
            let { comment } = node;
            const hidden = filterByProfile(comment, profile);
            return <div key={i} id={`comment-${node.id}`}>
                <CommentDepth depth={node.depth}>
                    <Tags post={comment} />
                    {hidden
                        ? <div>
                            <div><UserText text={comment.text} /></div>
                            <CommentInfo comment={comment} />
                            <CommentButtons {...{ post, comment, initialVotes }} />
                            <CommentNavigation {... { node, setters }} />
                        </div>
                        : <div>
                            {filterReason(comment, profile)}
                        </div>}
                    <hr className="border-gray-500" />
                </CommentDepth>
                {hidden && <div>
                    <Comments {... { post, nodes: node.children, initialCollapse, overrideCollapse, parentId: node.id, profile, initialVotes, setters }} />
                </div>}
            </div>
        })}
        {shouldCollapse && collapsedNodeCount > 0 && <CommentDepth depth={nodes[0].depth}>
            <button onClick={() => setMaybeShouldCollapse(false)}>
                {collapsedNodeCount} more replies
            </button>
        </CommentDepth>}
    </div>
}

export function CommentDepth({ depth, children }) {
    return <div data-depth={depth} className="flex flex-row py-1 sm:py-4">
        {depth > 0 && <div className={`flex flex-none justify-end px-2 comment-depth-${Math.min(depth - 1, 9)}`}>
            <div className={`w-1 h-full py-2 rounded-sm self-center comment-depth-color-${(depth - 1) % 6}`}/>
        </div>}
        <div className="grow px-2">
            {children}
        </div>
    </div>
}

export function CommentInfo({ comment }) {
    return <div className="flex flex-row flex-wrap justify-around py-1 text-gray-500 text-center gap-x-1">
        <div className="md:w-1/5 text-center">{comment.user_name || "anon"}</div>
        <div className="md:w-1/5 text-center">{timeSinceShort(comment.created)}</div>
    </div>
}

export function CommentButtons({ post, comment, initialVotes }) {
    return <div className="sm:flex sm:flex-row sm:justify-end">
        <div className="flex flex-row justify-around py-1 sm:w-1/2 lg:w-1/3">
            <VoteButtons thing={comment} initialVotes={initialVotes}/>
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