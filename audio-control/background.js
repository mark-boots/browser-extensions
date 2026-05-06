const PRESETS = [
  { id: 'preset-100', label: '100% — Normal', value: 1.0 },
  { id: 'preset-150', label: '150%', value: 1.5 },
  { id: 'preset-200', label: '200%', value: 2.0 },
  { id: 'preset-300', label: '300%', value: 3.0 },
  { id: 'preset-500', label: '500%', value: 5.0 },
];

const BASS_CONTEXT_DEFAULT = 6;    // dB applied when toggled on via context menu
const TREBLE_CONTEXT_DEFAULT = 6;

function keys(tabId) {
  return {
    gain:     `gain_${tabId}`,
    bass:     `bass_${tabId}`,
    treble:   `treble_${tabId}`,
    mono:     `mono_${tabId}`,
    compress: `compress_${tabId}`,
    pan:      `pan_${tabId}`,
  };
}

async function getSettings(tabId) {
  const k = keys(tabId);
  const r = await chrome.storage.session.get(Object.values(k));
  return {
    gain:     r[k.gain]     ?? 1.0,
    bass:     r[k.bass]     ?? 0,
    treble:   r[k.treble]   ?? 0,
    mono:     r[k.mono]     ?? false,
    compress: r[k.compress] ?? false,
    pan:      r[k.pan]      ?? 0,
  };
}

async function applyStoredSettings(tabId) {
  const s = await getSettings(tabId);
  const send = (msg) => chrome.tabs.sendMessage(tabId, msg).catch(() => {});
  if (s.gain !== 1.0)    send({ type: 'AC_SET_GAIN',     value: s.gain });
  if (s.bass !== 0)      send({ type: 'AC_SET_BASS',     value: s.bass });
  if (s.treble !== 0)    send({ type: 'AC_SET_TREBLE',   value: s.treble });
  if (s.mono)            send({ type: 'AC_SET_MONO',     value: s.mono });
  if (s.compress)        send({ type: 'AC_SET_COMPRESS', value: s.compress });
  if (s.pan !== 0)       send({ type: 'AC_SET_PAN',      value: s.pan });
}

function menuTitle(s) {
  const parts = [];
  if (s.gain !== 1.0)  parts.push(`${Math.round(s.gain * 100)}%`);
  if (s.bass !== 0)    parts.push('Bass');
  if (s.treble !== 0)  parts.push('Treble');
  if (s.compress)      parts.push('Compress');
  if (s.mono)          parts.push('Mono');
  if (s.pan < 0)       parts.push('Pan L');
  if (s.pan > 0)       parts.push('Pan R');
  return parts.length ? `Audio Control — ${parts.join(' · ')}` : 'Audio Control';
}

function updateMenu(s) {
  chrome.contextMenus.update('audio-control', { title: menuTitle(s) });
  PRESETS.forEach(p => chrome.contextMenus.update(p.id, { checked: p.value === s.gain }));
  chrome.contextMenus.update('bass-boost',   { checked: s.bass !== 0 });
  chrome.contextMenus.update('treble-boost', { checked: s.treble !== 0 });
  chrome.contextMenus.update('compress',     { checked: s.compress });
  chrome.contextMenus.update('mono',         { checked: s.mono });
}

async function syncMenuForTab(tabId) {
  updateMenu(await getSettings(tabId));
}

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'complete') applyStoredSettings(tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(Object.values(keys(tabId)));
});

chrome.tabs.onActivated.addListener(({ tabId }) => syncMenuForTab(tabId));


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'audio-control', title: 'Audio Control', contexts: ['all'] });
  chrome.contextMenus.create({ id: 'open-control', parentId: 'audio-control', title: 'Open control', contexts: ['all'] });
  chrome.contextMenus.create({ id: 'reset-all', parentId: 'audio-control', title: 'Reset all', contexts: ['all'] });
  chrome.contextMenus.create({ id: 'sep-1', parentId: 'audio-control', type: 'separator', contexts: ['all'] });
  for (const p of PRESETS) {
    chrome.contextMenus.create({ id: p.id, parentId: 'audio-control', type: 'radio', title: p.label, checked: p.value === 1.0, contexts: ['all'] });
  }
  chrome.contextMenus.create({ id: 'sep-2', parentId: 'audio-control', type: 'separator', contexts: ['all'] });
  chrome.contextMenus.create({ id: 'bass-boost',   parentId: 'audio-control', type: 'checkbox', title: 'Bass boost',   checked: false, contexts: ['all'] });
  chrome.contextMenus.create({ id: 'treble-boost', parentId: 'audio-control', type: 'checkbox', title: 'Treble boost', checked: false, contexts: ['all'] });
  chrome.contextMenus.create({ id: 'compress',     parentId: 'audio-control', type: 'checkbox', title: 'Compress',     checked: false, contexts: ['all'] });
  chrome.contextMenus.create({ id: 'mono',         parentId: 'audio-control', type: 'checkbox', title: 'Mono',         checked: false, contexts: ['all'] });
});

if (chrome.contextMenus.onShown) {
  chrome.contextMenus.onShown.addListener(async (info, tab) => {
    if (!tab?.id) return;
    await syncMenuForTab(tab.id);
    chrome.contextMenus.refresh();
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'open-control') { chrome.action.openPopup(); return; }

  if (info.menuItemId === 'reset-all') {
    const k = keys(tab.id);
    await chrome.storage.session.set({ [k.gain]: 1.0, [k.bass]: 0, [k.treble]: 0, [k.mono]: false, [k.compress]: false, [k.pan]: 0 });
    const send = (msg) => chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
    send({ type: 'AC_SET_GAIN',     value: 1.0 });
    send({ type: 'AC_SET_BASS',     value: 0 });
    send({ type: 'AC_SET_TREBLE',   value: 0 });
    send({ type: 'AC_SET_MONO',     value: false });
    send({ type: 'AC_SET_COMPRESS', value: false });
    send({ type: 'AC_SET_PAN',      value: 0 });
    updateMenu({ gain: 1.0, bass: 0, treble: 0, mono: false, compress: false, pan: 0 });
    return;
  }

  const k = keys(tab.id);
  const s = await getSettings(tab.id);

  if (info.menuItemId === 'bass-boost') {
    s.bass = info.checked ? BASS_CONTEXT_DEFAULT : 0;
    await chrome.storage.session.set({ [k.bass]: s.bass });
    chrome.tabs.sendMessage(tab.id, { type: 'AC_SET_BASS', value: s.bass });
  } else if (info.menuItemId === 'treble-boost') {
    s.treble = info.checked ? TREBLE_CONTEXT_DEFAULT : 0;
    await chrome.storage.session.set({ [k.treble]: s.treble });
    chrome.tabs.sendMessage(tab.id, { type: 'AC_SET_TREBLE', value: s.treble });
  } else if (info.menuItemId === 'compress') {
    s.compress = info.checked;
    await chrome.storage.session.set({ [k.compress]: s.compress });
    chrome.tabs.sendMessage(tab.id, { type: 'AC_SET_COMPRESS', value: s.compress });
  } else if (info.menuItemId === 'mono') {
    s.mono = info.checked;
    await chrome.storage.session.set({ [k.mono]: s.mono });
    chrome.tabs.sendMessage(tab.id, { type: 'AC_SET_MONO', value: s.mono });
  } else {
    const preset = PRESETS.find(p => p.id === info.menuItemId);
    if (preset) {
      s.gain = preset.value;
      await chrome.storage.session.set({ [k.gain]: s.gain });
      chrome.tabs.sendMessage(tab.id, { type: 'AC_SET_GAIN', value: s.gain });
    }
  }

  updateMenu(s);
});
