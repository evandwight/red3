"use strict";

function vote(event) {
    event.preventDefault();
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    var element = event.currentTarget;
    var url = element.getAttribute("href");
    var id = element.children[0].getAttribute("id").substring("vote-up-".length)
    var upImg = document.getElementById('vote-up-' + id)
    var downImg = document.getElementById('vote-dn-' + id)

    function imageSrc(isUp, isActive) {
        return `/static/main/images/arrow-${isUp ? "up" : "down"}-line${isActive ? "-active" : ""}.svg`
    }


    const request = new Request(
        url,
        {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            mode: 'same-origin' // Do not send CSRF token to another domain.
        }
    );

    fetch(request).then(function (response) {
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
        console.log(error);
    });
}

function getIconHref(divElementId) {
    try {
        return document.getElementById(divElementId).children[0].getAttribute('href');
    } catch (error) {
        return null;
    }
}

function tryToLoadVideo(expandElement, redditUrl) {
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
        video.style = "width: 75%; max-height: 100vh; margin-left: auto; margin-right: auto;";
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
}

function expand(event) {
    event.preventDefault();
    var element = event.currentTarget;
    var postId = element.getAttribute("data-post-id");
    var url = getIconHref(`external-link-${postId}`);
    var redditUrl = getIconHref(`reddit-link-${postId}`);
    var expandElement = document.getElementById(`expand-${postId}`)
    if (expandElement.children.length == 0 && url.startsWith("https://v.redd.it/")) {
        tryToLoadVideo(expandElement, redditUrl);
    }

    expandElement.hidden = !expandElement.hidden
}

function collapse(event) {
    event.preventDefault();
    var element = event.currentTarget;
    var expandElement = document.getElementById(element.getAttribute("href").slice(1));
    expandElement.hidden = false;
    element.parentElement.parentElement.remove()
}


// Attach listeners
document.addEventListener('DOMContentLoaded', function () {
    Array.from(document.getElementsByClassName('onclick-vote')).forEach(element => {
        element.addEventListener('click', vote);
    });

    Array.from(document.getElementsByClassName('onclick-expand')).forEach(element => {
        element.addEventListener('click', expand);
    });

    Array.from(document.getElementsByClassName('onclick-collapse')).forEach(element => {
        element.addEventListener('click', collapse);
    });
});