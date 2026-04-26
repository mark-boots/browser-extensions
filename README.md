# Browser Extensions

Chrome / Edge extensions by Mark Boots.

**Site:** [mark-boots.github.io/browser-extensions](https://mark-boots.github.io/browser-extensions)

---

## Extensions

### CodeTab
A CodePen-like live HTML/CSS/JS editor that replaces your new tab page.

- Split-pane editor with resizable HTML, CSS, and JS panels
- Live preview with an in-page console
- Multiple saved tabs with auto-save
- Emmet abbreviation expansion
- Prettier code formatting
- 11 editor themes
- External resource support (CSS/JS CDN links)

**Stack:** React 18 + Vite, CodeMirror 6, Split.js

```
cd codetab
npm install
npm run dev      # dev server
npm run build    # build to dist/
```

Load `dist/` as an unpacked extension in `chrome://extensions` or `edge://extensions`.

---

### MultiStreamView
Watch multiple YouTube, Twitch, and Kick streams simultaneously in a single tab with an integrated chat sidebar.

**Supported platforms:** YouTube · Twitch · Kick

**Layout**
- One large **main stream** as the primary focus
- One draggable, resizable **Picture-in-Picture** overlay (snaps to corners)
- Additional streams stacked in a collapsible **bar** (top or bottom)

**Features**
- Integrated per-stream chat with tab navigation — one sidebar, all chats
- Resizable chat sidebar, switchable to left or right side
- Right-click context menu on any stream to promote/demote, change role, switch chat, or remove
- Drag to reorder streams in the bar
- **Views** — save named setups (e.g. "F1 Weekend", "Gaming Session"), each with its own stream list and layout preferences
- Add streams from the popup when visiting a YouTube, Twitch, or Kick page — one click to add to any view
- All layout preferences (sidebar width, bar height, PiP size and corner) persist per view

**Stack:** React 18 + Vite

```
cd multistreamview
npm install
npm run build    # build to dist/
```

Load `dist/` as an unpacked extension in `chrome://extensions` or `edge://extensions`.

[Privacy Policy](https://mark-boots.github.io/browser-extensions/privacy-multistreamview.html)

---

### Pretty JSON
Automatically prettifies raw JSON responses in the browser with syntax highlighting and a collapsible tree view.

Load `prettyjson/` as an unpacked extension.

---

## Loading an unpacked extension

1. Go to `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
2. Enable **Developer mode**
3. Click **Load unpacked** and select the extension folder

For CodeTab, load the `dist/` folder after running `npm run build`.
