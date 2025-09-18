function err(a) {
    console.error("[LBC_Old_Price | ERROR] - ", a);
}

function log(a) {
    console.log("[LBC_Old_Price | INFO] - ", a)
}

function displayOldPriceInElement(element, id, oldPrice, currentPrice) {
    const exist = element.querySelector('[id^="old_price_to_display_"]');
    if (exist) {
        exist.parentElement.removeChild(exist);
    }

    const priceContainer = element.querySelectorAll('[data-qa-id="adview_price"], [data-test-id="price"]')[0];

    const reduction = (+currentPrice - +oldPrice);
    const percentReduce = reduction / oldPrice;
    const percentReduceDisplay = Math.round(percentReduce * 1000) / 10;

    priceContainer.setAttribute('style', 'display:none');

    priceContainer.insertAdjacentHTML('beforebegin', `
    <div id="old_price_to_display_${id}" class="flex flex-wrap items-center mr-md">
        <div class="mr-md flex flex-wrap items-center justify-between">
            <div class="flex">
                <p class="text-headline-2 text-success">${spaceDigits(currentPrice)}&nbsp;€</p>&nbsp;
                <svg viewBox="0 0 24 24" data-title="Baisse de prix" fill="currentColor" stroke="none" class="text-success fill-current shrink-0 w-sz-24 h-sz-24" data-spark-component="icon" aria-hidden="true" focusable="false">
                    <title>Baisse de prix de ${spaceDigits(reduction)}&nbsp;€ (${percentReduceDisplay}%)</title>
                    <path fill-rule="evenodd" d="m2.29,6.3c.39-.4,1.02-.4,1.41,0l4.83,4.96,2.97-3.05c.32-.32.74-.5,1.18-.5s.87.18,1.18.5h0s6.12,6.28,6.12,6.28v-3.21c0-.57.45-1.03,1-1.03s1,.46,1,1.03v5.68c0,.57-.45,1.03-1,1.03h-5.54c-.55,0-1-.46-1-1.03s.45-1.03,1-1.03h3.12l-5.89-6.05-2.97,3.05c-.32.32-.74.5-1.18.5s-.87-.18-1.18-.5h0S2.29,7.75,2.29,7.75c-.39-.4-.39-1.05,0-1.45Z"></path>
                </svg>
            </div>
        </div>
        <div class="text-error line-through" role="deletion">${spaceDigits(oldPrice)}&nbsp;€</div>
        <span data-spark-component="tag"
            class="box-border inline-flex items-center justify-center gap-sm whitespace-nowrap text-caption font-bold h-sz-20 px-md rounded-full border-sm border-current text-support ml-sm">
            ${spaceDigits(reduction)} € (${percentReduceDisplay}%)
        </span>
    </div>
    `.trim());
}

function displayCurrentPriceInElement(element, id, currentPrice) {
    const exist = element.querySelector('[id^="old_price_to_display_"]');
    if (exist) {
        exist.parentElement.removeChild(exist);
    }

    const priceContainer = element.querySelectorAll('[data-qa-id="adview_price"], [data-test-id="price"]')[0];

    priceContainer.setAttribute('style', 'display:none');

    priceContainer.insertAdjacentHTML('beforebegin', `
    <div id="old_price_to_display_${id}" class="flex flex-wrap items-center mr-md">
        <div class="mr-md flex flex-wrap items-center justify-between">
            <div class="flex">
                <p class="text-headline-2">${spaceDigits(currentPrice)}&nbsp;€</p>&nbsp;
            </div>
        </div>
    </div>
    `.trim());
}


function enhanceAdMileage(adItem) {
    const pMileage = document.evaluate(".//p[text()='Kilométrage']", adItem, null, XPathResult.ANY_TYPE, null).iterateNext()?.nextSibling;
    if (pMileage) {
        pMileage.innerHTML = spaceDigits(pMileage.innerHTML);
    }
}

function createDivOldDate(id, currentDateClass, oldDate, currentDate) {
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

    return divOldDate;
}

function createDateTag(date) {
    const tag = document.createElement("span");
    tag.setAttribute("id", "date-tag");
    tag.setAttribute("class", "box-border default:inline-flex default:w-fit items-center justify-center gap-sm whitespace-nowrap text-caption font-bold px-md h-sz-20 rounded-full bg-support-container text-on-support-container mr-md");
    tag.setAttribute("data-spark-component", "tag");

    try {
        tag.innerHTML = "Publié le " + date.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    } catch (e) {
        alert(e);
    }
    return tag;
}

function dateFormatter(dateString) {
    const dateObj = new Date(dateString);

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hour = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    const gapInMs = new Date().getTime() - dateObj.getTime();
    const gapInDays = Math.floor(gapInMs / (1000 * 60 * 60 * 24));

    var formatedDate = `${day}/${month}/${year} à ${hour}h${minutes}`;

    if (gapInDays > 1) {
        formatedDate += ` ( ${gapInDays} jours )`;
    } else if (gapInDays == 1) {
        formatedDate += ` ( Hier )`;
    } else if (gapInDays == 0) {
        if (day === new Date().getDate().toString().padStart(2, '0')) {
            formatedDate += ` ( Aujourd'hui )`;
        } else {
            formatedDate += ` ( Hier )`;
        }
    }

    return formatedDate;
}

function monthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

function spaceDigits(digits) {
    return (digits + "").replaceAll(/\B(?=(\d{3})+(?!\d))/g, " ")
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