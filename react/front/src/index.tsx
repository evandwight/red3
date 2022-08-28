import React from 'react';
import ReactDOM from 'react-dom/client';
import ListingApp from './pages/listing/ListingApp';
import reportWebVitals from './reportWebVitals';
import './index.css';
import PostDetailsApp from 'pages/postdetails/PostDetailsApp';
import { ContentDiv } from 'components/MediaElement/components/ContentDiv';

let rootEle = document.getElementById('listing');
if (rootEle) {
    const root = ReactDOM.createRoot(rootEle as HTMLElement);

    root.render(
    <React.StrictMode>
        <ListingApp />
    </React.StrictMode>
    );
}

rootEle = document.getElementById('post-details');
if (rootEle) {
    const root = ReactDOM.createRoot(rootEle as HTMLElement);

    root.render(
    <React.StrictMode>
        <PostDetailsApp />
    </React.StrictMode>
    );
}

// const rootEle = document.getElementById('media-element');
// if (rootEle) {
//     const root = ReactDOM.createRoot(rootEle as HTMLElement);

//     root.render(
//             <div className="max-w-full max-h-screen">
//                 {/* reddit image */}
//                 {/* <ContentDiv redditUrl="https://www.reddit.com/r/WhitePeopleTwitter/comments/wyf1cw/what_goes_around_comes_around/" /> */}
//                 {/* Twitter */}
//                 {/* <ContentDiv redditUrl="https://www.reddit.com/r/elonmusk/comments/w7w527/elon_partying_last_night_with_google_founder/"/> */}
//                 {/* reddit gif */}
//                 {/* <ContentDiv redditUrl="https://www.reddit.com/r/gifs/comments/wbeih1/an_f35b_taking_off_from_hms_queen_elizabeth_for/"/> */}
//                 {/* gif */}
//                 {/* <ContentDiv redditUrl="https://www.reddit.com/r/gifs/comments/wbw7c3/swimmin_along_in_the_deep_blue_sea"/> */}
//                 {/* gif */}
//                 {/* <ContentDiv redditUrl="https://www.reddit.com/r/gifs/comments/wb4efr/look_at_how_high_cats_can_jump/" /> */}
//                 {/* reddit video */}
//                 {/* <ContentDiv redditUrl="https://www.reddit.com/r/dogswithjobs/comments/wyageb/service_dog_sleeping_during_plane_trip/" /> */}
//                 {/* reddit video - bad codec -- Codec: H264 - MPEG-4 AVC (part 10) (avc1) */}
//                 {/* <ContentDiv redditUrl="https://reddit.com/r/aww/comments/wy621c/imagine_being_this_soft/"/> */}
//                 {/* reddit video - bad codec -- Codec: H264 - MPEG-4 AVC (part 10) (avc1) */}
//                 {/* <ContentDiv redditUrl="https://reddit.com/r/nextfuckinglevel/comments/wydhwn/blind_runner_with_guide_winning_the_race/"/> */}
//                 {/* reddit video - bad codec and big */}
//                 <ContentDiv redditUrl="https://reddit.com/r/PublicFreakout/comments/wz4qb3/man_was_just_resting_in_his_car_after_a_long/"/>
//                 {/* iframe giphy */}
//                 {/* <ContentDiv redditUrl="https://reddit.com/r/instant_regret/comments/wynt6a/lets_pop_this_wasps_nest_like_an_egg/"/> */}
//                 {/* Gallery */}
//                 {/* <ContentDiv redditUrl="https://www.reddit.com/r/antiwork/comments/wz569s/im_an_independent_contractor_this_company_wants/"/> */}
//             </div>
//     );
// }

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
