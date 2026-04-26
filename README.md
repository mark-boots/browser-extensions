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

**Permissions:** `storage`, `tabs`, `declarativeNetRequest`

[Privacy Policy](https://mark-boots.github.io/browser-extensions/privacy-multistreamview.html)

Load `multistreamview/` as an unpacked extension.

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
