function displayOldPriceInElement(element, id, oldPrice, currentPrice) {
    const exist = element.querySelector("#old_price_to_display_" + id);
    if (exist) {
        exist.parentElement.removeChild(exist);
    }

    const priceContainer = element.querySelectorAll('[data-qa-id="adview_price"], [data-test-id="price"]')[0];
    const currentPriceClass = [...priceContainer.querySelector('.text-success')?.classList].filter(c => c.indexOf("success") < 0);

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

function enhanceAdMileage(adItem) {
    const pMileage = document.evaluate(".//p[text()='Kilométrage']", adItem, null, XPathResult.ANY_TYPE, null).iterateNext()?.nextSibling;
    if (pMileage) {
        pMileage.innerHTML = pMileage.innerHTML.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
        formatedDate += ` ( Aujourd'hui )`;
    }
  
    return formatedDate;
}