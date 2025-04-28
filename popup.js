// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  // Load API key
  const result = await chrome.storage.sync.get([
    'openaiApiKey',
    'isReaderMode',
    'isDarkMode'
  ]);
  
  if (result.openaiApiKey) {
    document.getElementById('apiKey').value = result.openaiApiKey;
  }
  
  if (result.isReaderMode !== undefined) {
    document.getElementById('enableReaderMode').checked = result.isReaderMode;
  }
  
  if (result.isDarkMode !== undefined) {
    document.getElementById('enableDarkMode').checked = result.isDarkMode;
  }
});

// Save API key
document.getElementById('saveApiKey').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiKey) {
    alert('Please enter your OpenAI API key');
    return;
  }
  
  try {
    await chrome.storage.sync.set({ openaiApiKey: apiKey });
    alert('API key saved successfully');
  } catch (error) {
    console.error('Error saving API key:', error);
    alert('Error saving API key. Please try again.');
  }
});

// Save enable reader mode setting
document.getElementById('enableReaderMode').addEventListener('change', async (e) => {
  try {
    await chrome.storage.sync.set({ isReaderMode: e.target.checked });
    // Send message to content script to update reader mode
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateReaderMode',
        enabled: e.target.checked
      });
    }
  } catch (error) {
    console.error('Error saving enable reader mode setting:', error);
  }
});

// Save enable dark mode setting
document.getElementById('enableDarkMode').addEventListener('change', async (e) => {
  try {
    await chrome.storage.sync.set({ isDarkMode: e.target.checked });
    // Send message to content script to update dark mode
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateDarkMode',
        enabled: e.target.checked
      });
    }
  } catch (error) {
    console.error('Error saving enable dark mode setting:', error);
  }
}); 