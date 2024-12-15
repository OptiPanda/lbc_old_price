async function applyOldPrice4ListAds(allAdItems) {
    allAdItems.forEach(adItem => {
        applyOldPrice4Ad(adItem);
    });
}

async function applyOldPrice4Ad(adItem) {
    const adId = getAdId(adItem.getAttribute('href'));
    const datas = await getApiData(adId);
    const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value

    if (oldPrice) {
        const currentPrice = datas?.price[0];
    
        displayOldPriceInElement(adItem, adId, oldPrice, currentPrice);
    }

    const oldDate = datas?.first_publication_date
    
    if (oldDate) {    
        const currentDate = datas?.index_date;

        displayOldDateInAds(adItem, adId, oldDate, currentDate);
    }

    enhanceAdMileage(adItem);
}

function displayOldDateInAds(ad, adId, oldDate, currentDate) {
    const exist = ad.querySelector("old_date_to_display_" + adId);
    if (exist) {
        exist.parentElement.removeChild(exist);
    }

    const dateContainer = ad.querySelector('[data-test-id="ad-params-labels"]')?.parentElement;
    if (dateContainer) {
        dateContainer.classList.add("flex-col")
        const targetClass = "flex flex-wrap overflow-hidden mt-sm text-caption text-neutral";
    
        const divOldDate = createDivOldDate(adId, targetClass, oldDate, currentDate);
    
        dateContainer.appendChild(divOldDate);
    }
}