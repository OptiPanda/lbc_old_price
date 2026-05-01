async function applyOldPrice4ListAds(allAdItems, opts) {
    await Promise.all([...allAdItems].map(adItem => applyOldPrice4Ad(adItem, opts)));
}

async function applyOldPrice4Ad(adItem, opts) {
    const adId = getAdId(adItem.querySelector('[href]').getAttribute('href'));
    const datas = await getApiData(adId);

    const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value;
    const currentPrice = datas?.price?.[0];

    if (opts.showOldPrice && oldPrice) {
        displayOldPriceInElement(adItem, adId, oldPrice, currentPrice);

        if (opts.showBadge) {
            const pct = Math.round((+oldPrice - +currentPrice) / +oldPrice * 100);
            if (pct >= opts.badgeThreshold) {
                addPriceDropBadge(adItem, pct);
            }
        }
    }

    const oldDate = datas?.first_publication_date;
    if (opts.showDates && oldDate) {
        displayOldDateInAds(adItem, adId, oldDate, datas?.index_date);
    }

    if (opts.showMileage) {
        enhanceAdMileage(adItem);
    }
}

function addPriceDropBadge(adItem, pct) {
    if (adItem.querySelector('.lbc_badge_drop')) return;
    const carousel = adItem.querySelector('[data-spark-component="carousel"]');
    if (!carousel) return;

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

    const insertAfter = ad.querySelector('[data-test-id="image"]~div[class^="adcard_"]>div.flex')?.firstChild
        || Array.from(ad.querySelectorAll('p[aria-hidden="true"]')).find(el => /\d[\d\s]*\s*€/.test(el.textContent));

    if (insertAfter) {
        const divOldDate = createDivOldDate(adId, "flex flex-wrap overflow-hidden mt-sm text-caption text-neutral", oldDate, currentDate);
        insertAfter.after(divOldDate);
    }
}
