# MultiStreamView

Chrome/Edge (Manifest V3) extension to watch multiple YouTube, Twitch, and Kick streams simultaneously in one tab, with embedded chat.

## Features

- **Multi-platform** — YouTube, Twitch, Kick
- **Layout** — 1 large main stream, 1 draggable/resizable PiP, remaining streams in a collapsible bottom bar
- **Drag to reorder** — small bar slots drag left/right, bar height auto-fits all slots
- **Chat sidebar** — per-stream chat tabs, ordered by layout (main → pip → smalls), collapsible, swappable left/right
- **Popup** — click extension icon on any YouTube/Twitch/Kick live page to add that stream instantly
- **Persistent layout** — all positions, sizes, and order saved per view via `chrome.storage.local`

## Development

```bash
npm install
npm run dev      # watch mode — rebuilds on save
npm run build    # production build
```

Load the extension in Chrome/Edge:
1. Go to `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

After each build, click the reload icon on the extension card to pick up changes.

## Publishing

```bash
node scripts/publish.js
```

Prompts for a version bump and release notes, then builds, zips, and submits to the Edge Add-ons API. Requires a `.env` file in this folder:

```
EDGE_CLIENT_ID=...
EDGE_API_KEY=...
EDGE_PRODUCT_ID=...
```

Get these from [Microsoft Partner Center](https://partner.microsoft.com/dashboard) → Your extension → Publish API.

## Project structure

```
multistreamview/
├── manifest.json
├── public/
│   ├── rules.json          # declarativeNetRequest header rules
│   └── icons/
├── scripts/
│   └── publish.js          # Edge Add-ons publish script
└── src/
    ├── background/
    │   └── service-worker.js
    ├── popup/
    └── multistream/
        ├── components/
        ├── hooks/
        └── utils/
```

## YouTube embed

YouTube embeds require a valid `https://` referrer. The extension uses a GitHub Pages proxy at `mark-boots.github.io/browser-extensions/youtube-embed.html` which loads the YouTube embed with the correct origin.
