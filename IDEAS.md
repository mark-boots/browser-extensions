# Browser Extension Ideas

---

## Page Annotator
**Status:** Idea

Draw directly on top of any webpage, then screenshot the result. Replaces the Windows Snipping Tool workflow — no alt-tabbing, the page stays in place while you annotate.

**Tools:** arrows, circles, rectangles, freehand, text  
**Capture:** composites the canvas + page into one image, saved to clipboard or downloaded  
**Activation:** toolbar button or keyboard shortcut toggles the overlay on/off

**Notes:**
- Clean and local-only, no accounts (unlike Nimbus/Awesome Screenshot)
- Stretch goal: full-page capture by stitching multiple screenshots
- Arrow tool needs angle + arrowhead math

---

## New Tab Code Editor
**Status:** Idea

A CodePen-inspired live code editor that replaces the new tab page. Three panes (HTML, CSS, JS) with a live preview that updates as you type. Clean, distraction-free, always one `Ctrl+T` away.

**Inspiration:** CodePen — split pane layout, live preview  
**Output:** preview iframe with `srcdoc` that re-renders on input  
**Nice to haves:** reset button, copy output, maybe save snippets locally

**Notes:**
- New tab override via `chrome_url_overrides` in manifest
- No backend needed, fully local
- Could persist last session via `localStorage`

---
