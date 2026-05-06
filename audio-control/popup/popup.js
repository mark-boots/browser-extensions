const slider          = document.getElementById('slider');
const display         = document.getElementById('display');
const resetBtn        = document.getElementById('reset');
const bassSlider      = document.getElementById('bass');
const bassDisplay     = document.getElementById('bass-display');
const trebleSlider    = document.getElementById('treble');
const trebleDisplay   = document.getElementById('treble-display');
const panSlider       = document.getElementById('pan');
const panDisplay      = document.getElementById('pan-display');
const compressCheck   = document.getElementById('compress');
const monoCheck       = document.getElementById('mono');

function formatGain(v) { return Math.round(v * 100) + '%'; }
function formatDb(v)   { return (v > 0 ? '+' : '') + v + ' dB'; }
function formatPan(v)  {
  if (v === 0) return 'Center';
  const pct = Math.round(Math.abs(v) * 100);
  return v < 0 ? `L ${pct}%` : `R ${pct}%`;
}

let tabId = null;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab.id;
  const keys = [`gain_${tabId}`, `bass_${tabId}`, `treble_${tabId}`, `mono_${tabId}`, `compress_${tabId}`, `pan_${tabId}`];
  const r = await chrome.storage.session.get(keys);

  slider.value              = r[`gain_${tabId}`]     ?? 1.0;
  display.textContent       = formatGain(slider.value);
  bassSlider.value          = r[`bass_${tabId}`]     ?? 0;
  bassDisplay.textContent   = formatDb(bassSlider.value);
  trebleSlider.value        = r[`treble_${tabId}`]   ?? 0;
  trebleDisplay.textContent = formatDb(trebleSlider.value);
  panSlider.value           = r[`pan_${tabId}`]      ?? 0;
  panDisplay.textContent    = formatPan(parseFloat(panSlider.value));
  compressCheck.checked     = r[`compress_${tabId}`] ?? false;
  monoCheck.checked         = r[`mono_${tabId}`]     ?? false;
}

function send(type, value, storageKey) {
  chrome.storage.session.set({ [`${storageKey}_${tabId}`]: value });
  chrome.tabs.sendMessage(tabId, { type, value });
}

slider.addEventListener('input', () => {
  const v = parseFloat(slider.value);
  display.textContent = formatGain(v);
  send('AC_SET_GAIN', v, 'gain');
});

resetBtn.addEventListener('click', () => {
  slider.value = 1;           display.textContent    = formatGain(1);
  bassSlider.value = 0;       bassDisplay.textContent = formatDb(0);
  trebleSlider.value = 0;     trebleDisplay.textContent = formatDb(0);
  panSlider.value = 0;        panDisplay.textContent  = formatPan(0);
  compressCheck.checked = false;
  monoCheck.checked = false;
  chrome.storage.session.set({ [`gain_${tabId}`]: 1.0, [`bass_${tabId}`]: 0, [`treble_${tabId}`]: 0, [`mono_${tabId}`]: false, [`compress_${tabId}`]: false, [`pan_${tabId}`]: 0 });
  chrome.tabs.sendMessage(tabId, { type: 'AC_SET_GAIN',     value: 1.0 });
  chrome.tabs.sendMessage(tabId, { type: 'AC_SET_BASS',     value: 0 });
  chrome.tabs.sendMessage(tabId, { type: 'AC_SET_TREBLE',   value: 0 });
  chrome.tabs.sendMessage(tabId, { type: 'AC_SET_MONO',     value: false });
  chrome.tabs.sendMessage(tabId, { type: 'AC_SET_COMPRESS', value: false });
  chrome.tabs.sendMessage(tabId, { type: 'AC_SET_PAN',      value: 0 });
  chrome.tabs.sendMessage(tabId, { type: 'AC_SET_SINK',     value: '' });
});

bassSlider.addEventListener('input', () => {
  const v = parseFloat(bassSlider.value);
  bassDisplay.textContent = formatDb(v);
  send('AC_SET_BASS', v, 'bass');
});

trebleSlider.addEventListener('input', () => {
  const v = parseFloat(trebleSlider.value);
  trebleDisplay.textContent = formatDb(v);
  send('AC_SET_TREBLE', v, 'treble');
});

panSlider.addEventListener('input', () => {
  const v = parseFloat(panSlider.value);
  panDisplay.textContent = formatPan(v);
  send('AC_SET_PAN', v, 'pan');
});

compressCheck.addEventListener('change', () => {
  send('AC_SET_COMPRESS', compressCheck.checked, 'compress');
});

monoCheck.addEventListener('change', () => {
  send('AC_SET_MONO', monoCheck.checked, 'mono');
});


init();
