const slider        = document.getElementById('slider');
const display       = document.getElementById('display');
const resetBtn      = document.getElementById('reset');
const bassSlider    = document.getElementById('bass');
const bassDisplay   = document.getElementById('bass-display');
const trebleSlider  = document.getElementById('treble');
const trebleDisplay = document.getElementById('treble-display');
const monoCheck     = document.getElementById('mono');

function formatGain(v) { return Math.round(v * 100) + '%'; }
function formatDb(v)   { return (v > 0 ? '+' : '') + v + ' dB'; }

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function init() {
  const tab = await getActiveTab();
  const keys = [`gain_${tab.id}`, `bass_${tab.id}`, `treble_${tab.id}`, `mono_${tab.id}`];
  const r = await chrome.storage.session.get(keys);

  slider.value           = r[`gain_${tab.id}`]   ?? 1.0;
  display.textContent    = formatGain(slider.value);
  bassSlider.value       = r[`bass_${tab.id}`]   ?? 0;
  bassDisplay.textContent = formatDb(bassSlider.value);
  trebleSlider.value     = r[`treble_${tab.id}`] ?? 0;
  trebleDisplay.textContent = formatDb(trebleSlider.value);
  monoCheck.checked      = r[`mono_${tab.id}`]   ?? false;
}

async function send(type, value, storageKey) {
  const tab = await getActiveTab();
  chrome.storage.session.set({ [`${storageKey}_${tab.id}`]: value });
  chrome.tabs.sendMessage(tab.id, { type, value });
}

slider.addEventListener('input', () => {
  const v = parseFloat(slider.value);
  display.textContent = formatGain(v);
  send('AC_SET_GAIN', v, 'gain');
});

resetBtn.addEventListener('click', async () => {
  slider.value = 1;        display.textContent = formatGain(1);
  bassSlider.value = 0;    bassDisplay.textContent = formatDb(0);
  trebleSlider.value = 0;  trebleDisplay.textContent = formatDb(0);
  monoCheck.checked = false;
  const tab = await getActiveTab();
  const id = tab.id;
  await chrome.storage.session.set({ [`gain_${id}`]: 1.0, [`bass_${id}`]: 0, [`treble_${id}`]: 0, [`mono_${id}`]: false });
  chrome.tabs.sendMessage(id, { type: 'AC_SET_GAIN',   value: 1.0 });
  chrome.tabs.sendMessage(id, { type: 'AC_SET_BASS',   value: 0 });
  chrome.tabs.sendMessage(id, { type: 'AC_SET_TREBLE', value: 0 });
  chrome.tabs.sendMessage(id, { type: 'AC_SET_MONO',   value: false });
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

monoCheck.addEventListener('change', () => {
  send('AC_SET_MONO', monoCheck.checked, 'mono');
});

init();
