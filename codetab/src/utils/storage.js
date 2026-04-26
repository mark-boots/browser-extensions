const PENS_KEY        = 'codetab_pens';
const CURRENT_PEN_KEY = 'codetab_current';

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getPens() {
  try { return JSON.parse(localStorage.getItem(PENS_KEY) || '{}'); } catch { return {}; }
}

export function setPens(p) {
  localStorage.setItem(PENS_KEY, JSON.stringify(p));
}

export function getCurrentId() {
  return localStorage.getItem(CURRENT_PEN_KEY);
}

export function setCurrentId(id) {
  localStorage.setItem(CURRENT_PEN_KEY, id);
}

export function createTab(name = 'Untitled', tpl = {}) {
  const id  = genId();
  const tab = {
    id, name,
    html: tpl.html || '', css: tpl.css || '', js: tpl.js || '',
    resources: { css: [], js: [] },
    settings:  { autoRun: true, autoSave: true },
    htmlMeta:  { classes: '', head: '', bodyClasses: '' },
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  const pens = getPens();
  pens[id] = tab;
  setPens(pens);
  return tab;
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
