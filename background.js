
browser.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        if (changeInfo.url) {
            browser.tabs.sendMessage( tabId, {
                message: 'lbc_old_price',
                url: changeInfo.url
            })
        }
    }
);