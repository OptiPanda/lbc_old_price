async function applyOldPrice4Article(article) {
    const postId = getPostId();
    if (!!currentPostId && currentPostId != postId) {
        location.reload();
        return;
    }
    currentPostId = postId;
    const datas = await getApiData(postId);
    const oldDate = datas?.first_publication_date

    try {
        const currentDate = datas?.index_date;
        if (oldDate) {
            displayOldDateInElement(article, postId, oldDate, currentDate);
        } else {
            displayOldDateInElement(article, postId, currentDate, currentDate)
        }
    } catch (e) {err(e)}

    try {
        const currentPrice = datas?.price[0];
        const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value

        if (oldPrice) {
            displayOldPriceInElement(article, postId, oldPrice, currentPrice);
        } else {
            displayCurrentPriceInElement(article, postId, currentPrice);
        }
    } catch (e) {err(e)}

    try {
        enhanceArticleDescriptionDisplay(article);
    } catch (e) {err(e)}
    try {
        enhanceArticleCritereDisplay(article, datas);
    } catch (e) {err(e)}
    try {
        enhanceAdviewSticky();
    } catch (e) {err(e)}

    try {
        moveLesPLus(article);
    } catch (e) {err(e)}
    try {
        movePackSerenite(article);
    } catch (e) {err(e)}
    try {
        moveAutoviza(article);
    } catch (e) {err(e)}
    try {
        moveProtection(article);
    } catch (e) {err(e)}
}

function displayOldDateInElement(element, id, oldDate, currentDate) {
    const exist = element.querySelector('[id^="old_date_to_display_"]');
    if (exist) {
        exist.parentElement.removeChild(exist);
        element.querySelector('[old_date_to_redisplay="true"]')?.removeAttribute("style");
    }

    const referenceTags = Array.from(document.querySelectorAll('[data-qa-id="adview_spotlight_description_container"] [data-spark-component="tag"]'));
    for (element of referenceTags) {
        if (element.id === "date-tag") {
            err("Date tag already exists");
            return;
        }
    }
    const referenceTag = referenceTags[0];
    const dateContainer = referenceTag?.parentElement;

    if (!dateContainer) {
        err('Cannot find date Container');
        return;
    }

    const cleanDate = new Date(currentDate);

    const spanDateTag = createDateTag(cleanDate);

    dateContainer.insertBefore(spanDateTag, referenceTag);
}

function enhanceArticleDescriptionDisplay(article) {
    const description = article.querySelector("[data-qa-id='adview_spotlight_description_container'] p");

    if (description?.innerHTML.indexOf("•") !== -1 && description?.innerHTML.indexOf("goToMap") === -1)  {
        const splitChar = " • ";
        const oldDesc = description.innerHTML.split(splitChar);

        var place = `<a id="goToMap" class="underline inline-flex" title="Aller à la carte">${getPinSvgElement() + oldDesc[0]}</a>`;

        description.innerHTML =
        place
        + splitChar + oldDesc[1]
        + splitChar + spaceDigits(oldDesc[2])
        + (oldDesc[3] ? splitChar + oldDesc[3] : "")
        + (oldDesc[4] ? splitChar + oldDesc[4] : "")
        + (oldDesc[5] ? splitChar + oldDesc[5] : "");

        document.getElementById("goToMap").onclick = () => {
            window.scrollTo({
                behavior: 'smooth',
                top: document.getElementsByClassName("LazyLoad")[0].getBoundingClientRect().top - document.body.getBoundingClientRect().top - 56,
            });
        };
    }
}

function enhanceArticleCritereDisplay(article, datas) {
    // const critereKm = article.querySelector("[data-qa-id='criteria_item_mileage']");
    // const kmAge = datas?.attributes?.filter(o => o.key === 'mileage')[0]?.value;
    // const dateMes = datas?.attributes?.filter(o => o.key === 'issuance_date')[0]?.value;
    const dateMes = Date.parse(datas?.first_publication_date);
    var mDiff = 0;
    if (dateMes) {
        mDiff = monthDiff(new Date(dateMes), new Date());
    }

    // if (critereKm) {
    //     critereKm.querySelector("div").innerHTML = spaceDigits(critereKm.querySelector("div").innerHTML);

    //     const kmPan = critereKm.cloneNode(true);

    //     const exist = article.querySelector("[data-qa-id='criteria_monthly_mileage']")
    //     if (exist) {
    //         exist.parentElement.removeChild(exist);
    //     }

    //     if (kmAge && dateMes && mDiff) {
    //         kmPan.setAttribute("data-qa-id", "criteria_monthly_mileage")
    //         kmPan.querySelector("div").innerHTML = spaceDigits(kmPan.querySelector("div").innerHTML.replaceAll(`${spaceDigits(kmAge)} km`, `${Math.round(kmAge/mDiff)} km/mois`).replaceAll("Kilométrage", "Kilomètres/mois estimés"));
    //         critereKm.parentElement.insertBefore(kmPan, critereKm.nextSibling);
    //     }
    // }

    const critereDatePmes = article.querySelector("[data-qa-id='criteria_item_issuance_date']");

    if (critereDatePmes && dateMes) {
        const age = mDiff/12;
        critereDatePmes.innerHTML = critereDatePmes.innerHTML.replaceAll(dateMes, `${dateMes} (${Math.round(age * 10) / 10} an${age > 1 ? 's' : ''})`);
    }
}

function moveAutoviza(article) {
    const divAutoviza = document.evaluate("//h2[contains(., 'Autoviza')]", article, null, XPathResult.ANY_TYPE, null).iterateNext()?.parentElement;

    moveDivAside(article, divAutoviza, "autoviza");
}

function moveProtection(article) {
    const divProtection = document.evaluate("//section[contains(., 'Protection leboncoin')]", article, null, XPathResult.ANY_TYPE, null).iterateNext();

    moveDivAside(article, divProtection, "protection");
}

function movePackSerenite(article) {
    const divPackSerenite = document.evaluate("//p[contains(., 'Pack Sérénité*')]", article, null, XPathResult.ANY_TYPE, null).iterateNext()?.parentElement?.parentElement;

    moveDivAside(article, divPackSerenite, "packseren");
}

function moveLesPLus(article) {
    const divLesPlus = document.evaluate("//h2[contains(., 'Les + de cette annonce')]", article, null, XPathResult.ANY_TYPE, null).iterateNext()?.parentElement;

    moveDivAside(article, divLesPlus, "lesplus");
}

function moveDivAside(container, div, type) {
    if (div && !document.querySelector(`[lbc_old_price_move='${type}']`)) {

        div.classList.remove("py-xl","border-b-sm","border-outline")
        const asideRefSection = container.querySelector("aside section");
        const newDiv = document.createElement("div");
        newDiv.setAttribute(`lbc_old_price_move`,type)
        newDiv.innerHTML = `<${asideRefSection.nodeName} class='${asideRefSection.classList}'></${asideRefSection.nodeName}>`;
        newDiv.firstChild.appendChild(div);
        asideRefSection.after(newDiv);
    }
}

function enhanceAdviewSticky() {
    const adviewSticky = document.querySelector("[data-test-id='adview_container']");

    if (adviewSticky && !adviewSticky.classList?.contains("cursor-pointer")) {
        adviewSticky.classList.add("cursor-pointer")
        adviewSticky.setAttribute("style", "width: -webkit-fill-available")
    }
}

function getPinSvgElement() {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="w-sz-16 h-sz-16 mr-sm inline-block" data-spark-component="icon" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.3754 8.89783C15.3754 10.7038 13.8643 12.1678 12.0003 12.1678C10.1363 12.1678 8.6252 10.7038 8.6252 8.89783C8.6252 7.09187 10.1363 5.62785 12.0003 5.62785C13.8643 5.62785 15.3754 7.09187 15.3754 8.89783ZM13.3044 8.89783C13.3044 9.59562 12.7205 10.1613 12.0003 10.1613C11.2801 10.1613 10.6962 9.59562 10.6962 8.89783C10.6962 8.20004 11.2801 7.63437 12.0003 7.63437C12.7205 7.63437 13.3044 8.20004 13.3044 8.89783Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.00024C7.58172 2.00024 4 5.47039 4 9.75102C4 10.8868 4.41304 12.2052 4.97459 13.4754C5.5461 14.7681 6.31556 16.1078 7.12222 17.3163C7.92805 18.5235 8.78895 19.6265 9.55506 20.44C9.9359 20.8445 10.3142 21.1998 10.6676 21.4625C10.8442 21.5938 11.0353 21.7176 11.2346 21.8123C11.4223 21.9016 11.6899 22.0002 12 22.0002C12.3101 22.0002 12.5777 21.9016 12.7654 21.8123C12.9647 21.7176 13.1558 21.5938 13.3324 21.4625C13.6858 21.1998 14.0641 20.8445 14.4449 20.44C15.211 19.6265 16.0719 18.5235 16.8778 17.3163C17.6844 16.1078 18.4539 14.7681 19.0254 13.4754C19.587 12.2052 20 10.8868 20 9.75102C20 5.47039 16.4183 2.00024 12 2.00024ZM6.07104 9.75102C6.07104 6.57856 8.72552 4.00676 12 4.00676C15.2745 4.00676 17.929 6.57856 17.929 9.75102C17.929 10.4785 17.6468 11.4975 17.1217 12.6853C16.6065 13.8506 15.8978 15.0894 15.1387 16.2266C14.3788 17.3651 13.5862 18.3749 12.915 19.0877C12.5772 19.4464 12.2909 19.7076 12.0715 19.8707C12.0456 19.89 12.0218 19.907 12 19.922C11.9782 19.907 11.9544 19.89 11.9285 19.8707C11.7091 19.7076 11.4228 19.4464 11.085 19.0877C10.4138 18.3749 9.62122 17.3651 8.86127 16.2266C8.10215 15.0894 7.39349 13.8506 6.87834 12.6853C6.35322 11.4975 6.07104 10.4785 6.07104 9.75102Z"></path></svg>`;
}