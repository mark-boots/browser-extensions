import { parseStreamUrl } from '../multistream/utils/urlParser.js';

const MULTISTREAM_PAGE = chrome.runtime.getURL('multistream/index.html');
const VIEWS_KEY        = 'msv_views';
const DEFAULT_VIEW     = { id: 'default', name: 'Default' };

let views        = [];
let viewStreams   = {};   // viewId → streams[]
let parsedStream = null;
let editingId    = null;

// ─── Init ─────────────────────────────────────────────

async function init() {
  const stored = await chrome.storage.local.get(VIEWS_KEY);
  views = stored[VIEWS_KEY]?.length ? stored[VIEWS_KEY] : [DEFAULT_VIEW];
  if (!stored[VIEWS_KEY]?.length) {
    await chrome.storage.local.set({ [VIEWS_KEY]: views });
  }

  // Load streams for each view to check "already added"
  const keys   = views.map(v => `msv_streams_${v.id}`);
  const result = await chrome.storage.local.get(keys);
  for (const v of views) viewStreams[v.id] = result[`msv_streams_${v.id}`] ?? [];

  // Detect stream on current tab
  const [tab]  = await chrome.tabs.query({ active: true, currentWindow: true });
  parsedStream = tab?.url ? parseStreamUrl(tab.url) : null;

  render();
}

// ─── Render ───────────────────────────────────────────

function render() {
  if (parsedStream) {
    const isYT = parsedStream.platform === 'youtube';
    el('stream-badge').textContent = isYT ? 'YT' : 'TW';
    el('stream-badge').className   = `badge badge--${isYT ? 'yt' : 'tw'}`;
    el('stream-info').textContent  = isYT
      ? `youtube.com/watch?v=${parsedStream.videoId}`
      : `twitch.tv/${parsedStream.channel}`;
    show('stream-header');
  } else {
    show('no-stream-header');
  }
  renderList();
}

function renderList() {
  const list = el('view-list');
  list.innerHTML = '';

  for (const view of views) {
    const row = document.createElement('div');
    row.className = 'view-row';

    if (editingId === view.id) {
      // ── Rename mode ──
      const input = document.createElement('input');
      input.className  = 'view-name-input';
      input.value      = view.name;
      input.spellcheck = false;
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  confirmRename(view.id, input.value);
        if (e.key === 'Escape') cancelEdit();
      });
      setTimeout(() => { input.focus(); input.select(); }, 0);

      row.append(
        input,
        iconBtn('✓', () => confirmRename(view.id, input.value), '', 'Save name'),
        iconBtn('✕', cancelEdit, '', 'Cancel'),
      );

    } else if (parsedStream) {
      // ── Add-stream mode ──
      const already = viewStreams[view.id]?.some(s => s.id === parsedStream.id);
      const count   = viewStreams[view.id]?.length ?? 0;

      const name = nameSpan(view.name, count);
      const btn  = document.createElement('button');
      btn.className   = already ? 'btn-added' : 'btn-primary';
      btn.textContent = already ? '✓ Added' : 'Add';
      btn.title       = already ? 'Already in this view' : 'Add stream to this view';
      btn.disabled    = already;
      if (!already) btn.addEventListener('click', () => addToView(view.id));

      const btnOpen = document.createElement('button');
      btnOpen.className   = 'btn-secondary';
      btnOpen.textContent = 'Open';
      btnOpen.title       = 'Open this view';
      btnOpen.addEventListener('click', () => openView(view.id));

      const btnEdit = iconBtn('✎', () => { editingId = view.id; renderList(); }, '', 'Rename view');
      const btnDel  = iconBtn('✕', () => deleteView(view.id), 'btn-icon--danger', 'Delete view');

      row.append(name, btn, btnOpen, btnEdit, btnDel);

    } else {
      // ── Browse mode ──
      const count   = viewStreams[view.id]?.length ?? 0;
      const name    = nameSpan(view.name, count);
      const btnOpen = document.createElement('button');
      btnOpen.className   = 'btn-primary';
      btnOpen.textContent = 'Open';
      btnOpen.title       = 'Open this view';
      btnOpen.addEventListener('click', () => openView(view.id));

      const btnEdit = iconBtn('✎', () => { editingId = view.id; renderList(); }, '', 'Rename view');
      const btnDel  = iconBtn('✕', () => deleteView(view.id), 'btn-icon--danger', 'Delete view');

      row.append(name, btnOpen, btnEdit, btnDel);
    }

    list.appendChild(row);
  }
}

// ─── Actions ──────────────────────────────────────────

async function addToView(viewId) {
  const key     = `msv_streams_${viewId}`;
  const result  = await chrome.storage.local.get(key);
  const current = result[key] ?? [];

  if (current.some(s => s.id === parsedStream.id)) return;

  const hasMain   = current.some(s => s.role === 'main');
  const newStream = { ...parsedStream, role: hasMain ? 'small' : 'main', addedAt: Date.now() };
  const updated   = [...current, newStream];

  await chrome.storage.local.set({ [key]: updated });
  viewStreams[viewId] = updated;
  renderList();
}

async function openView(viewId) {
  const url     = `${MULTISTREAM_PAGE}?view=${viewId}`;
  const pattern = MULTISTREAM_PAGE + '*';
  const allTabs = await chrome.tabs.query({ url: pattern });
  const tab     = allTabs.find(t => new URL(t.url).searchParams.get('view') === viewId);
  if (tab) {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url, active: true });
  }
  window.close();
}

async function confirmRename(viewId, rawName) {
  const name = rawName.trim() || views.find(v => v.id === viewId).name;
  views = views.map(v => v.id === viewId ? { ...v, name } : v);
  await chrome.storage.local.set({ [VIEWS_KEY]: views });
  editingId = null;
  renderList();
}

function cancelEdit() {
  editingId = null;
  renderList();
}

async function deleteView(viewId) {
  // Close the corresponding tab if open
  const pattern = MULTISTREAM_PAGE + '*';
  const allTabs = await chrome.tabs.query({ url: pattern });
  const tab     = allTabs.find(t => new URL(t.url).searchParams.get('view') === viewId);
  if (tab) await chrome.tabs.remove(tab.id);

  views = views.filter(v => v.id !== viewId);

  // Remove all storage keys for this view
  const prefKeys = ['barHeight', 'sidebarWidth', 'pipCorner', 'pipSize', 'tabOrder', 'activeChatId'];
  await chrome.storage.local.remove([
    `msv_streams_${viewId}`,
    ...prefKeys.map(k => `msv_${viewId}_${k}`),
  ]);
  delete viewStreams[viewId];

  // Re-create default if all views were deleted
  if (views.length === 0) {
    views = [DEFAULT_VIEW];
    viewStreams[DEFAULT_VIEW.id] = [];
  }

  await chrome.storage.local.set({ [VIEWS_KEY]: views });
  renderList();
}

async function createView(name) {
  const id      = Date.now().toString(36);
  const newView = { id, name: name || 'New View' };
  views.push(newView);
  viewStreams[id] = [];
  await chrome.storage.local.set({ [VIEWS_KEY]: views });
  hideNewViewForm();
  renderList();
}

// ─── New view form ────────────────────────────────────

el('btn-new-view').addEventListener('click', () => {
  hide('btn-new-view');
  show('new-view-form');
  el('new-view-name').focus();
});

el('btn-create').addEventListener('click', () => {
  createView(el('new-view-name').value.trim());
});

el('btn-cancel').addEventListener('click', hideNewViewForm);

el('new-view-name').addEventListener('keydown', e => {
  if (e.key === 'Enter')  el('btn-create').click();
  if (e.key === 'Escape') hideNewViewForm();
});

function hideNewViewForm() {
  el('new-view-name').value = '';
  hide('new-view-form');
  show('btn-new-view');
}

// ─── Helpers ──────────────────────────────────────────

function el(id)        { return document.getElementById(id); }
function show(id)      { el(id).classList.remove('hidden'); }
function hide(id)      { el(id).classList.add('hidden'); }
function nameSpan(name, count) {
  const wrap = document.createElement('span');
  wrap.className = 'view-name';

  const title = document.createElement('span');
  title.className   = 'view-name__title';
  title.textContent = name;

  const sub = document.createElement('span');
  sub.className   = 'view-name__count';
  sub.textContent = count === 1 ? '1 stream' : `${count} streams`;

  wrap.append(title, sub);
  return wrap;
}
function iconBtn(label, onClick, extraClass = '', tooltip = '') {
  const b = document.createElement('button');
  b.className   = `btn-icon ${extraClass}`.trim();
  b.textContent = label;
  b.title       = tooltip;
  b.addEventListener('click', onClick);
  return b;
}

init();
