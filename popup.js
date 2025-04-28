// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get(['isReaderMode', 'isDarkMode', 'isSpeechMode', 'openaiApiKey'], function(result) {
    document.getElementById('enableReaderMode').checked = result.isReaderMode || false;
    document.getElementById('enableDarkMode').checked = result.isDarkMode || false;
    document.getElementById('enableSpeechMode').checked = result.isSpeechMode || false;
    document.getElementById('apiKey').value = result.openaiApiKey || '';
  });

  // Save API key
  document.getElementById('saveApiKey').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKeyInput').value;
    chrome.storage.sync.set({ openaiApiKey: apiKey }, function() {
      alert('API Key saved successfully!');
    });
  });

  // Toggle reader mode
  document.getElementById('enableReaderMode').addEventListener('change', function() {
    const isEnabled = this.checked;
    chrome.storage.sync.set({ isReaderMode: isEnabled }, function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'updateReaderMode', enabled: isEnabled});
      });
    });
  });

  // Toggle dark mode
  document.getElementById('enableDarkMode').addEventListener('change', function() {
    const isEnabled = this.checked;
    chrome.storage.sync.set({ isDarkMode: isEnabled }, function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'updateDarkMode', enabled: isEnabled});
      });
    });
  });

  // Toggle speech mode
  document.getElementById('enableSpeechMode').addEventListener('change', function() {
    const isEnabled = this.checked;
    chrome.storage.sync.set({ isSpeechMode: isEnabled }, function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'updateSpeechMode', enabled: isEnabled});
      });
    });
  });
}); 