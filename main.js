if (chrome) {
    browser = chrome;
}

if (typeof browser !== "undefined") {
    browser.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.message === 'lbc_old_price') {
                setTimeout(() => applyOldPrice(getPostId()), 700);
            }
        }
    );
}

(function () {
    'use strict';
    setTimeout(() => applyOldPrice(getPostId()), 700);
})();

async function applyOldPrice(postId) {
    var article = document.querySelector("article");

    if (article) {
        applyOldPrice4Article(article, postId);
    }

    var allAdItems = document.querySelectorAll('[data-qa-id="aditem_container"]');

    if (allAdItems) {
        applyOldPrice4ListAds(allAdItems);
    }
}

function getPostId() {
    return getAdId(window.location.href);
}

function getAdId(url) {
    return url.split("/").pop().split('.')[0];
}

function getApiData(postId) {
    return fetch(new Request(`https://api.leboncoin.fr/finder/classified/${postId}`))
        .then((response) => response.json());
}