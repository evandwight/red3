import axios from 'axios';
import { FullPost } from 'components/Post';
import { useEffect, useState } from 'react';
import { commentTreeToList, getCsrfToken } from 'utils';
import { Comments } from './Comments';

export default function PostDetailsApp() {
    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any>(null);
    const [votes, setVotes] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const match = window.location.pathname.match(/^\/details\/post=(\d+).*$/);
    const postId = match ? match[1] : null;


    const updateFocusComment = (newCommentId) => {
        const url = new URL(window.location as any);
        const hash = `comment-${newCommentId}`;
        url.hash = hash;
        window.history.pushState({}, '', url);
        document.getElementById(hash)?.scrollIntoView()
    }
    const updateVote = (thingUUID, isUpVote) => {
        const votes2 = { ...votes };
        const oldVote = votes2[thingUUID];
        votes2[thingUUID] = isUpVote ? (oldVote === "UP" ? "" : "UP") : (oldVote === "DN" ? "" : "DN");
        setVotes(votes2);
    }
    useEffect(() => { axios('/api/profile').then(result => setProfile(result.data))}, [])
    useEffect(() => {
        axios(`/api/details/post=${postId}`)
            .then(result => {
                setPost(result.data.post);
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
        if (comments && hash) {
            document.getElementById(hash.slice(1))?.scrollIntoView()
        }
    }, [comments])
    useEffect(() => {
        if (post) {
            window.document.title = `Post - ${post.title}`;
        }
    }, [post])
    const setters = { setVotes, updateVote, updateFocusComment };
    if (post && profile) {
        return <div>
            <FullPost {... {post, votes, profile, setters}}/>
            <hr className="border-gray-500"></hr>
            {comments ? 
                <Comments {... {post, nodes:comments, votes, profile, setters }} />
                : <div> Loading </div>}
        </div>
    } else {
        return <div>
            Loading
        </div>
    }
}