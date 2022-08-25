

import { ListPost } from 'components/Post';
import { ReactComponent as LeftArrow } from 'svg/arrow-left-line.svg';
import { ReactComponent as RightArrow } from 'svg/arrow-right-line.svg';
import { filterByProfile } from 'utils';

export function Listing({ posts, initialVotes, profile, page, numPages, setters }) {
    const filteredPosts = posts.filter(post => filterByProfile(post, profile));

    const hasPrevPage = page > 1;
    const hasNextPage = page < numPages;

    if (filteredPosts.length === 0) {
        return <p>No posts are available</p>
    } else {
        return <>
            <ul className="divide-y divide-gray-500">
                {filteredPosts.map((post, i) => <ListPost key={i} {... { post, initialVotes, setters }} />)}
            </ul>
            <hr className="border-gray-500" />
            <div className="pagination">
                <div className="flex flex-row items-center justify-center">
                    <button title="previous page" onClick={() => setters.updatePage(page - 1)} disabled={!hasPrevPage}>
                        <LeftArrow style={{ fill: (hasPrevPage ? "#d946ef" : "#E5E7EB") }} className="w-6" />
                    </button>
                    <div>
                        page {page} of {numPages}
                    </div>
                    <button title="next page" onClick={() => setters.updatePage(page + 1)} disabled={!hasNextPage}>
                        <RightArrow style={{ fill: (hasNextPage ? "#d946ef" : "#E5E7EB") }} className="w-6" />
                    </button>

                </div>
            </div>
        </>
    }
}