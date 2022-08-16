"use strict";

function vote(event) {
    event.preventDefault();
    var element = event.currentTarget;
    var url = element.getAttribute("href");
    var id = element.children[0].getAttribute("id").substring("vote-up-".length)
    var upImg = document.getElementById('vote-up-' + id)
    var downImg = document.getElementById('vote-dn-' + id)

    function imageSrc(isUp, isActive) {
        return `/static/main/images/arrow-${isUp ? "up" : "down"}-line${isActive ? "-active" : ""}.svg`
    }

    function imageSrcError(isUp) {
        return `/static/main/images/arrow-${isUp ? "up" : "down"}-line-red.svg`
    }

    fetch(createPostRequest(url)).then(function (response) {
        return response.json()
    }).then(function (data) {
        if (data.reload) {
            location.reload();
            return;
        }
        var newDirection = data.direction;
        var isUpActive = false;
        var isDownActive = false;

        if (newDirection == "UP") {
            isUpActive = true;
        }
        else if (newDirection == "DN") {
            isDownActive = true;
        }

        upImg.src = imageSrc(true, isUpActive);
        downImg.src = imageSrc(false, isDownActive);
    }).catch(function (error) {
        console.error(error);
        upImg.src = imageSrcError(true);
        downImg.src = imageSrcError(false);
    });
}

function createPostRequest(url) {
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    return new Request(
        url,
        {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            mode: 'same-origin' // Do not send CSRF token to another domain.
        }
    );
}

function updateRedditComments(event) {
    event.preventDefault();
    var element = event.currentTarget;
    var url = element.getAttribute("href");
    var img =  element.children[0];
    img.classList.add("rotate-infinite");


    fetch(createPostRequest(url))
    .then(async function (r) {
        var data = await r.json();
        for(var i = 1; i < 100; i++) {
            var taskData = await fetch(new Request(data.url)).then(r => r.json());
            var status = taskData.status;
            if (status == "SUCCESS") {
                location.reload();
                return;
            } else if (status != "PENDING" && status != "STARTED") {
                throw new Error(`task failed - ${status}`);
            }
            await new Promise(r => setTimeout(r, 500));
        }
        throw new Error("updateRedditComments timeout");
    }).catch(function (error) {
        console.error(error);
        img.src = '/static/main/images/refresh-line-red.svg';
    }).finally(function() {
        img.classList.remove('rotate-infinite');
    });
}

function getIconHref(divElementId) {
    try {
        return document.getElementById(divElementId).children[0].getAttribute('href');
    } catch (error) {
        return null;
    }
}

function tryToLoadVideo(expandElement) {
    var redditUrl = expandElement.getAttribute('data-reddit-url');
    expandElement.innerText = "Loading";
    // https://reddit.com does not allow cors
    if (redditUrl.startsWith('https://reddit.com')) {
        redditUrl = redditUrl.replace("https://reddit.com", "https://www.reddit.com")
    }
    fetch(new Request(redditUrl + ".json")).then(function (response) {
        return response.json();
    }).then(function (json) {
        var videoSrc = json[0].data.children[0].data.secure_media.reddit_video.fallback_url;
        var video = document.createElement('video');
        video.style = "width: 100%; max-height: 100vh; margin-left: auto; margin-right: auto;";
        video.controls = true;
        video.loop = true;
        video.autoplay = true;
        var source = document.createElement("source");
        source.type = "video/mp4";
        source.src = videoSrc;
        video.appendChild(source);
        expandElement.innerHTML = '';
        expandElement.appendChild(video);
        video.load();
    }).catch(function(error) {
        expandElement.innerText = "Cannot load video";
    });
    expandElement.hidden = false;
}

function collapse(event) {
    event.preventDefault();
    var element = event.currentTarget;
    var id = element.getAttribute("href").slice(1)
    var expandElement = document.getElementById(id);
    expandElement.hidden = false;
    document.getElementById(`${id}-controller`).remove()
}


function maybeExpand(event) {
    event.preventDefault()
    var element = event.currentTarget;
    var expandElement = document.getElementById(element.getAttribute("href").slice(1));
    if (expandElement.offsetParent === null) {
        expandElement.parentElement.hidden = false;
        document.getElementById(`${expandElement.parentElement.id}-controller`).remove()
    }
    expandElement.scrollIntoView()
}


// Attach listeners
document.addEventListener('DOMContentLoaded', function () {
    Array.from(document.getElementsByClassName('onclick-vote')).forEach(element => {
        element.addEventListener('click', vote);
    });

    Array.from(document.getElementsByClassName('onclick-update-reddit-comments')).forEach(element => {
        element.addEventListener('click', updateRedditComments);
    });

    Array.from(document.getElementsByClassName('try-load-video')).forEach(element => {
        tryToLoadVideo(element);
    });

    Array.from(document.getElementsByClassName('onclick-collapse')).forEach(element => {
        element.addEventListener('click', collapse);
    });

    Array.from(document.getElementsByClassName('maybe-expand')).forEach(element => {
        element.addEventListener('click', maybeExpand);
    });
});