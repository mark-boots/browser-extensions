const { EditorState, EditorView, Prec, keymap, html, css, javascript, oneDark, basicSetup, StateField, StateEffect, Compartment,
        showTooltip, indentUnit,
        dracula, tokyoNight, nord, solarizedDark, solarizedLight, githubDark, githubLight, materialDark, materialLight, monokai } = CM;

// ─── DOM refs ───────────────────────────────────────────────────────────────
const preview          = document.getElementById('preview');
const btnNewTab        = document.getElementById('btn-new-tab');
const btnOpenTabs      = document.getElementById('btn-open-tabs');
const btnFullPreview   = document.getElementById('btn-full-preview');
const btnSettings      = document.getElementById('btn-settings');
const settingsModal    = document.getElementById('settings-modal');
const settingsOverlay  = document.getElementById('settings-overlay');
const settingsClose    = document.getElementById('settings-close');
const btnFontDec       = document.getElementById('btn-font-dec');
const btnFontInc       = document.getElementById('btn-font-inc');
const fontSizeVal      = document.getElementById('font-size-val');
const toggleWrap       = document.getElementById('toggle-wrap');
const btnToggleConsole = document.getElementById('btn-toggle-console');
const consolePanel     = document.getElementById('console-panel');
const consoleEntries   = document.getElementById('console-entries');
const btnClearConsole  = document.getElementById('btn-clear-console');
const tabNameInput     = document.getElementById('tab-name');
const unsavedDot       = document.getElementById('unsaved-dot');
const btnSave          = document.getElementById('btn-save');
const btnRun           = document.getElementById('btn-run');
const toggleAutoRun    = document.getElementById('toggle-autorun');
const toggleAutoSave   = document.getElementById('toggle-autosave');
const tabsModal        = document.getElementById('tabs-modal');
const modalOverlay     = document.getElementById('modal-overlay');
const modalClose       = document.getElementById('modal-close');
const tabsList         = document.getElementById('tabs-list');
const templateModal    = document.getElementById('template-modal');
const templateOverlay  = document.getElementById('template-overlay');
const templateClose    = document.getElementById('template-close');
const templateGrid     = document.getElementById('template-grid');
const resourcesCssList = document.getElementById('resources-css-list');
const resourcesJsList  = document.getElementById('resources-js-list');
const resourcesCssInput= document.getElementById('resources-css-input');
const resourcesJsInput = document.getElementById('resources-js-input');
const btnAddCssRes     = document.getElementById('btn-add-css-resource');
const btnAddJsRes      = document.getElementById('btn-add-js-resource');

// ─── Storage ─────────────────────────────────────────────────────────────────
const PENS_KEY        = 'codetab_pens';
const CURRENT_PEN_KEY = 'codetab_current';

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function getTabSettings() { const p = getPens(); const id = getCurrentId(); return Object.assign({ autoRun: true, autoSave: true }, p[id]?.settings); }
function saveTabSettings(s) { const p = getPens(); const id = getCurrentId(); if (!p[id]) return; p[id].settings = s; setPens(p); }
function getPens() { try { return JSON.parse(localStorage.getItem(PENS_KEY) || '{}'); } catch { return {}; } }
function setPens(p) { localStorage.setItem(PENS_KEY, JSON.stringify(p)); }
function getCurrentId() { return localStorage.getItem(CURRENT_PEN_KEY); }
function setCurrentId(id) { localStorage.setItem(CURRENT_PEN_KEY, id); }
function formatDate(ts) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }

// ─── Templates ───────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'blank', name: 'Blank', desc: 'Empty editors', html: '', css: '', js: '' },
  {
    id: 'html5', name: 'HTML5 Boilerplate', desc: 'Basic HTML5 structure',
    html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>`,
    css: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n\nbody {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n}`,
    js: '',
  },
  {
    id: 'tailwind', name: 'Tailwind CSS', desc: 'Tailwind via CDN',
    html: `<script src="https://cdn.tailwindcss.com"><\/script>\n\n<div class="min-h-screen bg-gray-100 flex items-center justify-center">\n  <div class="bg-white p-8 rounded-xl shadow">\n    <h1 class="text-2xl font-bold text-gray-800">Hello, Tailwind!</h1>\n    <p class="text-gray-500 mt-2">Start building something.</p>\n  </div>\n</div>`,
    css: '', js: '',
  },
  {
    id: 'bootstrap', name: 'Bootstrap 5', desc: 'Bootstrap 5 via CDN',
    html: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">\n<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"><\/script>\n\n<div class="container py-5">\n  <h1 class="mb-3">Hello, Bootstrap!</h1>\n  <button class="btn btn-primary">Click me</button>\n</div>`,
    css: '', js: '',
  },
  {
    id: 'react', name: 'React 18 (CDN)', desc: 'React via CDN, no build step',
    html: `<div id="root"></div>\n<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>\n<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>`,
    css: `body { font-family: system-ui, sans-serif; padding: 2rem; }`,
    js: `function App() {\n  const [count, setCount] = React.useState(0);\n  return React.createElement('div', null,\n    React.createElement('h1', null, 'Hello, React!'),\n    React.createElement('p', null, 'Count: ' + count),\n    React.createElement('button', { onClick: () => setCount(c => c + 1) }, 'Increment')\n  );\n}\n\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));`,
  },
  {
    id: 'vue', name: 'Vue 3 (CDN)', desc: 'Vue 3 via CDN',
    html: `<script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script>\n\n<div id="app">\n  <h1>{{ message }}</h1>\n  <button @click="count++">Count: {{ count }}</button>\n</div>`,
    css: `body { font-family: system-ui, sans-serif; padding: 2rem; }`,
    js: `Vue.createApp({\n  data() {\n    return { message: 'Hello, Vue!', count: 0 };\n  }\n}).mount('#app');`,
  },
];

// ─── Preview ─────────────────────────────────────────────────────────────────
const CONSOLE_INTERCEPTOR = `<script>
(function() {
  ['log','info','warn','error'].forEach(m => {
    const orig = console[m];
    console[m] = function(...args) {
      orig.apply(console, args);
      window.parent.postMessage({ source:'codetab-console', type:m,
        args: args.map(a => { try { return typeof a === 'object' ? JSON.stringify(a,null,2) : String(a); } catch { return '[Object]'; } })
      }, '*');
    };
  });
  window.addEventListener('error', e =>
    window.parent.postMessage({ source:'codetab-console', type:'error', args:[e.message + ' (line ' + e.lineno + ')'] }, '*')
  );
})();
<\/script>`;

function buildDocument(h, c, j, resources = { css: [], js: [] }) {
  const cssLinks  = (resources.css || []).map(u => `<link rel="stylesheet" href="${u}">`).join('\n');
  const jsScripts = (resources.js  || []).map(u => `<script src="${u}"><\/script>`).join('\n');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">\n${cssLinks}\n<style>${c}</style></head><body>\n${CONSOLE_INTERCEPTOR}\n${h}\n${jsScripts}\n<script>${j}<\/script></body></html>`;
}

function getCurrentResources() {
  const pens = getPens();
  const id = getCurrentId();
  return pens[id]?.resources || { css: [], js: [] };
}

function updatePreview() {
  if (!preview.contentWindow) return;
  preview.contentWindow.postMessage({
    type: 'preview-update',
    html: buildDocument(
      htmlView.state.doc.toString(),
      cssView.state.doc.toString(),
      jsView.state.doc.toString(),
      getCurrentResources()
    )
  }, '*');
}

preview.addEventListener('load', updatePreview);

// ─── Console panel ───────────────────────────────────────────────────────────
window.addEventListener('message', e => {
  if (e.data?.source !== 'codetab-console') return;
  addConsoleEntry(e.data.type, e.data.args);
});

function addConsoleEntry(type, args) {
  const entry = document.createElement('div');
  entry.className = `console-entry console-entry--${type}`;
  const badge = document.createElement('span');
  badge.className = 'console-badge';
  badge.textContent = type;
  const text = document.createElement('span');
  text.textContent = args.join(' ');
  entry.appendChild(badge);
  entry.appendChild(text);
  consoleEntries.appendChild(entry);
  consoleEntries.scrollTop = consoleEntries.scrollHeight;
}

function setConsoleOpen(open) {
  consolePanel.classList.toggle('hidden', !open);
  btnToggleConsole.classList.toggle('active', open);
  const pens = getPens(); const id = getCurrentId();
  if (pens[id]) { pens[id].consoleOpen = open; setPens(pens); }
}

btnToggleConsole.addEventListener('click', () => {
  setConsoleOpen(consolePanel.classList.contains('hidden'));
  setTimeout(refreshEditors, 50);
});

btnClearConsole.addEventListener('click', () => { consoleEntries.innerHTML = ''; });

// ─── Console resize ───────────────────────────────────────────────────────────
const consoleResizeHandle = document.getElementById('console-resize-handle');
const CONSOLE_H_KEY = 'codetab_console_h';

const savedConsoleH = parseInt(localStorage.getItem(CONSOLE_H_KEY) || '180');
consolePanel.style.height = savedConsoleH + 'px';

consoleResizeHandle.addEventListener('mousedown', e => {
  e.preventDefault();
  const startY = e.clientY;
  const startH = consolePanel.offsetHeight;
  consoleResizeHandle.classList.add('dragging');
  preview.style.pointerEvents = 'none';

  function onMove(e) {
    const delta = startY - e.clientY;
    const newH = Math.min(Math.max(startH + delta, 80), window.innerHeight * 0.7);
    consolePanel.style.height = newH + 'px';
    refreshEditors();
  }

  function onUp() {
    consoleResizeHandle.classList.remove('dragging');
    preview.style.pointerEvents = '';
    localStorage.setItem(CONSOLE_H_KEY, consolePanel.offsetHeight);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

// ─── Auto-save ───────────────────────────────────────────────────────────────
let debounceTimer;
let hasUnsaved = false;
let suppressInput = false;

function applySettingsUI(s) {
  btnRun.classList.toggle('hidden', s.autoRun !== false);
  const showSave = hasUnsaved && !s.autoSave;
  unsavedDot.classList.toggle('hidden', !showSave);
  btnSave.classList.toggle('hidden', !showSave);
}

function setUnsaved(val) {
  hasUnsaved = val;
  applySettingsUI(getTabSettings());
}

function onInput() {
  if (suppressInput) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const s = getTabSettings();
    if (s.autoRun) updatePreview();
    if (s.autoSave) { saveCurrentTab(); setUnsaved(false); }
    else setUnsaved(true);
  }, 300);
}

function manualSave() {
  saveCurrentTab();
  setUnsaved(false);
}

function saveCurrentTab() {
  const id = getCurrentId();
  if (!id) return;
  const pens = getPens();
  if (!pens[id]) return;
  pens[id].html      = htmlView.state.doc.toString();
  pens[id].css       = cssView.state.doc.toString();
  pens[id].js        = jsView.state.doc.toString();
  pens[id].name      = tabNameInput.value || 'Untitled';
  pens[id].updatedAt = Date.now();
  setPens(pens);
}

// ─── Editor content ───────────────────────────────────────────────────────────
function setContent(view, content) {
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content || '' } });
}

function loadTabIntoEditors(tab) {
  suppressInput = true;
  setContent(htmlView, tab.html);
  setContent(cssView,  tab.css);
  setContent(jsView,   tab.js);
  suppressInput = false;
  tabNameInput.value = tab.name;
  const s = Object.assign({ autoRun: true, autoSave: true }, tab.settings);
  toggleAutoRun.checked  = s.autoRun;
  toggleAutoSave.checked = s.autoSave;
  hasUnsaved = false;
  applySettingsUI(s);
  consolePanel.classList.toggle('hidden', !tab.consoleOpen);
  btnToggleConsole.classList.toggle('active', !!tab.consoleOpen);
  updatePreview();
}

// ─── Tab operations ───────────────────────────────────────────────────────────
function createTab(name = 'Untitled', tpl = TEMPLATES[0]) {
  const id  = genId();
  const tab = { id, name, html: tpl.html, css: tpl.css, js: tpl.js, resources: { css: [], js: [] }, settings: { autoRun: true, autoSave: true }, createdAt: Date.now(), updatedAt: Date.now() };
  const pens = getPens();
  pens[id] = tab;
  setPens(pens);
  return tab;
}

function openTab(id) {
  if (hasUnsaved && !confirm('You have unsaved changes. Discard them and switch tab?')) return;
  saveCurrentTab();
  setUnsaved(false);
  const pens = getPens();
  const tab  = pens[id];
  if (!tab) return;
  setCurrentId(id);
  loadTabIntoEditors(tab);
  closeAllModals();
}

function deleteTab(id) {
  const pens = getPens();
  if (!pens[id]) return;
  if (!confirm(`Delete "${pens[id].name}"? This cannot be undone.`)) return;
  delete pens[id];
  setPens(pens);
  if (getCurrentId() === id) {
    const remaining = Object.keys(getPens());
    if (remaining.length > 0) openTab(remaining[remaining.length - 1]);
    else openTab(createTab().id);
  }
  renderTabsList();
}

function renameTab(id, name) {
  const pens = getPens();
  if (!pens[id]) return;
  pens[id].name = name || 'Untitled';
  pens[id].updatedAt = Date.now();
  setPens(pens);
}

function duplicateTab(id) {
  const pens = getPens();
  const tab = pens[id];
  if (!tab) return;
  const newTab = createTab(tab.name + ' (copy)', { html: tab.html, css: tab.css, js: tab.js });
  const all = getPens();
  all[newTab.id].resources = JSON.parse(JSON.stringify(tab.resources || { css: [], js: [] }));
  all[newTab.id].settings = Object.assign({}, tab.settings);
  setPens(all);
  renderTabsList();
}

// ─── My CodeTabs modal ────────────────────────────────────────────────────────
function renderTabsList() {
  const pens      = getPens();
  const currentId = getCurrentId();
  const sorted    = Object.values(pens).sort((a, b) => b.updatedAt - a.updatedAt);
  if (sorted.length === 0) { tabsList.innerHTML = '<p class="tabs-empty">No saved CodeTabs yet.</p>'; return; }
  tabsList.innerHTML = sorted.map(tab => `
    <div class="tab-item ${tab.id === currentId ? 'tab-item--active' : ''}" data-id="${tab.id}">
      <div class="tab-info">
        <span class="tab-item-name">${tab.name || 'Untitled'}</span>
        <span class="tab-item-date">${formatDate(tab.updatedAt)}</span>
      </div>
      <div class="tab-actions">
        <button class="tab-btn tab-btn-open" data-id="${tab.id}">Open</button>
        <button class="tab-btn tab-btn-duplicate" data-id="${tab.id}">Duplicate</button>
        <button class="tab-btn tab-btn-export" data-id="${tab.id}">Export</button>
        <button class="tab-btn tab-btn-delete" data-id="${tab.id}">Delete</button>
      </div>
    </div>`).join('');
  tabsList.querySelectorAll('.tab-btn-open').forEach(btn => btn.addEventListener('click', () => openTab(btn.dataset.id)));
  tabsList.querySelectorAll('.tab-btn-duplicate').forEach(btn => btn.addEventListener('click', () => duplicateTab(btn.dataset.id)));
  tabsList.querySelectorAll('.tab-btn-export').forEach(btn => btn.addEventListener('click', () => exportTab(btn.dataset.id)));
  tabsList.querySelectorAll('.tab-btn-delete').forEach(btn => btn.addEventListener('click', () => deleteTab(btn.dataset.id)));
}

// ─── Template picker ──────────────────────────────────────────────────────────
function renderTemplateGrid() {
  templateGrid.innerHTML = TEMPLATES.map(t => `
    <div class="template-card" data-id="${t.id}">
      <div class="template-card-name">${t.name}</div>
      <div class="template-card-desc">${t.desc}</div>
    </div>`).join('');
  templateGrid.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const tpl = TEMPLATES.find(t => t.id === card.dataset.id);
      const tab = createTab(tpl.name === 'Blank' ? 'Untitled' : tpl.name, tpl);
      openTab(tab.id);
    });
  });
}

// ─── External resources ───────────────────────────────────────────────────────
function getResources() {
  const pens = getPens();
  const id = getCurrentId();
  return pens[id]?.resources || { css: [], js: [] };
}

function saveResources(resources) {
  const pens = getPens();
  const id = getCurrentId();
  if (!pens[id]) return;
  pens[id].resources = resources;
  setPens(pens);
  updatePreview();
}

function renderResourcesList() {
  const resources = getResources();
  const render = (list, el, type) => {
    el.innerHTML = list.length === 0
      ? '<div style="color:var(--text-muted);font-size:12px;padding:4px 0">No resources added.</div>'
      : list.map((url, i) => `
          <div class="resource-item">
            <span>${url}</span>
            <button class="resource-remove" data-type="${type}" data-index="${i}">✕</button>
          </div>`).join('');
    el.querySelectorAll('.resource-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const res = getResources();
        res[btn.dataset.type].splice(Number(btn.dataset.index), 1);
        saveResources(res);
        renderResourcesList();
      });
    });
  };
  render(resources.css || [], resourcesCssList, 'css');
  render(resources.js  || [], resourcesJsList,  'js');
}

function addResource(type, url) {
  if (!url.trim()) return;
  const res = getResources();
  if (!res[type].includes(url)) res[type].push(url.trim());
  saveResources(res);
  renderResourcesList();
}

btnAddCssRes.addEventListener('click', () => { addResource('css', resourcesCssInput.value); resourcesCssInput.value = ''; });
btnAddJsRes.addEventListener('click',  () => { addResource('js',  resourcesJsInput.value);  resourcesJsInput.value  = ''; });
resourcesCssInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnAddCssRes.click(); });
resourcesJsInput.addEventListener('keydown',  e => { if (e.key === 'Enter') btnAddJsRes.click(); });

// ─── Format (Prettier) ────────────────────────────────────────────────────────
async function formatPane(view, parser, plugins, btn) {
  btn.textContent = '...';
  btn.disabled = true;
  try {
    const { format } = PrettierLib;
    const result = await format(view.state.doc.toString(), { parser, plugins });
    setContent(view, result);
  } catch (e) {
    console.warn('Format error:', e);
  }
  btn.textContent = 'Format';
  btn.disabled = false;
}

document.getElementById('btn-format-html').addEventListener('click', function() {
  const { htmlPlugin, estreePlugin } = PrettierLib;
  formatPane(htmlView, 'html', [htmlPlugin, estreePlugin], this);
});
document.getElementById('btn-format-css').addEventListener('click', function() {
  const { cssPlugin } = PrettierLib;
  formatPane(cssView, 'css', [cssPlugin], this);
});
document.getElementById('btn-format-js').addEventListener('click', function() {
  const { babelPlugin, estreePlugin } = PrettierLib;
  formatPane(jsView, 'babel', [babelPlugin, estreePlugin], this);
});

// ─── Export as ZIP ────────────────────────────────────────────────────────────
async function exportTab(id) {
  const pens = getPens();
  const tab  = pens[id];
  if (!tab) return;
  const name = (tab.name || 'codetab').replace(/\s+/g, '-').toLowerCase();
  const zip  = new JSZip();
  zip.file('index.html', tab.html || '');
  zip.file('style.css',  tab.css  || '');
  zip.file('script.js',  tab.js   || '');
  const blob = await zip.generateAsync({ type: 'blob' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${name}.zip`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Full preview ─────────────────────────────────────────────────────────────
btnFullPreview.addEventListener('click', () => {
  const docHtml = buildDocument(
    htmlView.state.doc.toString(),
    cssView.state.doc.toString(),
    jsView.state.doc.toString(),
    getCurrentResources()
  );
  const blob = new Blob([docHtml], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
});

// ─── Settings: font size & wrap lines ────────────────────────────────────────
const fontCompartment = new Compartment();
const wrapCompartment = new Compartment();
const FONT_KEY = 'codetab_fontsize';
const WRAP_KEY = 'codetab_wrap';
let currentFontSize = parseInt(localStorage.getItem(FONT_KEY) || '13');
let wrapEnabled = localStorage.getItem(WRAP_KEY) === 'true';

function fontTheme(size) {
  return EditorView.theme({ '.cm-content, .cm-gutters': { fontSize: `${size}px` } });
}

function applyFontSize(size) {
  currentFontSize = Math.max(10, Math.min(24, size));
  fontSizeVal.textContent = currentFontSize;
  localStorage.setItem(FONT_KEY, currentFontSize);
  [htmlView, cssView, jsView].forEach(v => v.dispatch({ effects: fontCompartment.reconfigure(fontTheme(currentFontSize)) }));
}

function applyWrap(enabled) {
  wrapEnabled = enabled;
  toggleWrap.checked = enabled;
  localStorage.setItem(WRAP_KEY, enabled);
  const ext = enabled ? EditorView.lineWrapping : [];
  [htmlView, cssView, jsView].forEach(v => v.dispatch({ effects: wrapCompartment.reconfigure(ext) }));
}

btnFontDec.addEventListener('click', () => applyFontSize(currentFontSize - 1));
btnFontInc.addEventListener('click', () => applyFontSize(currentFontSize + 1));
toggleWrap.addEventListener('change', () => applyWrap(toggleWrap.checked));

// ─── Settings: theme ─────────────────────────────────────────────────────────
const themeCompartment = new Compartment();
const THEME_KEY = 'codetab_theme';

const THEMES = [
  { id: 'one-dark',        label: 'One Dark',        ext: oneDark       },
  { id: 'dracula',         label: 'Dracula',          ext: dracula       },
  { id: 'tokyo-night',     label: 'Tokyo Night',      ext: tokyoNight    },
  { id: 'nord',            label: 'Nord',             ext: nord          },
  { id: 'monokai',         label: 'Monokai',          ext: monokai       },
  { id: 'material-dark',   label: 'Material Dark',    ext: materialDark  },
  { id: 'material-light',  label: 'Material Light',   ext: materialLight },
  { id: 'github-dark',     label: 'GitHub Dark',      ext: githubDark    },
  { id: 'github-light',    label: 'GitHub Light',     ext: githubLight   },
  { id: 'solarized-dark',  label: 'Solarized Dark',   ext: solarizedDark },
  { id: 'solarized-light', label: 'Solarized Light',  ext: solarizedLight},
];

let currentThemeId = localStorage.getItem(THEME_KEY) || 'one-dark';

const themeSelect = document.getElementById('theme-select');
themeSelect.innerHTML = THEMES.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
themeSelect.value = currentThemeId;

function applyTheme(id) {
  currentThemeId = id;
  localStorage.setItem(THEME_KEY, id);
  const ext = THEMES.find(t => t.id === id)?.ext || oneDark;
  [htmlView, cssView, jsView].forEach(v => v.dispatch({ effects: themeCompartment.reconfigure(ext) }));
}

themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));

// ─── Settings: indent size ────────────────────────────────────────────────────
const indentCompartment = new Compartment();
const INDENT_KEY = 'codetab_indent';
let currentIndent = parseInt(localStorage.getItem(INDENT_KEY) || '2');

const indentSelect = document.getElementById('indent-select');
indentSelect.value = currentIndent;

function applyIndent(size) {
  currentIndent = size;
  localStorage.setItem(INDENT_KEY, size);
  const ext = indentUnit.of(' '.repeat(size));
  [htmlView, cssView, jsView].forEach(v => v.dispatch({ effects: indentCompartment.reconfigure(ext) }));
}

indentSelect.addEventListener('change', () => applyIndent(Number(indentSelect.value)));


toggleAutoRun.addEventListener('change', () => { const s = getTabSettings(); s.autoRun = toggleAutoRun.checked; saveTabSettings(s); applySettingsUI(s); });
toggleAutoSave.addEventListener('change', () => { const s = getTabSettings(); s.autoSave = toggleAutoSave.checked; saveTabSettings(s); applySettingsUI(s); });

btnSettings.addEventListener('click', () => {
  renderResourcesList();
  const s = getTabSettings();
  toggleAutoRun.checked  = s.autoRun;
  toggleAutoSave.checked = s.autoSave;
  settingsModal.classList.remove('hidden');
});
settingsOverlay.addEventListener('click', closeAllModals);
settingsClose.addEventListener('click', closeAllModals);

// ─── Modal helpers ────────────────────────────────────────────────────────────
function closeAllModals() {
  tabsModal.classList.add('hidden');
  templateModal.classList.add('hidden');
  settingsModal.classList.add('hidden');
}

btnOpenTabs.addEventListener('click', () => { renderTabsList(); tabsModal.classList.remove('hidden'); });
modalOverlay.addEventListener('click', closeAllModals);
modalClose.addEventListener('click', closeAllModals);

btnNewTab.addEventListener('click', () => { saveCurrentTab(); renderTemplateGrid(); tabsModal.classList.add('hidden'); templateModal.classList.remove('hidden'); });
templateOverlay.addEventListener('click', closeAllModals);
templateClose.addEventListener('click', closeAllModals);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeAllModals(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); manualSave(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); updatePreview(); }
});

btnRun.addEventListener('click', updatePreview);
btnSave.addEventListener('click', manualSave);

window.addEventListener('beforeunload', e => {
  if (hasUnsaved) { e.preventDefault(); }
});

tabNameInput.addEventListener('input', () => renameTab(getCurrentId(), tabNameInput.value));

// ─── Buttons ─────────────────────────────────────────────────────────────────
function copyPane(view, btn) {
  navigator.clipboard.writeText(view.state.doc.toString()).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}

document.getElementById('btn-copy-html').addEventListener('click', function() { copyPane(htmlView, this); });
document.getElementById('btn-copy-css').addEventListener('click',  function() { copyPane(cssView,  this); });
document.getElementById('btn-copy-js').addEventListener('click',   function() { copyPane(jsView,   this); });

// ─── Emmet ───────────────────────────────────────────────────────────────────
const EMMET_KEY = 'codetab_emmet';
let emmetEnabled = localStorage.getItem(EMMET_KEY) !== 'false';
const toggleEmmet = document.getElementById('toggle-emmet');
toggleEmmet.checked = emmetEnabled;
toggleEmmet.addEventListener('change', () => {
  emmetEnabled = toggleEmmet.checked;
  localStorage.setItem(EMMET_KEY, emmetEnabled);
});
function tryEmmetExpand(lineText, type) {
  const extracted = EmmetLib.extract(lineText, lineText.length, { type });
  if (!extracted || !extracted.abbreviation) return null;
  const expanded = EmmetLib.default(extracted.abbreviation, {
    type, syntax: type === 'markup' ? 'html' : 'css',
    options: { 'output.indent': '  ', 'output.baseIndent': '' },
  });
  return expanded ? { extracted, expanded } : null;
}

const emmetTooltipEffect = StateEffect.define();
let emmetTimer;

function makeEmmetPreview(type) {
  const field = StateField.define({
    create: () => null,
    update(tooltip, tr) {
      for (const e of tr.effects) if (e.is(emmetTooltipEffect)) return e.value;
      if (tr.docChanged || tr.selectionSet) return null;
      return tooltip;
    },
    provide: f => showTooltip.from(f),
  });

  const listener = EditorView.updateListener.of(update => {
    if (!update.docChanged && !update.selectionSet) return;
    clearTimeout(emmetTimer);
    if (!emmetEnabled) return;
    emmetTimer = setTimeout(() => {
      const { from } = update.view.state.selection.main;
      const line = update.view.state.doc.lineAt(from);
      const lineText = line.text.substring(0, from - line.from);
      try {
        const result = tryEmmetExpand(lineText, type);
        if (result) {
          const clean = result.expanded.replace(/\$\{\d+(?::[^}]*)?\}/g, '');
          update.view.dispatch({ effects: emmetTooltipEffect.of({
            pos: from, above: false, strictSide: true,
            create() {
              const wrapper = document.createElement('div');
              wrapper.className = 'cm-emmet-preview';
              const label = document.createElement('span');
              label.className = 'cm-emmet-preview-label';
              label.textContent = 'Tab to expand';
              wrapper.appendChild(label);
              const editorEl = document.createElement('div');
              wrapper.appendChild(editorEl);
              const previewView = new EditorView({
                state: EditorState.create({
                  doc: clean,
                  extensions: [
                    oneDark, type === 'markup' ? html() : css(),
                    EditorState.readOnly.of(true), EditorView.editable.of(false),
                    EditorView.theme({
                      '&': { background: 'transparent' },
                      '.cm-gutters': { display: 'none' }, '.cm-cursor': { display: 'none' },
                      '.cm-scroller': { fontFamily: "'Cascadia Code','Fira Code',Consolas,monospace", fontSize: '12px', maxHeight: '180px', overflow: 'auto' },
                      '.cm-content': { padding: '2px 0' },
                    }),
                  ],
                }),
                parent: editorEl,
              });
              return { dom: wrapper, destroy() { previewView.destroy(); } };
            },
          }) });
        }
      } catch {}
    }, 600);
  });

  return [field, listener];
}

function makeEmmetKeymap(type) {
  return Prec.highest(keymap.of([{
    key: 'Tab',
    run: (view) => {
      if (!emmetEnabled) return false;
      const { from } = view.state.selection.main;
      const line = view.state.doc.lineAt(from);
      const lineText = line.text.substring(0, from - line.from);
      try {
        const result = tryEmmetExpand(lineText, type);
        if (result) {
          const { extracted, expanded } = result;
          const baseIndent = line.text.match(/^(\s*)/)[1];
          const indented = expanded.replace(/^/gm, (_, o) => o === 0 ? '' : baseIndent);
          const clean = indented.replace(/\$\{\d+(?::[^}]*)?\}/g, '');
          const abbrFrom = line.from + extracted.start;
          const cursorPos = abbrFrom + (indented.indexOf('${') !== -1 ? indented.indexOf('${') : clean.length);
          view.dispatch({ changes: { from: abbrFrom, to: from, insert: clean }, selection: { anchor: cursorPos } });
          return true;
        }
      } catch {}
      return false;
    },
  }]));
}

// ─── Editor creation ──────────────────────────────────────────────────────────
function createEditor(parentId, lang, emmetType) {
  const extensions = [
    basicSetup, lang,
    themeCompartment.of(THEMES.find(t => t.id === currentThemeId)?.ext || oneDark),
    fontCompartment.of(fontTheme(currentFontSize)),
    wrapCompartment.of(wrapEnabled ? EditorView.lineWrapping : []),
    indentCompartment.of(indentUnit.of(' '.repeat(currentIndent))),
    EditorView.updateListener.of(u => { if (u.docChanged) onInput(); }),
  ];
  if (emmetType) { extensions.push(makeEmmetPreview(emmetType)); extensions.push(makeEmmetKeymap(emmetType)); }
  return new EditorView({ state: EditorState.create({ doc: '', extensions }), parent: document.getElementById(parentId) });
}

const htmlView = createEditor('editor-html', html(), 'markup');
const cssView  = createEditor('editor-css',  css(),  'stylesheet');
const jsView   = createEditor('editor-js',   javascript());

// ─── Layout + splits ─────────────────────────────────────────────────────────
const mainEl     = document.querySelector('main');
const layoutBtns = document.querySelectorAll('.layout-btn[data-layout]');
const LAYOUT_KEY = 'codetab_layout';
const SIZES_KEY  = 'codetab_sizes';
let splitInstances = [];

function refreshEditors() { [htmlView, cssView, jsView].forEach(v => v.requestMeasure()); }

function loadSizes(layout) { try { return JSON.parse(localStorage.getItem(SIZES_KEY) || '{}')[layout] || null; } catch { return null; } }
function saveSizes(layout, main, editors) {
  try { const s = JSON.parse(localStorage.getItem(SIZES_KEY) || '{}'); s[layout] = { main, editors }; localStorage.setItem(SIZES_KEY, JSON.stringify(s)); } catch {}
}

function initSplits(layout) {
  splitInstances.forEach(s => s.destroy());
  splitInstances = [];
  const editorPanes = Array.from(document.querySelectorAll('.editor-pane'));
  const editorsEl   = document.querySelector('.editors');
  const previewEl   = document.querySelector('.preview-pane');
  const isTop       = layout === 'top';
  const isRight     = layout === 'right';
  const saved       = loadSizes(layout);
  const mainSizes   = saved?.main    || [50, 50];
  const editorSizes = saved?.editors || [33, 33, 34];
  const mainElements = isRight ? [previewEl, editorsEl] : [editorsEl, previewEl];
  const mainSplit = Split(mainElements, {
    direction: isTop ? 'vertical' : 'horizontal', sizes: mainSizes, minSize: 80, gutterSize: 5,
    onDrag: refreshEditors, onDragEnd: (sizes) => saveSizes(layout, sizes, editorSplit.getSizes()),
  });
  const editorSplit = Split(editorPanes, {
    direction: isTop ? 'horizontal' : 'vertical', sizes: editorSizes, minSize: 50, gutterSize: 5,
    onDrag: refreshEditors, onDragEnd: (sizes) => saveSizes(layout, mainSplit.getSizes(), sizes),
  });
  splitInstances = [mainSplit, editorSplit];
  setTimeout(refreshEditors, 50);
}

function setLayout(layout) {
  mainEl.dataset.layout = layout;
  layoutBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.layout === layout));
  localStorage.setItem(LAYOUT_KEY, layout);
  initSplits(layout);
}

layoutBtns.forEach(btn => btn.addEventListener('click', () => setLayout(btn.dataset.layout)));

// ─── Boot ────────────────────────────────────────────────────────────────────
(function init() {
  fontSizeVal.textContent = currentFontSize;
  toggleWrap.checked = wrapEnabled;
  themeSelect.value = currentThemeId;

  const pens = getPens();
  let currentId = getCurrentId();

  if (Object.keys(pens).length === 0) {
    const old = localStorage.getItem('codetab_session');
    const tab = createTab();
    if (old) {
      try {
        const { html: h, css: c, js: j } = JSON.parse(old);
        const all = getPens(); all[tab.id].html = h || ''; all[tab.id].css = c || ''; all[tab.id].js = j || ''; setPens(all);
        localStorage.removeItem('codetab_session');
      } catch {}
    }
    currentId = tab.id;
  } else if (!currentId || !pens[currentId]) {
    currentId = Object.keys(pens)[Object.keys(pens).length - 1];
  }

  setCurrentId(currentId);
  loadTabIntoEditors(getPens()[currentId]);
  setLayout(localStorage.getItem(LAYOUT_KEY) || 'top');
})();
