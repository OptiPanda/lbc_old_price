(function () {
    window.__lbc_cache = window.__lbc_cache || {};
    window.__lbc_cache_waiters = window.__lbc_cache_waiters || {};

    function storeAd(ad) {
        if (ad?.list_id === undefined) {
            return;
        }
        let id = String(ad.list_id);
        window.__lbc_cache[id] = ad;
        if (window.__lbc_cache_waiters[id]) {
            window.__lbc_cache_waiters[id].forEach(function (fn) {
                fn(ad);
            });
            delete window.__lbc_cache_waiters[id];
        }
    }

    function extractAds(obj, depth) {
        if (depth > 15 || !obj || typeof obj !== 'object') {
            return;
        }
        if (obj.list_id !== undefined) {
            storeAd(obj);
            return;
        }
        (Array.isArray(obj) ? obj : Object.values(obj)).forEach(function (v) {
            extractAds(v, depth + 1);
        });
    }

    if (window.__NEXT_DATA__) {
        extractAds(window.__NEXT_DATA__, 0);
    }

    // Intercepte window.fetch globalement pour capturer les réponses API de LeBonCoin
    // lors des navigations SPA (Next.js router). Nécessaire car les content scripts
    // n'ont pas accès aux requêtes réseau de la page — cette injection via page_context.js
    // s'exécute dans le contexte de la page et peut donc intercepter fetch.
    if (!window.__lbc_fetch_intercepted) {
        window.__lbc_fetch_intercepted = true;
        let _fetch = window.fetch;
        window.__lbc_original_fetch = _fetch;
        window.fetch = async function () {
            let args = Array.prototype.slice.call(arguments);
            let response = await _fetch.apply(this, args);
            try {
                let url = typeof args[0] === 'string' ? args[0] : (args[0]?.url ? args[0].url : '');
                if (url && (url.indexOf('/finder/classified') !== -1 || url.indexOf('adfinder') !== -1 || url.indexOf('/_next/data') !== -1)) {
                    response.clone().json().then(function (data) {
                        if (data) {
                            extractAds(data, 0);
                        }
                    }).catch(function () {
                    });
                }
            } catch (e) {
                debug(e)
            }
            return response;
        };
    }

    window.addEventListener('message', async function (event) {
        if (event.data?.type !== 'LBC_OLD_PRICE_API_REQUEST') {
            return;
        }
        let postId = String(event.data.postId);
        let requestId = event.data.requestId;

        function reply(result, error) {
            window.postMessage({
                type: 'LBC_OLD_PRICE_API_RESPONSE',
                requestId: requestId,
                result: result || null,
                error: (!result && error) ? error : null
            }, '*');
        }

        if (window.__lbc_cache[postId]) {
            reply(window.__lbc_cache[postId]);
            return;
        }

        // Attendre que la page fetche elle-même la donnée (navigation SPA)
        let fromFetch = await new Promise(function (resolve) {
            if (!window.__lbc_cache_waiters[postId]) {
                window.__lbc_cache_waiters[postId] = [];
            }
            window.__lbc_cache_waiters[postId].push(resolve);
            setTimeout(function () {
                if (window.__lbc_cache_waiters[postId]) {
                    let i = window.__lbc_cache_waiters[postId].indexOf(resolve);
                    if (i !== -1) {
                        window.__lbc_cache_waiters[postId].splice(i, 1);
                    }
                    if (window.__lbc_cache_waiters[postId].length === 0) delete window.__lbc_cache_waiters[postId];
                }
                resolve(null);
            }, 3000);
        });
        if (fromFetch) {
            reply(fromFetch);
            return;
        }

        // Dernier recours : appel API direct (peut échouer sur captcha)
        let baseFetch = window.__lbc_original_fetch || window.fetch;
        let urls = [
            'https://api.leboncoin.fr/api/adfinder/v1/classified/' + postId,
            'https://api.leboncoin.fr/finder/classified/' + postId
        ];
        let result = null, lastErr = null;
        for (const element of urls) {
            try {
                let response = await baseFetch(element, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {'Accept': 'application/json'}
                });
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                result = await response.json();
                break;
            } catch (e) {
                lastErr = e.message;
            }
        }
        reply(result, lastErr);
    });
})();
