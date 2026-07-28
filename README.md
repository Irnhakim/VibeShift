# VibeShift 🌙🎵

**VibeShift** is a playful, high-performance Chrome/Brave extension that allows you to transform the music you are playing on YouTube, Spotify Web, SoundCloud, and other platforms in real-time. Boost the bass, turn it into Nightcore, slow it down with reverb, or immerse yourself in 8D spatial audio!

Inspired by the colorful **Saweria** neo-brutalist aesthetic, VibeShift offers a tactile, paper-textured retro interface with full support for both **Light Mode** and **Dark Mode**.

---

## 🚀 Key Features

*   **⚡ Nightcore Preset**: Instantly speeds up the playback and increases the pitch of any song for that classic energetic Nightcore sound.
*   **🌌 Slowed + Reverb Preset**: Slows down the speed while maintaining or dropping the pitch, wrapping the audio in a lush, spatial reverb chamber.
*   **🔊 Bass Boost & Vocal Boost**: Enhance deep low-end frequencies or bring vocals forward using a custom multi-band equalizer graph.
*   **🎧 8D Spatial Audio**: Simulates an immersive 3D surround sound experience by actively panning the audio left and right in a sinusoidal cycle.
*   **🎤 Karaoke Mode**: Attempts real-time vocal cancellation using out-of-phase channel summation, allowing you to sing along to instrumentals.
*   **🎚️ Live Control Room**: Adjust Speed, Reverb, Bass, Mid, and Treble sliders dynamically.
*   **🔒 Pitch Preservation Toggle**: Choose whether to keep the original vocal pitch or let it shift naturally with playback speed.
*   **⏻ Master Bypass Switch**: Quickly turn all effects on or off with a low-latency bypass route.

---

## 🎨 Design & Aesthetic

VibeShift features a premium **Neo-brutalist / Playful Retro** user interface:
*   **Paper Texture Background**: A realistic recycled paper fiber overlay in light mode (no heavy image dependencies, driven entirely by a lightweight inline SVG fractal noise).
*   **Bold Outlines & Hard Shadows**: Thick solid borders and offset box shadows that shift when active/clicked.
*   **Modern Typography**: Styled using custom Google Fonts (`Comfortaa` for logo/headers and `Plus Jakarta Sans` for controls).
*   **Dual Themes**: Easily switch between a warm cream-colored Light Mode and a sleek dark charcoal Dark Mode.

---

## 🛠️ How It Works (Technical Overview)

Chromium browsers restrict extension access to audio elements due to strict Cross-Origin Resource Sharing (CORS) security guidelines. VibeShift bypasses these restrictions using a **Dual-World Architecture**:

1.  **Isolated Bridge (`bridge.js`)**: Runs in Chrome's isolated execution context to access local storage and listen for popup UI updates. It forwards state adjustments to the main page via `window.postMessage`.
2.  **Main World Processor (`content.js`)**: Injected directly into the website's main JavaScript context. This allows it to hook directly into HTML5 `<video>` and `<audio>` elements, route them through a custom **Web Audio API Graph**, and apply real-time filters without triggering CORS errors.
3.  **Smart Autoplay Deferring**: Automatically complies with Chrome's Autoplay Policy by deferring `AudioContext` creation until the user interacts with the page or the media element starts playing.

---

## 📦 Installation

To run this extension locally in developer mode:

1.  Clone this repository or download the source code files.
2.  Open your Google Chrome (or Brave/Edge) browser.
3.  Navigate to the extensions settings page at `chrome://extensions/`.
4.  Toggle **Developer Mode** on in the top-right corner.
5.  Click **Load Unpacked** in the top-left corner.
6.  Select the project directory (containing `manifest.json`).
7.  Open YouTube or Spotify Web, play a song, and click the VibeShift icon to start shifting the vibe!

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
