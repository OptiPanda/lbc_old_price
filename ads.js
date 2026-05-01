async function applyOldPrice4ListAds(allAdItems, opts) {
    await Promise.all([...allAdItems].map(adItem => applyOldPrice4Ad(adItem, opts)));
}

async function applyOldPrice4Ad(adItem, opts) {
    const adId = getAdId(adItem.querySelector('[href]').getAttribute('href'));
    const datas = await getApiData(adId);

    const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value;
    const currentPrice = datas?.price?.[0];

    const oldDate = datas?.first_publication_date;
    if (opts.showDates && oldDate) {
        displayOldDateInAds(adItem, adId, oldDate, datas?.index_date);
    }

    if (opts.showOldPrice && oldPrice) {
        displayOldPriceInElement(adItem, adId, oldPrice, currentPrice);

        if (opts.showBadge) {
            const pct = Math.round((+oldPrice - +currentPrice) / +oldPrice * 100);
            debug('badge: adId=' + adId + ' pct=' + pct + ' threshold=' + opts.badgeThreshold + ' show=' + (pct >= opts.badgeThreshold));
            if (pct >= opts.badgeThreshold) {
                addPriceDropBadge(adItem, pct);
            }
        }
    }

    if (opts.showMileage) {
        enhanceAdMileage(adItem);
    }
}

function addPriceDropBadge(adItem, pct) {
    if (adItem.querySelector('.lbc_badge_drop')) {
        return;
    }
    const carousel = adItem.querySelector('[data-spark-component="carousel"]');
    if (!carousel) {
        debug('badge: carousel introuvable dans adItem');
        return;
    }

    const imgContainer = carousel.parentElement; // relative h-full, sans overflow-hidden

    const badge = document.createElement('div');
    badge.className = 'lbc_badge_drop';
    badge.style.cssText = [
        'position:absolute', 'top:10px', 'left:10px',
        'background:#e84040', 'color:#fff',
        'font-size:22px', 'font-weight:bold',
        'padding:4px 16px', 'border-radius:20px',
        'z-index:10', 'pointer-events:none',
        'box-shadow:0 1px 4px rgba(0,0,0,.3)',
        'line-height:36px'
    ].join(';');
    badge.textContent = `-${pct}%`;

    imgContainer.appendChild(badge);
}

function displayOldDateInAds(ad, adId, oldDate, currentDate) {
    const exist = ad.querySelector("[id^='old_date_to_display_']");
    if (exist) exist.remove();

    const priceRegex = /\d[\d\s]*\s*€/;
    const priceContainer = Array.from(ad.querySelectorAll('p[aria-hidden="true"]')).find(el => priceRegex.test(el.textContent)).parentElement.parentElement;
    const descContainer = priceContainer.parentElement;

    let tagsContainer;
    const descriptionTags = Array.from(descContainer.querySelectorAll('[data-spark-component="tag"]'));
    if (descriptionTags.length > 0) {
        tagsContainer = descriptionTags[0].parentElement;
    } else {
        tagsContainer = document.createElement("div");
        tagsContainer.setAttribute("class", "gap-md flex flex-wrap items-center empty:hidden");
        descContainer.insertBefore(tagsContainer, priceContainer.nextSibling); // Equivalent insertAfter
    }

    if (!tagsContainer) {
        err('Cannot find date Container');
        return;
    }

    if (currentDate !== oldDate) {
        const spanModified = createDateTag("Modifié le ", new Date(currentDate));
        if (spanModified) {
            spanModified.setAttribute("id", "old_date_to_display_modified");
            tagsContainer.prepend(spanModified);
        }
    }

    if (oldDate) {
        const spanPublished = createDateTag("Publié le ", new Date(oldDate));
        if (spanPublished) {
            spanPublished.setAttribute("id", "old_date_to_display_published");
            tagsContainer.prepend(spanPublished);
        }
    }
}
