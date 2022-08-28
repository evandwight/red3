import axios from 'axios';
import { FullPost } from 'components/Post';
import { useEffect, useMemo, useState, useRef } from 'react';
import { commentTreeToList, getCsrfToken } from 'utils';
import { Comments, COLLAPSE_COMMENT_LIMIT } from './Comments';

export default function PostDetailsApp() {
    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any>(null);
    const [initialVotes, setInitialVotes] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [initialCollapse, setInitialCollapse] = useState<any>({});
    const [focusComment, setFocusComment] = useState<any>(window.location.hash.slice(1));
    const [overrideCollapse, setOverrideCollapse] = useState<any>(false);
    const match = window.location.pathname.match(/^\/details\/post=(\d+).*$/);
    const postId = match ? match[1] : null;

    const updateFocusComment = (newCommentId) => {
        const url = new URL(window.location as any);
        const hash = `comment-${newCommentId}`;
        url.hash = hash;
        window.history.replaceState({}, '', url);
        setFocusComment(hash);
    }
    useEffect(() => { axios('/api/profile').then(result => setProfile(result.data))}, []);
    useEffect(() => {
        axios(`/api/details/post=${postId}`).then(result => setPost(result.data.post));
        axios(`/api/comments/post=${postId}`).then(result => {
            const hash = window.location.hash;
            setInitialCollapse(!hash ? computeInitialCollapse(result.data.comments, null): {});
            setComments(result.data.comments);
        });
    }, [postId]);
    useEffect(() => {
        if (!post || !comments) {
            return;
        }
        const ids = [post.thing_uuid].concat(commentTreeToList(comments).map(node => node.comment.thing_uuid))
        axios.post('/api/votes', {'list':ids},
            {headers: {'X-CSRFToken':getCsrfToken()}})
        .then((results) => setInitialVotes(results.data));
    },[post, comments]);
    useEffect(() => {
        if (comments && focusComment) {
            const element = document.getElementById(focusComment);
            if (element) {    
                element.scrollIntoView();
            } else if (!overrideCollapse) {
                setOverrideCollapse(true);
            }
        }
    }, [comments, overrideCollapse, focusComment]);
    useEffect(() => {
        if (post) {
            window.document.title = `Post - ${post.title}`;
        }
    }, [post]);
    const setters = useRef({ updateFocusComment });
    const ele = useMemo(() => post && profile ?
        <div>
            <FullPost {... {post, initialVotes, profile, setters}}/>
            <hr className="border-gray-500"></hr>
            {comments ? 
                <Comments {... {post, nodes:comments, initialCollapse, overrideCollapse, parentId: null, initialVotes, profile, setters:setters.current }} />
                : <div> Loading </div>}
        </div>
        : <div>Loading</div>,
        [post, comments, initialCollapse, overrideCollapse, initialVotes, profile, setters])
    return ele;
}

export function computeInitialCollapse(nodes, parentId) {
    let initialCollapse = {};
    for (let node of nodes){
        if (node.collapseOrder < COLLAPSE_COMMENT_LIMIT) {
            initialCollapse = {...initialCollapse, ...computeInitialCollapse(node.children, node.id)};
        } else {
            return {...initialCollapse, [parentId]: true}
        }
    }
    return initialCollapse;
}