[🇧🇷 Leia em Português](README.md)

# 🎞️ JSON SubLayer for WhisperX

**Developed by Rafael Godoy Ebert**

**JSON SubLayer** is a professional web-based subtitle editor designed to fill a critical gap in the viral video automation workflow: **millimetric precision of word-level timestamps**.

### 🚀 [TRY IT ONLINE NOW](https://rafaelgodoyebert.github.io/JSON-SubLayer/)

<img width="2507" height="950" alt="image" src="https://github.com/user-attachments/assets/9c6d0cea-6bbb-485e-a1d0-9c696d76397c" />

## 💡 Why does this project exist?

This software was born from an internal need to power **[ViralCutter](https://github.com/rafaelgodoyebert/ViralCutter)**.

ViralCutter uses artificial intelligence to transform long videos into viral clips (Shorts/TikTok), applying dynamic subtitles with highlights ("Hormozi style"). For this effect to work properly, the system needs to know exactly when each word starts and ends.

The AI (WhisperX) generates this data but makes mistakes. And that's where **JSON SubLayer** comes in.

### 🧠 The Philosophy: JSON vs. ASS/SRT

You might ask: *"Why not edit the final file (.ass/.srt) directly in Aegisub?"*

The answer is **Freedom and Scalability.**

In the ViralCutter workflow, the `.ass` file (Advanced Substation Alpha) is just the **final render format**, already "burned" with colors, fonts, and karaoke animations defined by the user.

*   **Editing the .ASS:** It's difficult and rigid. If you want to change the highlight color or font later, you have to redo everything manually or deal with complex tags (e.g., `{\k15}{\c&H00FFFF&}`).
*   **Editing the JSON:** It's editing the **pure structure**. You correct the time and text of the word, and ViralCutter can generate *dozens* of different visual styles from that same corrected JSON.

**JSON SubLayer gives you control over the "source of truth", not just the final result.**

---

## ✨ Key Features

*   **🌐 100% Web & Offline:** Runs directly in the browser (GitHub Pages). Secure and private.
*   **🧱 Multi-Track:** Edit multiple layers simultaneously.
*   **🔍 Power Tools:** Search and Replace (Ctrl+F/H) with visual highlighting.
*   **🔊 Waveform:** Perfect sync with audio visualization.
*   **🔡 Granular Editing:** Adjust timing of phrases, words, or individual characters.
*   **🔄 Round-Trip:** Import/Export JSON compatible with Adobe Premiere and WhisperX.
*   **📌 Sticky Tracks:** Organized headers.
*   **🌍 Internationalization:** PT-BR / EN.

## 🚀 How to Use

This project is hosted on GitHub Pages and runs entirely on the client-side.

1.  **Access the project link** (or open `index.html` locally).
2.  Load your media file (Video/Audio) for reference.
3.  Import your subtitle file (`.json`).
4.  Edit using the visual timeline.
5.  Export in the desired format.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `K` | Split subtitle |
| `G` | Merge subtitles |
| `Delete` | Delete selection |
| `Ctrl + C / V` | Copy and Paste |
| `Ctrl + Z / Y` | Undo / Redo |
| `Ctrl + F` | Find |
| `Ctrl + H` | Replace |
| `Alt + Scroll` | Zoom Timeline |

---
**JSON SubLayer for WhisperX** - The key piece for perfect subtitles in [ViralCutter](https://github.com/rafaelgodoyebert/ViralCutter). 🎯🎞️
