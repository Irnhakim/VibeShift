(function() {
  if (window.__VIBESHIFT_CONTENT_INITIALIZED__) {
    console.log("VibeShift: content.js already initialized in this frame. Bypassing duplicate load.");
    return;
  }
  window.__VIBESHIFT_CONTENT_INITIALIZED__ = true;

  // State storage
  let audioState = {
  enabled: true,
  speed: 1.0,
  reverb: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  keepPitch: false,
  spatial8d: false,
  karaoke: false
};

// Keep track of initialized media elements and their audio graphs
const hookedElements = new Map();
let audioCtx = null;
let panningTime = 0;
let panningInterval = null;

// Reverb Impulse Response Cache
let reverbImpulseBuffer = null;

// Initialize Audio Context on demand
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Synthesize impulse response buffer once
    reverbImpulseBuffer = createReverbImpulseResponse(audioCtx, 2.5, 2.5);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Synthesize Reverb Impulse Response (exponential decay white noise)
function createReverbImpulseResponse(ctx, duration, decay) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

// Hook a media element
function hookMediaElement(element) {
  if (hookedElements.has(element)) return;

  try {
    const ctx = getAudioContext();
    const source = ctx.createMediaElementSource(element);

    // 1. Channel Splitter and Merger for Karaoke (vocal removal)
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);

    // Karaoke Gain Nodes
    const leftToLeft = ctx.createGain();   // L -> L
    const rightToRight = ctx.createGain(); // R -> R
    const rightToLeft = ctx.createGain();  // R -> L (inverted for cancellation)
    const leftToRight = ctx.createGain();  // L -> R (inverted for cancellation)

    // Connect Splitter to Gains
    source.connect(splitter);
    splitter.connect(leftToLeft, 0);
    splitter.connect(leftToRight, 0);
    splitter.connect(rightToRight, 1);
    splitter.connect(rightToLeft, 1);

    // Connect Gains to Merger
    leftToLeft.connect(merger, 0, 0);
    rightToLeft.connect(merger, 0, 0);
    rightToRight.connect(merger, 0, 1);
    leftToRight.connect(merger, 0, 1);

    // 2. Equalizer Nodes (Bass, Mid, Treble)
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 150;

    const midFilter = ctx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1.0;

    const trebleFilter = ctx.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 8000;

    merger.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);

    // 3. Reverb Routing
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const convolver = ctx.createConvolver();
    convolver.buffer = reverbImpulseBuffer;

    trebleFilter.connect(dryGain);
    trebleFilter.connect(convolver);
    convolver.connect(wetGain);

    // Reverb merger node
    const reverbMixer = ctx.createGain();
    dryGain.connect(reverbMixer);
    wetGain.connect(reverbMixer);

    // 4. Bypass & Master Control Nodes
    const effectsGain = ctx.createGain();
    const bypassGain = ctx.createGain();

    // Connect source directly to bypass gain
    source.connect(bypassGain);
    bypassGain.connect(ctx.destination);

    // 5. Stereo Panner Node for 8D Audio
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      reverbMixer.connect(panner);
      panner.connect(effectsGain);
    } else {
      reverbMixer.connect(effectsGain);
    }
    effectsGain.connect(ctx.destination);

    // Keep track of nodes to update parameters later
    const graph = {
      element,
      source,
      leftToLeft,
      rightToRight,
      rightToLeft,
      leftToRight,
      bassFilter,
      midFilter,
      trebleFilter,
      dryGain,
      wetGain,
      panner,
      effectsGain,
      bypassGain
    };

    hookedElements.set(element, graph);
    applyStateToGraph(graph, audioState);

    // Prevent YouTube/websites from resetting the playback speed dynamically
    element.addEventListener('ratechange', () => {
      if (audioState.enabled && element.playbackRate !== audioState.speed) {
        element.playbackRate = audioState.speed;
      }
    });

    // Re-apply full audio graph state when a new video/song starts loading or playing
    const reapply = () => {
      const currentGraph = hookedElements.get(element);
      if (currentGraph) {
        applyStateToGraph(currentGraph, audioState);
      }
    };
    element.addEventListener('loadstart', reapply);
    element.addEventListener('play', reapply);
  } catch (err) {
    if (err.name === 'InvalidStateError') {
      console.error(
        "VibeShift Conflict Detected: Another active Chrome extension (e.g. Volume Booster, Equalizer) has already hooked the YouTube video player. " +
        "Chrome only allows one extension to control a media element's audio graph at a time. " +
        "Please turn off or disable other audio booster/equalizer extensions to allow VibeShift to work!"
      );
    } else {
      console.warn("VibeShift: Failed to hook media element. Name:", err.name, "Message:", err.message, "Stack:", err.stack);
    }
  }
}

// Apply settings to a specific audio graph
function applyStateToGraph(graph, state) {
  const { element, leftToLeft, rightToRight, rightToLeft, leftToRight, bassFilter, midFilter, trebleFilter, dryGain, wetGain, panner, effectsGain, bypassGain } = graph;

  if (state.enabled) {
    effectsGain.gain.value = 1.0;
    bypassGain.gain.value = 0.0;

    // 1. Playback Speed & Pitch
    try {
      element.playbackRate = state.speed;
      if ('preservesPitch' in element) {
        element.preservesPitch = state.keepPitch;
      } else if ('webkitPreservesPitch' in element) {
        element.webkitPreservesPitch = state.keepPitch;
      } else if ('mozPreservesPitch' in element) {
        element.mozPreservesPitch = state.keepPitch;
      }
    } catch (e) {
      console.error("VibeShift: Failed to update speed/pitch on element:", e);
    }

    // 2. Karaoke Node configuration
    if (state.karaoke) {
      // Phase cancellation (subtract opposite channel)
      leftToLeft.gain.value = 1.0;
      rightToLeft.gain.value = -1.0;
      rightToRight.gain.value = 1.0;
      leftToRight.gain.value = -1.0;
    } else {
      // Normal Stereo passthrough
      leftToLeft.gain.value = 1.0;
      rightToLeft.gain.value = 0.0;
      rightToRight.gain.value = 1.0;
      leftToRight.gain.value = 0.0;
    }

    // 3. EQ Gains
    bassFilter.gain.value = state.bass;
    midFilter.gain.value = state.mid;
    trebleFilter.gain.value = state.treble;

    // 4. Reverb Wet/Dry levels
    const wetRatio = state.reverb / 100;
    dryGain.gain.value = 1 - wetRatio * 0.5; // keep dry signal present
    wetGain.gain.value = wetRatio * 1.5;     // boost wet signal slightly for lushness

    // 5. 8D Panning Logic
    if (!state.spatial8d && panner) {
      panner.pan.value = 0;
    }
  } else {
    // Bypassed: route raw audio and reset speed & pitch
    effectsGain.gain.value = 0.0;
    bypassGain.gain.value = 1.0;

    try {
      element.playbackRate = 1.0;
      if ('preservesPitch' in element) {
        element.preservesPitch = true;
      } else if ('webkitPreservesPitch' in element) {
        element.webkitPreservesPitch = true;
      } else if ('mozPreservesPitch' in element) {
        element.mozPreservesPitch = true;
      }
    } catch (e) {
      console.error("VibeShift: Failed to reset speed/pitch on bypass:", e);
    }
  }
}

// 8D Audio Panning Loop (LFO)
function startPanningLoop() {
  if (panningInterval) return;
  panningInterval = setInterval(() => {
    if (!audioState.spatial8d) return;
    panningTime += 0.03;
    const panVal = Math.sin(panningTime);

    hookedElements.forEach(graph => {
      if (graph.panner) {
        graph.panner.pan.value = panVal;
      }
    });
  }, 30);
}

let hasUserInteracted = false;

// Monitor page for new audio/video tags
function scanForMediaElements() {
  const mediaElements = Array.from(document.querySelectorAll('video, audio'));
  mediaElements.forEach(element => {
    if (hookedElements.has(element)) return;

    const performHook = () => {
      hookMediaElement(element);
      element.removeEventListener('play', performHook);
      element.removeEventListener('playing', performHook);
    };

    if (!element.paused || hasUserInteracted) {
      performHook();
    } else {
      element.addEventListener('play', performHook);
      element.addEventListener('playing', performHook);
    }
  });
}

// Resume context and register gesture on user interaction
function registerUserInteraction() {
  hasUserInteracted = true;
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.log("VibeShift: Context resume failed:", e));
  }
  scanForMediaElements();
}
window.addEventListener('click', registerUserInteraction, { capture: true, passive: true });
window.addEventListener('keydown', registerUserInteraction, { capture: true, passive: true });

let hasReceivedState = false;

// Listen for messages from the bridge script (Isolated -> Main world bridge)
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'VIBESHIFT_BRIDGE_UPDATE') {
    hasReceivedState = true;
    audioState = event.data.state;
    console.log("VibeShift: Received audio state update:", audioState);
    
    // Apply state to all current graphs (no getAudioContext call here to prevent Autoplay warning)
    hookedElements.forEach(graph => {
      applyStateToGraph(graph, audioState);
    });

    if (audioState.spatial8d) {
      startPanningLoop();
    }
  }
});

// Run scans periodically
setInterval(scanForMediaElements, 1000);

// Watch for dynamically added media elements immediately using MutationObserver to register them safely
const observer = new MutationObserver((mutations) => {
  let shouldScan = false;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeName === 'VIDEO' || node.nodeName === 'AUDIO') {
        shouldScan = true;
        break;
      } else if (node.querySelectorAll && node.querySelectorAll('video, audio').length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) break;
  }
  if (shouldScan) {
    scanForMediaElements();
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

// Initialize: Scan immediately
scanForMediaElements();

// Poll for initial state until we receive it to prevent race conditions
const statePollInterval = setInterval(() => {
  if (hasReceivedState) {
    clearInterval(statePollInterval);
    console.log("VibeShift: Successfully synchronized state, stopping poll.");
  } else {
    console.log("VibeShift: Pulling state from extension bridge...");
    window.postMessage({ type: 'VIBESHIFT_PULL_STATE' }, '*');
  }
}, 300);
})();
