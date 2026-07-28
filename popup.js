// Default Settings
const defaults = {
  enabled: true,
  speed: 1.0,
  reverb: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  keepPitch: false,
  spatial8d: false,
  karaoke: false,
  theme: 'dark'
};

// UI Elements
const speedInput = document.getElementById('speed');
const reverbInput = document.getElementById('reverb');
const bassInput = document.getElementById('bass');
const midInput = document.getElementById('mid');
const trebleInput = document.getElementById('treble');
const keepPitchInput = document.getElementById('keep-pitch');
const spatial8dInput = document.getElementById('toggle-8d');
const karaokeInput = document.getElementById('toggle-karaoke');

const speedVal = document.getElementById('speed-val');
const reverbVal = document.getElementById('reverb-val');
const bassVal = document.getElementById('bass-val');
const midVal = document.getElementById('mid-val');
const trebleVal = document.getElementById('treble-val');

const themeBtn = document.getElementById('theme-btn');
const powerBtn = document.getElementById('power-btn');
const slidersSection = document.querySelector('.sliders-section');

const presetBtns = {
  reset: document.getElementById('btn-reset'),
  slowed: document.getElementById('btn-slowed'),
  nightcore: document.getElementById('btn-nightcore'),
  bassBoost: document.getElementById('btn-bass-boost'),
  vocalBoost: document.getElementById('btn-vocal-boost'),
  spatialPreset: document.getElementById('btn-8d')
};

// Initialize State
chrome.storage.local.get(defaults, (state) => {
  updateUI(state);
  applyTheme(state.theme);
  sendStateToActiveTab(state);
});

// Update UI elements based on state
function updateUI(state) {
  speedInput.value = state.speed;
  reverbInput.value = state.reverb;
  bassInput.value = state.bass;
  midInput.value = state.mid;
  trebleInput.value = state.treble;
  keepPitchInput.checked = state.keepPitch;
  spatial8dInput.checked = state.spatial8d;
  karaokeInput.checked = state.karaoke;

  // Set active class on power button
  if (state.enabled) {
    powerBtn.classList.add('active');
  } else {
    powerBtn.classList.remove('active');
  }

  // Format values
  const speedPercentage = Math.round((state.speed - 1) * 100);
  speedVal.textContent = speedPercentage >= 0 ? `+${speedPercentage}%` : `${speedPercentage}%`;
  reverbVal.textContent = `${state.reverb}%`;
  bassVal.textContent = `${state.bass > 0 ? '+' : ''}${state.bass} dB`;
  midVal.textContent = `${state.mid > 0 ? '+' : ''}${state.mid} dB`;
  trebleVal.textContent = `${state.treble > 0 ? '+' : ''}${state.treble} dB`;

  // Highlight active presets
  updatePresetButtonHighlights(state);
}

// Check which presets are active
function updatePresetButtonHighlights(state) {
  Object.values(presetBtns).forEach(btn => btn.classList.remove('active'));

  if (state.speed === 1.0 && state.reverb === 0 && state.bass === 0 && state.mid === 0 && state.treble === 0 && !state.spatial8d && !state.karaoke) {
    presetBtns.reset.classList.add('active');
  } else if (state.speed === 0.8 && state.reverb === 35 && state.bass === 3 && state.mid === 0 && state.treble === -2 && !state.keepPitch) {
    presetBtns.slowed.classList.add('active');
  } else if (state.speed === 1.25 && state.reverb === 0 && state.bass === 0 && state.mid === 0 && state.treble === 0 && !state.keepPitch) {
    presetBtns.nightcore.classList.add('active');
  } else if (state.speed === 1.0 && state.reverb === 0 && state.bass === 10 && state.mid === 0 && state.treble === 0) {
    presetBtns.bassBoost.classList.add('active');
  } else if (state.speed === 1.0 && state.reverb === 0 && state.bass === -3 && state.mid === 8 && state.treble === 2) {
    presetBtns.vocalBoost.classList.add('active');
  } else if (state.spatial8d) {
    presetBtns.spatialPreset.classList.add('active');
  }
}

// Gather state from UI inputs
function getStateFromUI() {
  return {
    enabled: powerBtn.classList.contains('active'),
    speed: parseFloat(speedInput.value),
    reverb: parseInt(reverbInput.value),
    bass: parseInt(bassInput.value),
    mid: parseInt(midInput.value),
    treble: parseInt(trebleInput.value),
    keepPitch: keepPitchInput.checked,
    spatial8d: spatial8dInput.checked,
    karaoke: karaokeInput.checked,
    theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
  };
}

// Save state and notify page
function handleInputChange() {
  const state = getStateFromUI();
  updateUI(state);
  chrome.storage.local.set(state);
  sendStateToActiveTab(state);
}

// Attach Event Listeners to Inputs
[speedInput, reverbInput, bassInput, midInput, trebleInput].forEach(input => {
  input.addEventListener('input', handleInputChange);
});
[keepPitchInput, spatial8dInput, karaokeInput].forEach(toggle => {
  toggle.addEventListener('change', handleInputChange);
});

// Power Button Toggle Listener
powerBtn.addEventListener('click', () => {
  powerBtn.classList.toggle('active');
  handleInputChange();
});

// Preset event handlers
presetBtns.reset.addEventListener('click', () => {
  const state = getStateFromUI();
  const newState = { 
    ...defaults, 
    theme: state.theme, 
    enabled: state.enabled 
  };
  chrome.storage.local.set(newState);
  updateUI(newState);
  sendStateToActiveTab(newState);
});

presetBtns.slowed.addEventListener('click', () => {
  const state = getStateFromUI();
  const newState = {
    ...state,
    speed: 0.8,
    reverb: 35,
    bass: 3,
    mid: 0,
    treble: -2,
    keepPitch: false
  };
  chrome.storage.local.set(newState);
  updateUI(newState);
  sendStateToActiveTab(newState);
});

presetBtns.nightcore.addEventListener('click', () => {
  const state = getStateFromUI();
  const newState = {
    ...state,
    speed: 1.25,
    reverb: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    keepPitch: false
  };
  chrome.storage.local.set(newState);
  updateUI(newState);
  sendStateToActiveTab(newState);
});

presetBtns.bassBoost.addEventListener('click', () => {
  const state = getStateFromUI();
  const newState = {
    ...state,
    speed: 1.0,
    reverb: 0,
    bass: 10,
    mid: 0,
    treble: 0,
    keepPitch: true
  };
  chrome.storage.local.set(newState);
  updateUI(newState);
  sendStateToActiveTab(newState);
});

presetBtns.vocalBoost.addEventListener('click', () => {
  const state = getStateFromUI();
  const newState = {
    ...state,
    speed: 1.0,
    reverb: 0,
    bass: -3,
    mid: 8,
    treble: 2,
    keepPitch: true
  };
  chrome.storage.local.set(newState);
  updateUI(newState);
  sendStateToActiveTab(newState);
});

presetBtns.spatialPreset.addEventListener('click', () => {
  const state = getStateFromUI();
  const newState = {
    ...state,
    spatial8d: true,
    reverb: 20,
    bass: 2
  };
  chrome.storage.local.set(newState);
  updateUI(newState);
  sendStateToActiveTab(newState);
});

// Theme selection
themeBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-theme');
  const theme = isDark ? 'dark' : 'light';
  chrome.storage.local.set({ theme });
});

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

// Communication helper
function sendStateToActiveTab(state) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'VIBESHIFT_UPDATE', state }).catch(err => {
        // Content script might not be loaded yet or unsupported page
        console.log("Could not communicate with tab:", err);
      });
    }
  });
}
