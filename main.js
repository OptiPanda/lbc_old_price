// ==UserScript==
// @name         Item Price History - LeBonCoin
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Extension permettant d'afficher l'ancien prix de vente d'un article sur le site LeBonCoin quand une baisse de prix est signalée
// @author       OptiPanda
// @match        https://www.leboncoin.fr/*/*
// @match        https://www.leboncoin.fr/offre/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leboncoin.fr
// @grant        none
// ==/UserScript==

if (typeof browser !== "undefined") {
    browser.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.message === 'lbc_old_price') {
                setTimeout(() => applyOldPrice(getPostId()), 1000);
            }
        }
    );
}

(function() {
    'use strict';
    setTimeout(() => applyOldPrice(getPostId()), 1000);
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

async function applyOldPrice4Article(article, postId) {
    const rawDatas = await getApiData(postId);
    const datas = JSON.parse(rawDatas);
    const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value

    if (!oldPrice) {
        console.log("LBC Price : no old price");
        return;
    }

    const currentPrice = datas?.price[0];

    displayOldPriceInElement(article, postId, oldPrice, currentPrice);

    console.log("LBC Price : old price ajouté");
}

async function applyOldPrice4ListAds(allAdItems) {
    allAdItems.forEach(adItem => adItem.querySelector('[data-test-id="price"] > svg') && applyOldPrice4Ad(adItem));
}

async function applyOldPrice4Ad(adItem) {
    const adId = getAdId(adItem.getAttribute('href'));
    const rawDatas = await getApiData(adId);
    const datas = JSON.parse(rawDatas);
    const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value

    if (!oldPrice) {
        console.log("LBC Price : no old price");
        return;
    }

    const currentPrice = datas?.price[0];

    displayOldPriceInElement(adItem, adId, oldPrice, currentPrice);

    console.log("LBC Price : old price ajouté");
}

function displayOldPriceInElement(element, id, oldPrice, currentPrice) {
    const exist = document.getElementById("old_price_to_display_" + id);
    exist && document.removeChild(exist);

    const priceContainer = element.querySelectorAll('[data-qa-id="adview_price"], [data-test-id="price"]')[0];
    const currentPriceClass = [...priceContainer.firstChild.classList].filter(c => c.indexOf("success") < 0);

    const divOldPrice = document.createElement("div");
    divOldPrice.setAttribute("id", "old_price_to_display");
    divOldPrice.setAttribute("class", "flex flex-wrap items-center");

    const pOldPrice = document.createElement("p");
    pOldPrice.setAttribute("class", [...currentPriceClass, "text-error", "mr-md"].join(' '));
    pOldPrice.innerHTML = oldPrice.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";

    divOldPrice.appendChild(pOldPrice);
    const divDiff = document.createElement("div");
    divDiff.setAttribute("class", "flex flex-col items-center mr-md");

    const reduction = (+currentPrice - +oldPrice);
    const percentReduce = reduction / oldPrice;
    const percentReduceDisplay = Math.round(percentReduce * 1000) / 10;

    const pDiffPercent = document.createElement("p");
    pDiffPercent.innerHTML = "" + percentReduceDisplay + "%";
    pDiffPercent.setAttribute("class", [...currentPriceClass, "text-basic"].join(' '));

    const svgArrow = priceContainer.querySelector('svg');
    svgArrow.classList.remove("ml-md");
    svgArrow.classList.remove("text-success");
    svgArrow.children[0].innerHTML = "Baisse de prix de " + (-reduction) + "€ (" + percentReduceDisplay + "%)";

    const pDiff = document.createElement("p");
    pDiff.innerHTML = (""+reduction).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
    pDiff.setAttribute("class", [...currentPriceClass, "text-basic"].join(' '));

    divDiff.appendChild(pDiffPercent);
    divDiff.appendChild(svgArrow);
    divDiff.appendChild(pDiff);

    divOldPrice.appendChild(divDiff);
    priceContainer.insertBefore(divOldPrice, priceContainer.firstChild);
    potentialRemainingSvg = priceContainer.querySelector("& > svg");
    potentialRemainingSvg && priceContainer.removeChild(potentialRemainingSvg);
}

function getPostId() {
    return getAdId(window.location.href);
}

function getAdId(url) {
    return url.split("/").pop().split('.')[0];
}

function getApiData(postId) {
    return new Promise(function (resolve, reject) {
        const apiUrl = 'https://api.leboncoin.fr/finder/classified/' + postId;
        const xhttp = new XMLHttpRequest();
        xhttp.onload = function() {
            resolve(this.responseText)
        }
        xhttp.open("GET", apiUrl, true);
        xhttp.send();
    });
}