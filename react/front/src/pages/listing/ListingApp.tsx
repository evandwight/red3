import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { getCsrfToken } from 'utils';
import { Listing } from './Listing';


function getSort() {
    const match = window.location.pathname.match(/\/sort=([a-z]+)/);
    if (match) {
        return match[1];
    } else {
        return "hot";
    }
}
function ListingApp() {
    const [posts, setPosts] = useState<any>(null);
    const [initialVotes, setInitialVotes] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [page, setPage] = useState<any>(parseInt(new URLSearchParams(window.location.search).get('page') || "1"));
    const [numPages, setNumPages] = useState<number>(0);
    const sort = getSort();
    const wrapperRef: any = useRef(null);
    const updatePage = (newPage) => {
        const url = new URL(window.location as any);
        url.searchParams.set('page', newPage);
        window.history.pushState({}, '', url);

        setPage(newPage)
    }
    window.onpopstate = (e) => {
        setPage(parseInt(new URLSearchParams(window.location.search).get('page') || "1"));
    }
    useEffect(() => { axios('/api/profile').then(result => setProfile(result.data))}, [])
    useEffect(() => {
        setPosts(null);
        axios(`/api/listing/sort=${sort}?page=${page}`)
            .then(result => {
                setPosts(result.data.list);
                setNumPages(result.data.numPages);
            });
    }, [sort, page]);
    useEffect(() => {
        if (!posts) {
            return;
        }
        axios.post('/api/votes', {'list':posts.map(post => post.thing_uuid)},
            {headers: {'X-CSRFToken':getCsrfToken()}})
        .then((results) => setInitialVotes(results.data));
    },[posts]);
    useEffect(() => {
        wrapperRef?.current?.scrollIntoView();
    }, [page]);
    const setters = { setInitialVotes, updatePage };
    if (posts && profile) {
        return <>
            <div ref={wrapperRef}></div>
            <Listing {... { posts, initialVotes, profile, page, numPages, setters }} />
        </>
    } else {
        return <div>
            Loading posts
        </div>
    }
}

export default ListingApp;
