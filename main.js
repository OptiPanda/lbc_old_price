// ==UserScript==
// @name         Item Price History - LeBonCoin
// @namespace    http://tampermonkey.net/
// @version      2.1.3
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
                setTimeout(() => applyOldPrice(getPostId()), 700);
            }
        }
    );
}

(function() {
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

async function applyOldPrice4Article(article, postId) {
    const rawDatas = await getApiData(postId);
    const datas = JSON.parse(rawDatas);
    const oldDate = datas?.first_publication_date
    
    if (oldDate) {    
        const currentDate = datas?.index_date;

        displayOldDateInElement(article, postId, oldDate, currentDate);
    }
    
    const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value

    if (oldPrice) {
        const currentPrice = datas?.price[0];

        displayOldPriceInElement(article, postId, oldPrice, currentPrice);
    }

    enhanceArticleDescriptionDisplay(article);
    enhanceArticleCritereDisplay(article);
    moveAutoviza(article);
}

function enhanceArticleDescriptionDisplay(article) {
    const description = article.querySelector("[data-qa-id='adview_spotlight_description_container'] p");

    if (description?.innerHTML.indexOf("•") !== -1) {
        const splitChar = " • ";
        const oldDesc = description.innerHTML.split(splitChar);

        description.innerHTML = `<a id="goToMap" class="underline" title="Aller à la carte">`
        + article.querySelector("[data-title='PinOutline']").outerHTML.replace("fill-current text-current w-sz-16 h-sz-16 mr-sm mt-sm", "w-sz-16 h-sz-16 mr-sm inline-block")
        + oldDesc[0] + '</a>'
        + splitChar + oldDesc[1]
        + splitChar + oldDesc[2].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
        + splitChar + oldDesc[3]
        + (oldDesc[4] ? splitChar + oldDesc[4] : "")
        + (oldDesc[5] ? splitChar + oldDesc[5] : "");
        document.getElementById("goToMap").onclick = () => {document.getElementById("map").scrollIntoView();};
    }
}

function enhanceArticleCritereDisplay(article) {
    const critereKm = article.querySelector("[data-qa-id='criteria_item_mileage']");

    if (critereKm) {
        critereKm.innerHTML = critereKm.innerHTML.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
}

function moveAutoviza(article) {
    const divAutoviza = document.evaluate("//h2[contains(., 'Autoviza')]", article, null, XPathResult.ANY_TYPE, null).iterateNext()?.parentElement;

    if (divAutoviza) {
        const asideFirstChild = article.querySelector("aside>div")
        const newDiv = document.createElement("div");
        newDiv.innerHTML = "<"+asideFirstChild.firstChild.nodeName+" class='"+asideFirstChild.firstChild.classList+"'></"+asideFirstChild.firstChild.nodeName+">";
        newDiv.firstChild.appendChild(divAutoviza);
        newDiv.firstChild.firstChild.classList.remove("py-xl")
        asideFirstChild.after(newDiv);
    }
}

async function applyOldPrice4ListAds(allAdItems) {
    allAdItems.forEach(adItem => adItem.querySelector('[data-test-id="price"] > svg') && applyOldPrice4Ad(adItem));
}

async function applyOldPrice4Ad(adItem) {
    const adId = getAdId(adItem.getAttribute('href'));
    const rawDatas = await getApiData(adId);
    const datas = JSON.parse(rawDatas);
    const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value

    if (oldPrice) {
        const currentPrice = datas?.price[0];
    
        displayOldPriceInElement(adItem, adId, oldPrice, currentPrice);
    }
}

function displayOldPriceInElement(element, id, oldPrice, currentPrice) {
    const exist = document.getElementById("old_price_to_display_" + id);
    exist && document.removeChild(exist);

    const priceContainer = element.querySelectorAll('[data-qa-id="adview_price"], [data-test-id="price"]')[0];
    const currentPriceClass = [...priceContainer.firstChild.firstChild.classList].filter(c => c.indexOf("success") < 0);

    const divOldPrice = document.createElement("div");
    divOldPrice.setAttribute("id", "old_price_to_display_" + id);
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

function displayOldDateInElement(element, id, oldDate, currentDate) {    
    const exist = document.getElementById("old_date_to_display_" + id);
    exist && document.removeChild(exist);

    const dateContainer = element.querySelectorAll('[data-qa-id="adview_spotlight_description_container"] > div')[1];
    const currentDateClass = dateContainer.firstChild.classList;

    const divOldDate = document.createElement("div");
    divOldDate.setAttribute("id", "old_date_to_display_" + id);
    divOldDate.setAttribute("class", "flex flex-wrap items-center");

    const pOldDate = document.createElement("p");
    pOldDate.setAttribute("class", currentDateClass);
    pOldDate.innerHTML = "Mise en ligne le " + dateFormatter(oldDate);

    divOldDate.appendChild(pOldDate);
    
    if (oldDate !== currentDate) {
        const pCurrentDate = document.createElement("p");
        pCurrentDate.setAttribute("class", currentDateClass);
        pCurrentDate.innerHTML = "Mise à jour le " + dateFormatter(currentDate);
    
        divOldDate.appendChild(pCurrentDate);
        divOldDate.setAttribute("class", "flex flex-col");
    }

    dateContainer.removeChild(dateContainer.firstChild);
    dateContainer.appendChild(divOldDate);
}

function dateFormatter(dateString) {
    const dateObj = new Date(dateString);
  
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hour = dateObj.getHours();
    const minutes = dateObj.getMinutes();

    const gapInMs = new Date().getTime() - dateObj.getTime();
    const gapInDays = Math.floor(gapInMs / (1000 * 60 * 60 * 24));

    var formatedDate = `${day}/${month}/${year} à ${hour}h${minutes}`;

    if (gapInDays > 1) {
        formatedDate += ` ( ${gapInDays} jours )`;
    } else if (gapInDays == 1) {
        formatedDate += ` ( Hier )`;
    } else if (gapInDays == 0) {
        formatedDate += ` ( Aujourd'hui )`;
    }
  
    return formatedDate;
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