// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
    console.log('XPath Extractor Extension installed successfully!');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTabInfo') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                sendResponse({
                    success: true,
                    url: tabs[0].url,
                    title: tabs[0].title
                });
            } else {
                sendResponse({
                    success: false,
                    error: 'No active tab found'
                });
            }
        });
        return true; // Required for async response
    }
});
