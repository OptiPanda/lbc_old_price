// ==UserScript==
// @name         Item Price History - LeBonCoin
// @namespace    http://tampermonkey.net/
// @version      2.0.3
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

    if (!document.querySelector("article")) {
        console.log("Not an article");
        return;
    }

    const rawDatas = await getApiData(postId);
    const datas = JSON.parse(rawDatas);
    const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value

    if (!oldPrice) {
        console.log("no old price");
        return;
    }

    const currentPrice = datas?.price[0];

    displayOldPrice(oldPrice, currentPrice);

    console.log("old price ajouté");
}

function displayOldPrice(oldPrice, currentPrice) {
    const exist = document.getElementById("old_price_to_display");
    exist && document.removeChild(exist);

    const divOldPrice = document.createElement("div");
    divOldPrice.setAttribute("id", "old_price_to_display");
    divOldPrice.setAttribute("class", "flex flex-wrap items-center");

    const pOldPrice = document.createElement("p");
    pOldPrice.setAttribute("class", "text-headline-2 text-error mr-md");
    pOldPrice.innerHTML = oldPrice.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";

    divOldPrice.appendChild(pOldPrice);
    const divDiff = document.createElement("div");
    divDiff.setAttribute("class", "flex flex-col items-center mr-md");

    const reduction = (+currentPrice - +oldPrice);
    const percentReduce = reduction / oldPrice

    const pDiffPercent = document.createElement("p");
    pDiffPercent.innerHTML = ""+(Math.round(percentReduce*1000)/10)+"%";
    pDiffPercent.setAttribute("class", "text-body-2 font-bold");

    const svgArrow = document.querySelector('svg[data-title="baisse de prix"]');
    svgArrow.classList.remove("ml-md");
    svgArrow.classList.remove("text-success");
    svgArrow.children[0].innerHTML = "Baisse de prix de " + (-reduction) + "€";

    const pDiff = document.createElement("p");
    pDiff.innerHTML = (""+reduction).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
    pDiff.setAttribute("class", "text-body-2 font-bold");

    divDiff.appendChild(pDiffPercent);
    divDiff.appendChild(svgArrow);
    divDiff.appendChild(pDiff);

    divOldPrice.appendChild(divDiff);

    const parent = document.querySelector('article div[data-qa-id="adview_price"]');
    parent.insertBefore(divOldPrice, parent.firstChild);
    potentialRemainingSvg = parent.querySelector("& > svg");
    potentialRemainingSvg && parent.removeChild(potentialRemainingSvg);
}

function getPostId() {
    let url = window.location.href;
    const postId = url.split("/").pop().split('.')[0];
    
    return postId;
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