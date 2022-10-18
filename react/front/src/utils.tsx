import axios from "axios";

export function URL_DETAIL(id) {
    return `/details/post=${id}/`;
}

export function URL_SUBMIT_COMMENT(postId, commentId = null) {
    return `/submitComment/${postId}/${!!commentId ? `${commentId}/` : ""}`;
}

export function URL_UPVOTE(id) {
    return `/upvote/${id}/`;
}

export function URL_DNVOTE(id) {
    return `/downvote/${id}/`;
}

export function URL_LOAD_REDDIT_COMMENTS(id) {
    return `/api/loadRedditComments/${id}`;
}

export function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

export function timeSinceShort(value: Date) {
    let seconds = Math.floor((new Date().getTime() - new Date(value).getTime()) / 1000);
    let days = seconds / 86400;
    if (days > 365) {
        return `${(days / 365).toFixed(1)}y`;
    } else if (days >= 1) {
        return `${days.toFixed(1)}d`;
    } else {
        return `${(seconds / 3600).toFixed(1)}h`;
    }
}

export function netloc(text) {
    if (!text) {
        return 'self';
    } else {
        try {
            let url = new URL(text);
            return url.hostname;
        } catch (_) {
            return 'unknown';
        }
    }
}

export function getCsrfToken() {
    return (document.querySelector('[name=csrfmiddlewaretoken]') as any)?.value;
}

const FILTER_TAGS = ['mean', 'nsfw', 'reddit_removed', 'asocial', 'political_junkie'];

export function filterByProfile(thing, profile) {
    for (const tag in FILTER_TAGS) {
        if (thing[tag] && !profile[`show_${tag}`]) {
            return false;
        }
    }
    return true;
}

export function filterReason(thing, profile) {
    for (const tag in FILTER_TAGS) {
        if (thing[tag] && !profile[`show_${tag}`]) {
            return `hidden_${tag}`;
        }
    }
    return null;
}

export function commentTreeToList(nodes) {
    return nodes.reduce((pv, cv) => pv.concat([cv],commentTreeToList(cv.children)), []);
}


export async function createAndPollTask(url, setTaskState) {
    try {
        setTaskState("loading");
        const {data} = await axios.post(url, {}, { headers: { 'X-CSRFToken': getCsrfToken() } })
        for(var i = 1; i < 100; i++) {
            var taskData = (await axios(data.url)).data;
            var {status, result} = taskData;
            if (status === "SUCCESS") {
                window.location.pathname = result;
                return;
            } else if (status !== "PENDING" && status !== "STARTED") {
                throw new Error(`task failed - ${status}`);
            }
            await new Promise(r => setTimeout(r, 500));
        }
        throw new Error("timeout polling task");
    } catch (error) {
        console.error(error)
        setTaskState("error");
    }
}