import axios from 'axios';
import { FullPost } from 'components/Post';
import { useEffect, useState } from 'react';
import { commentTreeToList, getCsrfToken } from 'utils';
import { Comments, COLLAPSE_COMMENT_LIMIT } from './Comments';

export default function PostDetailsApp() {
    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any>(null);
    const [votes, setVotes] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [collapseInitial, setCollapseInitial] = useState<any>({});
    const match = window.location.pathname.match(/^\/details\/post=(\d+).*$/);
    const postId = match ? match[1] : null;

    const updateCollapseInitial = (expandId) => {
        setCollapseInitial({...collapseInitial, [expandId]: false})
    }
    const updateFocusComment = (newCommentId) => {
        const url = new URL(window.location as any);
        const hash = `comment-${newCommentId}`;
        url.hash = hash;
        window.history.pushState({}, '', url);
        const element = document.getElementById(hash);
        // useEffect to scroll is slow so 
        // if the element exists then scroll to it
        // otherwise reveal the element and use the slow comment load scroll
        if (element) {
            element.scrollIntoView();
        } else {
            setCollapseInitial({});
        }
    }
    const updateVote = (thingUUID, isUpVote) => {
        const votes2 = { ...votes };
        const oldVote = votes2[thingUUID];
        votes2[thingUUID] = isUpVote ? (oldVote === "UP" ? "" : "UP") : (oldVote === "DN" ? "" : "DN");
        setVotes(votes2);
    }
    useEffect(() => { axios('/api/profile').then(result => setProfile(result.data))}, []);
    useEffect(() => {
        axios(`/api/details/post=${postId}`)
            .then(result => {
                setPost(result.data.post);
                const hash = window.location.hash;
                setCollapseInitial(!hash ? computeCollapseInitial(result.data.comments, null): {});
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
        .then((results) => setVotes(results.data));
    },[post, comments]);
    useEffect(() => {
        const hash = window.location.hash;
        if (comments && hash && Object.keys(collapseInitial).length === 0) {
            document.getElementById(hash.slice(1))?.scrollIntoView()
        }
    }, [comments, collapseInitial]);
    useEffect(() => {
        if (post) {
            window.document.title = `Post - ${post.title}`;
        }
    }, [post]);
    const setters = { setVotes, updateVote, updateFocusComment, updateCollapseInitial };
    if (post && profile) {
        return <div>
            <FullPost {... {post, votes, profile, setters}}/>
            <hr className="border-gray-500"></hr>
            {comments ? 
                <Comments {... {post, nodes:comments, collapseInitial, parentId: null, votes, profile, setters }} />
                : <div> Loading </div>}
        </div>
    } else {
        return <div>
            Loading
        </div>
    }
}

export function computeCollapseInitial(nodes, parentId) {
    let initialCollapse = {};
    for (let node of nodes){
        console.log({node})
        if (node.collapseOrder < COLLAPSE_COMMENT_LIMIT) {
            console.log(node.id + ' dont collapse')
            initialCollapse = {...initialCollapse, ...computeCollapseInitial(node.children, node.id)};
        } else {
            console.log(node.id + ' collapse')
            return {...initialCollapse, [parentId]: true}
        }
    }
    return initialCollapse;
}