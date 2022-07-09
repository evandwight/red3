"use strict";

function vote(event) {
    event.preventDefault();
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    var element = event.currentTarget;
    var url = element.getAttribute("href");
    var id = element.children[0].getAttribute("id").substring("vote-up-".length)
    var upImg = document.getElementById('vote-up-'+id)
    var downImg = document.getElementById('vote-dn-'+id)

    function imageSrc(isUp, isActive) {
       return `/static/main/images/arrow-${isUp ? "up" : "down"}-line${isActive ? "-active" : "" }.svg`
    } 


    const request = new Request(
        url,
        {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
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

// Attach listeners
document.addEventListener('DOMContentLoaded', function () {
    Array.from(document.getElementsByClassName('onclick-vote')).forEach(element => {
        element.addEventListener('click', vote);
    });
});