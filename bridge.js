// Listen for updates from the popup and forward them to the Main World
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VIBESHIFT_UPDATE') {
    window.postMessage({ type: 'VIBESHIFT_BRIDGE_UPDATE', state: message.state }, '*');
  }
});

// Fetch initial state from storage and send to Main World
chrome.storage.local.get({
  enabled: true,
  speed: 1.0,
  reverb: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  keepPitch: false,
  spatial8d: false,
  karaoke: false
}, (storedState) => {
  // Wait a short moment for main world content.js to register its listener
  setTimeout(() => {
    window.postMessage({ type: 'VIBESHIFT_BRIDGE_UPDATE', state: storedState }, '*');
  }, 100);
});

// Listen for pull requests from the Main World in case it loads later
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'VIBESHIFT_PULL_STATE') {
    chrome.storage.local.get(null, (storedState) => {
      window.postMessage({ type: 'VIBESHIFT_BRIDGE_UPDATE', state: storedState }, '*');
    });
  }
});
