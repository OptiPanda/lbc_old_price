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
    
    try {
        enhanceArticleDescriptionDisplay(article);
    } catch (e) {console.error(e)}
    try {
        enhanceArticleCritereDisplay(article);
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
    const exist = element.querySelector("#old_date_to_display_" + id);
    if (exist) {
        exist.parentElement.removeChild(exist);
    }

    const dateContainer = element.querySelector('[data-qa-id="adview_spotlight_description_container"] p.text-caption').parentElement;
    const currentDateClass = dateContainer.firstChild.classList;

    const divOldDate = createDivOldDate(id, currentDateClass, oldDate, currentDate);

    dateContainer.removeChild(dateContainer.firstChild);
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
        + splitChar + oldDesc[2].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
        + (oldDesc[3] ? splitChar + oldDesc[3] : "")
        + (oldDesc[4] ? splitChar + oldDesc[4] : "")
        + (oldDesc[5] ? splitChar + oldDesc[5] : "");

        if (pin) {
            document.getElementById("goToMap").onclick = () => {document.getElementById("map").scrollIntoView({ behavior: "smooth"});};
        }
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
    }
}