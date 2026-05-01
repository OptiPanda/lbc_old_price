if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
    var browser = chrome;
}

var currentPostId = "";

if (typeof browser !== 'undefined') {
    browser.runtime.onMessage.addListener(function(request) {
        if (request.message === 'lbc_old_price') {
            start();
        }
    });
}

(function() {
    'use strict';
    start();
})();

function start() {
    waitForPageContent().then(applyOldPrice);
}

// Attend que le DOM soit stable (React hydration terminée) avant d'appliquer
function waitForPageContent() {
    return new Promise((resolve) => {
        if (document.querySelector("article#grid, [data-qa-id='aditem_container']")) {
            waitForDomStability(resolve);
            return;
        }
        const observer = new MutationObserver(() => {
            if (document.querySelector("article#grid, [data-qa-id='aditem_container']")) {
                observer.disconnect();
                waitForDomStability(resolve);
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        setTimeout(() => { observer.disconnect(); resolve(); }, 5000);
    });
}

// Attend 800ms sans mutation DOM avant de résoudre (laisse React finir son re-render)
function waitForDomStability(resolve) {
    const DELAY = 800;
    let timer = setTimeout(() => { obs.disconnect(); resolve(); }, DELAY);
    const obs = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(() => { obs.disconnect(); resolve(); }, DELAY);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
}

async function applyOldPrice() {
    const opts = await getOptions();

    const article = document.querySelector("article#grid");
    if (article) {
        applyOldPrice4Article(article, opts);
    }

    const allAdItems = document.querySelectorAll('[data-qa-id="aditem_container"]');
    if (allAdItems.length > 0) {
        applyOldPrice4ListAds(allAdItems, opts);
    }
}
