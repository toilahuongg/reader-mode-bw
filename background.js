chrome.action.onClicked.addListener((tab) => {
  // Inject the content script if it's not already injected
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });

  // Send message to content script to toggle reader mode
  chrome.tabs.sendMessage(tab.id, { action: 'toggleReaderMode' });
});
