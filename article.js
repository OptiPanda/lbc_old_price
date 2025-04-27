async function applyOldPrice4Article(article, postId) {
    const datas = await getApiData(postId);
    const oldDate = datas?.first_publication_date
    
    const currentDate = datas?.index_date;
    if (oldDate) {    
        displayOldDateInElement(article, postId, oldDate, currentDate);
    } else {
        displayOldDateInElement(article, postId, currentDate, currentDate)
    }
    
    const currentPrice = datas?.price[0];
    const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value

    if (oldPrice) {
        displayOldPriceInElement(article, postId, oldPrice, currentPrice);
    } else {
        displayCurrentPriceInElement(article, postId, currentPrice);
    }
    
    try {
        enhanceArticleDescriptionDisplay(article);
    } catch (e) {console.error(e)}
    try {
        enhanceArticleCritereDisplay(article, datas);
    } catch (e) {console.error(e)}
    try {
        enhanceAdviewSticky();
    } catch (e) {console.error(e)}
    try {
        movePackSerenite(article);
    } catch (e) {console.error(e)}
    try {
        moveAutoviza(article);
    } catch (e) {console.error(e)}
}

function displayOldDateInElement(element, id, oldDate, currentDate) {
    const exist = element.querySelector('[id^="old_date_to_display_"]');
    if (exist) {
        exist.parentElement.removeChild(exist);
    }

    const dateContainer = element.querySelector('[data-qa-id="adview_spotlight_description_container"] p.text-caption.opacity-dim-1').parentElement;
    const currentDateClass = dateContainer.firstChild.classList;

    const divOldDate = createDivOldDate(id, currentDateClass, oldDate, currentDate);

    dateContainer.firstChild.setAttribute("style", "display:none");
    dateContainer.insertBefore(divOldDate, dateContainer.firstChild);
}

function enhanceArticleDescriptionDisplay(article) {
    const description = article.querySelector("[data-qa-id='adview_spotlight_description_container'] p");

    if (description?.innerHTML.indexOf("•") !== -1 && description?.innerHTML.indexOf("goToMap") === -1)  {
        const splitChar = " • ";
        const oldDesc = description.innerHTML.split(splitChar);

        const pin = article.querySelector("[data-title='PinOutline']");
        var place;

        if (pin) {
            place = `<a id="goToMap" class="underline inline-flex" title="Aller à la carte">`
            + pin.outerHTML.replace("fill-current text-current w-sz-16 h-sz-16 mr-sm mt-sm", "w-sz-16 h-sz-16 mr-sm inline-block")
            + oldDesc[0] + '</a>';
        } else {
            place = oldDesc[0];
        }

        description.innerHTML = 
        place
        + splitChar + oldDesc[1]
        + splitChar + spaceDigits(oldDesc[2])
        + (oldDesc[3] ? splitChar + oldDesc[3] : "")
        + (oldDesc[4] ? splitChar + oldDesc[4] : "")
        + (oldDesc[5] ? splitChar + oldDesc[5] : "");

        if (pin) {
            document.getElementById("goToMap").onclick = () => {document.getElementById("map").scrollIntoView({ behavior: "smooth"});};
        }
    }
}

function enhanceArticleCritereDisplay(article, datas) {
    const critereKm = article.querySelector("[data-qa-id='criteria_item_mileage']");
    const kmAge = datas?.attributes?.filter(o => o.key === 'mileage')[0]?.value;
    const dateMes = datas?.attributes?.filter(o => o.key === 'issuance_date')[0]?.value;
    var mDiff = 0;
    if (dateMes) {
        mDiff = monthDiff(new Date(dateMes.split('/')[0]+"/01/"+dateMes.split('/')[1]), new Date());
    }

    if (critereKm) {
        const kmPan = critereKm.cloneNode(true);
        
        const exist = article.querySelector("[data-qa-id='criteria_monthly_mileage']")
        if (exist) {
            exist.parentElement.removeChild(exist);
        }

        if (kmAge && dateMes && mDiff) {
            kmPan.setAttribute("data-qa-id", "criteria_monthly_mileage")
            kmPan.innerHTML = spaceDigits(kmPan.innerHTML.replaceAll(`${kmAge} km`, `${Math.round(kmAge/mDiff)} km/mois`).replaceAll("Kilométrage", "Kilomètres/mois estimés"));
            critereKm.parentElement.insertBefore(kmPan, critereKm.nextSibling);
        }
        critereKm.innerHTML = spaceDigits(critereKm.innerHTML);
    }

    const critereDatePmes = article.querySelector("[data-qa-id='criteria_item_issuance_date']");

    if (critereDatePmes && dateMes) {
        const age = mDiff/12;
        critereDatePmes.innerHTML = critereDatePmes.innerHTML.replaceAll(dateMes, `${dateMes} (${Math.round(age * 10) / 10} an${age > 1 ? 's' : ''})`);
    }
}

function moveAutoviza(article) {
    const divAutoviza = document.evaluate("//h2[contains(., 'Autoviza')]", article, null, XPathResult.ANY_TYPE, null).iterateNext()?.parentElement;

    moveDivAside(article, divAutoviza);
}

function movePackSerenite(article) {
    const divPackSerenite = document.evaluate("//p[contains(., 'Pack Sérénité*')]", article, null, XPathResult.ANY_TYPE, null).iterateNext()?.parentElement?.parentElement;

    moveDivAside(article, divPackSerenite);
}

function moveDivAside(container, div) {
    if (div) {
        const asideFirstChild = container.querySelector("aside>div")
        const newDiv = document.createElement("div");
        newDiv.innerHTML = `<${asideFirstChild.firstChild.nodeName} class='${asideFirstChild.firstChild.classList}'></${asideFirstChild.firstChild.nodeName}>`;
        newDiv.firstChild.appendChild(div);
        newDiv.firstChild.firstChild.classList.remove("py-xl")
        asideFirstChild.after(newDiv);
    }
}

function enhanceAdviewSticky() {
    const adviewSticky = document.querySelector("[data-test-id='adview_container']");

    if (adviewSticky && !adviewSticky.classList?.contains("cursor-pointer")) {
        adviewSticky.classList.add("cursor-pointer")
        adviewSticky.setAttribute("style", "width: -webkit-fill-available")
    }
}