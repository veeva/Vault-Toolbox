/* eslint-disable no-undef */
let originatingUrl = '';

chrome.action.onClicked.addListener((tab) => {
    if (tab) {
        originatingUrl = tab.url;
    }

    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

function getOriginatingUrl() {
    return originatingUrl;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getOriginatingUrl') {
        sendResponse({ originatingUrl: getOriginatingUrl() });
    }
});
