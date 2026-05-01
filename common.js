const extApi = (typeof browser !== 'undefined') ? browser : chrome;

function err(a) { console.error("[LBC_Old_Price | ERROR] - ", a); }
function log(a) { console.log("[LBC_Old_Price | INFO] - ", a); }

// --- Options ---

const DEFAULT_OPTIONS = {
    showOldPrice: true,
    showDates: true,
    showMileage: true,
    showBadge: true,
    showHistory: true,
    showCopyButton: true,
    badgeThreshold: 5,
};

function getOptions() {
    return new Promise((resolve) => {
        try {
            extApi.storage.sync.get(DEFAULT_OPTIONS, (items) => {
                resolve({ ...DEFAULT_OPTIONS, ...(items || {}) });
            });
        } catch (e) {
            resolve({ ...DEFAULT_OPTIONS });
        }
    });
}

// --- Cache mémoire (évite les requêtes API redondantes dans la même session) ---

const _apiCache = new Map();

// --- Historique des prix (chrome.storage.local, persistant entre sessions) ---

const HISTORY_KEY_PREFIX = 'lbc_history_';
const MAX_HISTORY_ENTRIES = 10;

async function savePriceToHistory(adId, price) {
    if (!price || isNaN(+price)) return;
    const key = HISTORY_KEY_PREFIX + adId;
    return new Promise((resolve) => {
        extApi.storage.local.get([key], (result) => {
            const history = result[key] || [];
            const today = new Date().toISOString().split('T')[0];
            const last = history[history.length - 1];
            if (last && last.date === today && last.price === +price) { resolve(); return; }
            history.push({ price: +price, date: today });
            if (history.length > MAX_HISTORY_ENTRIES) history.shift();
            extApi.storage.local.set({ [key]: history }, resolve);
        });
    });
}

async function getPriceHistory(adId) {
    const key = HISTORY_KEY_PREFIX + adId;
    return new Promise((resolve) => {
        extApi.storage.local.get([key], (result) => {
            resolve(result[key] || []);
        });
    });
}

// --- Affichage ---

function findPriceContainer(element) {
    return element.querySelector('[data-qa-id="adview_price"], [data-test-id="price"]')
        || Array.from(element.querySelectorAll('p[aria-hidden="true"]')).find(el => /\d[\d\s]*\s*€/.test(el.textContent))
        || document.querySelector('[data-qa-id="adview_price"], [data-test-id="price"]');
}

function displayOldPriceInElement(element, id, oldPrice, currentPrice) {
    element.querySelector('[id^="old_price_to_display_"]')?.remove();

    const priceContainer = findPriceContainer(element);
    if (!priceContainer) return;

    priceContainer.closest('.hidden')?.classList.remove('hidden');

    const reduction = +oldPrice - +currentPrice;
    const percentReduceDisplay = Math.round(reduction / oldPrice * 1000) / 10;

    priceContainer.style.display = 'none';
    priceContainer.insertAdjacentHTML('beforebegin', `
    <div id="old_price_to_display_${id}" class="flex flex-wrap items-center mr-md">
        <div class="mr-md flex flex-wrap items-center justify-between">
            <div class="flex">
                <p class="text-headline-2 text-success">${spaceDigits(currentPrice)}&nbsp;€</p>&nbsp;
                <svg viewBox="0 0 24 24" data-title="Baisse de prix" fill="currentColor" stroke="none" class="text-success fill-current shrink-0 w-sz-24 h-sz-24" data-spark-component="icon" aria-hidden="true" focusable="false">
                    <title>Baisse de prix de ${spaceDigits(Math.abs(reduction))}&nbsp;€ (${percentReduceDisplay}%)</title>
                    <path fill-rule="evenodd" d="m2.29,6.3c.39-.4,1.02-.4,1.41,0l4.83,4.96,2.97-3.05c.32-.32.74-.5,1.18-.5s.87.18,1.18.5h0s6.12,6.28,6.12,6.28v-3.21c0-.57.45-1.03,1-1.03s1,.46,1,1.03v5.68c0,.57-.45,1.03-1,1.03h-5.54c-.55,0-1-.46-1-1.03s.45-1.03,1-1.03h3.12l-5.89-6.05-2.97,3.05c-.32.32-.74.5-1.18.5s-.87-.18-1.18-.5h0S2.29,7.75,2.29,7.75c-.39-.4-.39-1.05,0-1.45Z"></path>
                </svg>
            </div>
        </div>
        <div class="text-error line-through" role="deletion">${spaceDigits(oldPrice)}&nbsp;€</div>
        <span data-spark-component="tag" class="box-border inline-flex items-center justify-center gap-sm whitespace-nowrap text-caption font-bold h-sz-20 px-md rounded-full border-sm border-current text-support ml-sm">
            ${spaceDigits(Math.abs(reduction))} € (${percentReduceDisplay}%)
        </span>
    </div>`.trim());
}

function displayCurrentPriceInElement(element, id, currentPrice) {
    element.querySelector('[id^="old_price_to_display_"]')?.remove();

    const priceContainer = findPriceContainer(element);
    if (!priceContainer) return;

    priceContainer.closest('.hidden')?.classList.remove('hidden');
    priceContainer.style.display = 'none';
    priceContainer.insertAdjacentHTML('beforebegin', `
    <div id="old_price_to_display_${id}" class="flex flex-wrap items-center mr-md">
        <div class="mr-md flex flex-wrap items-center justify-between">
            <div class="flex">
                <p class="text-headline-2">${spaceDigits(currentPrice)}&nbsp;€</p>&nbsp;
            </div>
        </div>
    </div>`.trim());
}

function displayPriceHistory(element, adId, history) {
    document.getElementById('lbc_price_history_' + adId)?.remove();
    if (!history || history.length < 2) return;

    const container = document.createElement('div');
    container.id = 'lbc_price_history_' + adId;
    container.style.cssText = 'margin-top:8px;font-size:12px;color:#555;border-top:1px solid #eee;padding-top:8px;';

    const items = history.map((h, i) => {
        const label = new Date(h.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const isLast = i === history.length - 1;
        const color = isLast ? '#e84040' : '#333';
        return `<span style="white-space:nowrap;color:${color}">${label}&nbsp;: <strong>${spaceDigits(h.price)}&nbsp;€</strong></span>`;
    }).join('<span style="margin:0 6px;color:#ccc">&rsaquo;</span>');

    container.innerHTML = `
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#999;margin-bottom:5px;">Historique des prix</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">${items}</div>
    `.trim();

    element.querySelector('[id^="old_price_to_display_"]')?.after(container);
}

function createCopyButton(adId, datas) {
    document.getElementById('lbc_copy_btn_' + adId)?.remove();

    const btn = document.createElement('button');
    btn.id = 'lbc_copy_btn_' + adId;
    btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:5px 12px;font-size:12px;border:1px solid #d0d0d0;border-radius:6px;cursor:pointer;background:#fff;color:#444;font-family:inherit;';
    btn.title = 'Copier les informations de cette annonce';

    const iconCopy = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;flex-shrink:0"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
    const iconDone = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;flex-shrink:0;color:#2a9d2a"><path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.9 7.1l-1.4-1.4z"/></svg>`;
    const iconErr = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;flex-shrink:0;color:#e84040"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;

    btn.innerHTML = iconCopy + ' Copier les infos';

    btn.onclick = () => {
        const title = document.querySelector('[data-qa-id="adview_title"]')?.innerText?.trim() || document.title;
        const currentPrice = datas?.price?.[0];
        const oldPrice = datas?.attributes?.filter(o => o.key === 'old_price')[0]?.value;
        const pubDate = datas?.first_publication_date ? dateFormatter(new Date(datas.first_publication_date)) : 'N/A';

        const lines = [
            `Annonce : ${title}`,
            `URL     : ${window.location.href}`,
            `Prix    : ${currentPrice ? spaceDigits(currentPrice) + ' €' : 'N/A'}`,
            oldPrice ? `Ancien  : ${spaceDigits(oldPrice)} €` : null,
            `Publié  : ${pubDate}`,
        ].filter(Boolean).join('\n');

        navigator.clipboard.writeText(lines).then(() => {
            btn.innerHTML = iconDone + ' Copié !';
            setTimeout(() => { btn.innerHTML = iconCopy + ' Copier les infos'; }, 2500);
        }).catch(() => {
            btn.innerHTML = iconErr + ' Échec de la copie';
            setTimeout(() => { btn.innerHTML = iconCopy + ' Copier les infos'; }, 2500);
        });
    };

    return btn;
}

function enhanceAdMileage(adItem) {
    const label = document.evaluate(".//*[text()='Kilométrage']", adItem, null, XPathResult.ANY_TYPE, null).iterateNext();
    if (!label) return;
    // Liste : valeur = sibling direct du label
    // Annonce : valeur = dans le div frère du parent du label
    const pMileage = label.nextElementSibling
        || label.nextSibling
        || label.parentElement?.nextElementSibling?.querySelector('p, span');
    if (pMileage) pMileage.innerHTML = spaceDigits(pMileage.innerHTML);
}

function createDivOldDate(id, currentDateClass, oldDate, currentDate) {
    const divOldDate = document.createElement("div");
    divOldDate.setAttribute("id", "old_date_to_display_" + id);
    divOldDate.setAttribute("class", "flex flex-wrap items-center");

    const pOldDate = document.createElement("p");
    pOldDate.setAttribute("class", currentDateClass);
    pOldDate.innerHTML = "Mise en ligne le " + dateFormatter(new Date(oldDate));
    divOldDate.appendChild(pOldDate);

    if (oldDate !== currentDate) {
        const pCurrentDate = document.createElement("p");
        pCurrentDate.setAttribute("class", currentDateClass);
        pCurrentDate.innerHTML = "Mise à jour le " + dateFormatter(new Date(currentDate));
        divOldDate.appendChild(pCurrentDate);
        divOldDate.setAttribute("class", "flex flex-col");
    }

    return divOldDate;
}

function createDateTag(preText, date) {
    const tag = document.createElement("span");
    const gap = getGapWithToday(date);
    tag.setAttribute("class", "box-border default:inline-flex default:w-fit items-center justify-center gap-sm whitespace-nowrap text-caption font-bold px-md h-sz-20 rounded-full text-on-support-container mr-md "
        + (gap.inDays > 30 ? 'bg-alert' : 'bg-support-container'));
    tag.setAttribute("data-spark-component", "tag");

    try {
        tag.innerHTML = preText + date.toLocaleDateString("fr-FR", {
            year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
        }).replace(/\s+/g, ' à ') + gap.asString;
    } catch (e) { err(e); }

    return tag;
}

function getGapWithToday(date) {
    const gapInMs = Date.now() - date.getTime();
    const gapInDays = Math.floor(gapInMs / 86400000);
    let gapString = '';
    if (gapInDays > 1) gapString = ` (${gapInDays} jours)`;
    else if (gapInDays === 1) gapString = ' (Hier)';
    else if (gapInDays === 0) gapString = date.getDate() === new Date().getDate() ? " (Aujourd'hui)" : ' (Hier)';
    return { inDays: gapInDays, inMs: gapInMs, asString: gapString };
}

function dateFormatter(dateObj) {
    const pad = n => String(n).padStart(2, '0');
    return `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${dateObj.getFullYear()} à ${pad(dateObj.getHours())}h${pad(dateObj.getMinutes())}` + getGapWithToday(dateObj).asString;
}

function monthDiff(d1, d2) {
    const months = (d2.getFullYear() - d1.getFullYear()) * 12 - d1.getMonth() + d2.getMonth();
    return months <= 0 ? 0 : months;
}

function spaceDigits(digits) {
    return String(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getPostId() {
    return getAdId(window.location.href);
}

function getAdId(url) {
    return url.split('/').pop().split('.')[0];
}

function findAdById(obj, id, depth) {
    if (depth > 15 || !obj || typeof obj !== 'object') return null;
    if (String(obj.list_id) === id) return obj;
    const vals = Array.isArray(obj) ? obj : Object.values(obj);
    for (const v of vals) {
        const found = findAdById(v, id, depth + 1);
        if (found) return found;
    }
    return null;
}

function getAdFromNextData(postId) {
    try {
        const el = document.getElementById('__NEXT_DATA__');
        if (!el) return null;
        return findAdById(JSON.parse(el.textContent), String(postId), 0);
    } catch (e) {
        return null;
    }
}

function getApiData(postId) {
    if (_apiCache.has(postId)) return Promise.resolve(_apiCache.get(postId));

    const fromDom = getAdFromNextData(postId);
    if (fromDom) {
        _apiCache.set(postId, fromDom);
        log('Données trouvées dans __NEXT_DATA__ pour ' + postId);
        return Promise.resolve(fromDom);
    }

    return new Promise((resolve) => {
        const requestId = 'lbc_old_price_' + Math.random().toString(36).substr(2, 9);
        let settled = false;

        function done(data) {
            if (settled) return;
            settled = true;
            window.removeEventListener('message', handleResponse);
            if (data) _apiCache.set(postId, data);
            resolve(data || null);
        }

        function handleResponse(event) {
            if (event.source !== window) return;
            if (!event.data || event.data.type !== 'LBC_OLD_PRICE_API_RESPONSE' || event.data.requestId !== requestId) return;
            if (event.data.error) log('Données indisponibles pour ' + postId + ' : ' + event.data.error);
            done(event.data.result);
        }

        window.addEventListener('message', handleResponse);
        window.postMessage({ type: 'LBC_OLD_PRICE_API_REQUEST', postId, requestId }, '*');
        setTimeout(() => done(null), 5000);
    });
}

if (!window.lbcOldPriceApiInjected) {
    window.lbcOldPriceApiInjected = true;
    try {
        const extRuntime = (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : chrome.runtime;
        const script = document.createElement('script');
        script.src = extRuntime.getURL('page_context.js');
        script.onload = function() { script.remove(); };
        document.documentElement.appendChild(script);
    } catch (e) {
        err('Impossible d\'injecter page_context.js : ' + e);
    }
}
