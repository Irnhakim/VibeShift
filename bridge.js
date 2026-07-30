(function() {
  if (window.__VIBESHIFT_BRIDGE_INITIALIZED__) {
    console.log("VibeShift Bridge: Already initialized in this frame. Bypassing duplicate load.");
    return;
  }
  window.__VIBESHIFT_BRIDGE_INITIALIZED__ = true;

  // Default State fallback
  const defaultState = {
    enabled: true,
    speed: 1.0,
    pitch: 0,
    reverb: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    keepPitch: false,
    spatial8d: false,
    karaoke: false
  };

  // Listen for updates from the popup and forward them to the Main World
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'VIBESHIFT_UPDATE') {
      console.log("VibeShift Bridge: Forwarding update to Main World", message.state);
      const workletUrl = chrome.runtime.getURL('SignalsmithStretchWorklet.js');
      window.postMessage({ type: 'VIBESHIFT_BRIDGE_UPDATE', state: message.state, workletUrl }, '*');
    }
  });

  // Fetch initial state from storage and send to Main World
  chrome.storage.local.get(defaultState, (storedState) => {
    console.log("VibeShift Bridge: Loaded initial state", storedState);
    setTimeout(() => {
      const workletUrl = chrome.runtime.getURL('SignalsmithStretchWorklet.js');
      window.postMessage({ type: 'VIBESHIFT_BRIDGE_UPDATE', state: storedState, workletUrl }, '*');
    }, 100);
  });

  // Listen for pull requests from the Main World in case it loads later
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'VIBESHIFT_PULL_STATE') {
      console.log("VibeShift Bridge: Received pull request from Main World");
      chrome.storage.local.get(defaultState, (storedState) => {
        const workletUrl = chrome.runtime.getURL('SignalsmithStretchWorklet.js');
        window.postMessage({ type: 'VIBESHIFT_BRIDGE_UPDATE', state: storedState, workletUrl }, '*');
      });
    }
  });
})();
