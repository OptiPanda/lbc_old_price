if (chrome) {
    browser = chrome;
}

var currentPostId = "";

if (typeof browser !== "undefined") {
    browser.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.message === 'lbc_old_price') {
                start();
            }
        }
    );
}

(function () {
    'use strict';
    start();
})();

function start() {
    setTimeout(() => applyOldPrice(), 700)
}

function applyOldPrice() {
    var article = document.querySelector("article#grid");

    if (article) {
        applyOldPrice4Article(article);
    }

    var allAdItems = document.querySelectorAll('[data-qa-id="aditem_container"]');

    if (allAdItems) {
        applyOldPrice4ListAds(allAdItems);
    }
}