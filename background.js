const extApi = (typeof browser !== 'undefined') ? browser : chrome;

extApi.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.url) {
        extApi.tabs.sendMessage(tabId, { message: 'lbc_old_price', url: changeInfo.url })
            .catch(() => {});
    }
});
