// ==UserScript==
// @name         Item Price History - LeBonCoin
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Extension permettant d'afficher l'ancien prix de vente d'un article sur le site LeBonCoin quand une baisse de prix est signalée
// @author       OptiPanda
// @match        https://www.leboncoin.fr/*/*
// @match        https://www.leboncoin.fr/offre/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leboncoin.fr
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    doYourThing();
})();

function doYourThing() {

    const jsonDatas = JSON.parse(document.getElementById("__NEXT_DATA__").innerHTML)
    const oldPrice = jsonDatas?.props.pageProps.ad.attributes.filter(o => o.key === 'old_price')[0]?.value;

    if(!oldPrice) {
     return;
    }

    const currentPrice = jsonDatas?.props.pageProps.ad.price;

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
    divDiff.setAttribute("class", "flex flex-col items-center");

    const pDiff = document.createElement("p");
    pDiff.innerHTML = "(" + (""+(+currentPrice - +oldPrice)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €)";
    pDiff.setAttribute("class", "text-subhead mr-md");

    const svgArrow = document.querySelector('[data-title="baisse de prix"]');
    svgArrow.classList.remove("ml-md");
    svgArrow.classList.remove("text-success");

    divDiff.appendChild(pDiff);
    divDiff.appendChild(svgArrow);

    divOldPrice.appendChild(divDiff);

    const parent = document.querySelector('article div[data-qa-id="adview_price"]');
    parent.insertBefore(divOldPrice, parent.firstChild);
    parent.removeChild(svgArrow);
}