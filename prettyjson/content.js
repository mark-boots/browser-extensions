(async function () {
  'use strict';

  // ── Detection ────────────────────────────────────────────────────────────────
  function getRawText() {
    const ct = document.contentType;
    if (ct === 'application/json') return document.body?.innerText ?? null;
    // Some local dev servers send JSON as text/plain
    if (ct === 'text/plain') {
      const t = (document.body?.innerText ?? '').trim();
      if (t[0] === '{' || t[0] === '[') return t;
    }
    return null;
  }

  const rawText = getRawText();
  if (!rawText) return;

  let data;
  try { data = JSON.parse(rawText); } catch { return; }

  // Derive config from manifest — single source of truth.
  const PJ_NAME   = chrome.runtime.getManifest().name;
  const PJ_OBJECT = '__' + PJ_NAME.toLowerCase().replace(/\s+/g, '');

  // Bridge to expose.js (MAIN world) via sessionStorage.
  sessionStorage.setItem('__pj_raw',    rawText);
  sessionStorage.setItem('__pj_name',   PJ_NAME);
  sessionStorage.setItem('__pj_object', PJ_OBJECT);

  // ── Options (chrome.storage.local — extension-scoped, cross-domain) ─────────────
  function setOpt(key, val) { chrome.storage.local.set({ ['pj:' + key]: val }); }

  // ── DOM helpers ───────────────────────────────────────────────────────────────
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function typeOf(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v; // object | string | number | boolean
  }

  // ── Tree builder ──────────────────────────────────────────────────────────────
  function buildNode(value, key, isLast, depth) {
    const type = typeOf(value);
    return (type === 'object' || type === 'array')
      ? buildCollapsible(value, key, type, isLast, depth)
      : buildLeaf(value, key, type, isLast);
  }

  function buildLeaf(value, key, type, isLast) {
    const row = el('div', 'pj-row');
    if (key !== null) {
      row.appendChild(el('span', 'pj-key', `"${key}"`));
      row.appendChild(el('span', 'pj-punct', ': '));
    }
    const display = type === 'string' ? `"${value}"` : String(value);
    row.appendChild(el('span', 'pj-' + type, display));
    if (!isLast) row.appendChild(el('span', 'pj-comma', ','));
    return row;
  }

  function buildCollapsible(value, key, type, isLast, depth) {
    const isArr = type === 'array';
    const count = isArr ? value.length : Object.keys(value).length;
    const [openBrace, closeBrace] = isArr ? ['[', ']'] : ['{', '}'];
    const isEmpty = count === 0;
    const previewText = isArr
      ? `${count} item${count !== 1 ? 's' : ''}`
      : `${count} key${count !== 1 ? 's' : ''}`;
    const bracketColor = `var(--bracket-${depth % 3})`;

    const node = el('div', 'pj-collapsible pj-open');
    node.dataset.depth = depth;

    // ── Header ─────────────────────────────────────────────────────────────────
    const header = el('div', 'pj-header');

    const arrow = el('span', isEmpty ? 'pj-arrow-placeholder' : 'pj-arrow');
    header.appendChild(arrow);

    if (key !== null) {
      header.appendChild(el('span', 'pj-key', `"${key}"`));
      header.appendChild(el('span', 'pj-punct', ': '));
    }

    const openEl = el('span', 'pj-brace', openBrace);
    openEl.style.color = bracketColor;
    header.appendChild(openEl);

    if (!isEmpty) {
      // Inline group — visible when collapsed, hidden when expanded
      const inline = el('span', 'pj-inline');
      inline.appendChild(el('span', 'pj-preview', previewText));
      const inlineClose = el('span', 'pj-brace', closeBrace);
      inlineClose.style.color = bracketColor;
      inline.appendChild(inlineClose);
      if (!isLast) inline.appendChild(el('span', 'pj-comma', ','));
      header.appendChild(inline);
    } else {
      const emptyClose = el('span', 'pj-brace', closeBrace);
      emptyClose.style.color = bracketColor;
      header.appendChild(emptyClose);
      if (!isLast) header.appendChild(el('span', 'pj-comma', ','));
    }

    node.appendChild(header);

    if (!isEmpty) {
      // ── Children ──────────────────────────────────────────────────────────────
      const children = el('div', 'pj-children');
      if (isArr) {
        value.forEach((item, i) =>
          children.appendChild(buildNode(item, null, i === value.length - 1, depth + 1))
        );
      } else {
        const keys = Object.keys(value);
        keys.forEach((k, i) =>
          children.appendChild(buildNode(value[k], k, i === keys.length - 1, depth + 1))
        );
      }
      node.appendChild(children);

      // ── Footer ────────────────────────────────────────────────────────────────
      const footer = el('div', 'pj-footer');
      const footerClose = el('span', 'pj-brace', closeBrace);
      footerClose.style.color = bracketColor;
      footer.appendChild(footerClose);
      if (!isLast) footer.appendChild(el('span', 'pj-comma', ','));
      node.appendChild(footer);

      function toggle() {
        const nowOpen = node.classList.toggle('pj-open');
        node.classList.toggle('pj-closed', !nowOpen);
        refreshGutter();
      }
      // Toggle on header click everywhere except the key text (keep that selectable)
      header.addEventListener('click', e => {
        if (!e.target.closest('.pj-key')) toggle();
      });
    }

    return node;
  }

  // ── Gutter ────────────────────────────────────────────────────────────────────
  let gutterEl;

  function countVisibleLines(container) {
    let n = 0;
    for (const child of container.children) {
      if (child.classList.contains('pj-row')) {
        n++;
      } else if (child.classList.contains('pj-collapsible')) {
        n++; // header
        if (child.classList.contains('pj-open')) {
          const childrenEl = child.querySelector(':scope > .pj-children');
          if (childrenEl) n += countVisibleLines(childrenEl);
          n++; // footer
        }
      }
    }
    return n;
  }

  function refreshGutter() {
    if (!gutterEl) return;
    const total = countVisibleLines(treeEl);
    let html = '';
    for (let i = 1; i <= total; i++) html += `<span class="pj-lineno">${i}</span>`;
    gutterEl.innerHTML = html;
  }

  // ── Expand / collapse helpers ─────────────────────────────────────────────────
  function setAll(open) {
    document.querySelectorAll('#pj-tree .pj-collapsible').forEach(n => {
      n.classList.toggle('pj-open', open);
      n.classList.toggle('pj-closed', !open);
    });
    refreshGutter();
  }

  function expandToDepth(max) {
    document.querySelectorAll('#pj-tree .pj-collapsible').forEach(n => {
      const open = parseInt(n.dataset.depth, 10) < max;
      n.classList.toggle('pj-open', open);
      n.classList.toggle('pj-closed', !open);
    });
    refreshGutter();
  }

  // ── Toolbar ───────────────────────────────────────────────────────────────────
  let currentIndent = 2;
  let isRaw = false;

  function buildToolbar() {
    const bar = document.createElement('div');
    bar.id = 'pj-toolbar';
    bar.classList.add('pj-mode-pretty');
    bar.innerHTML = `
      <div class="pj-tb-left">
        <span class="pj-brand">{ } ${PJ_NAME}</span>
        <div class="pj-tb-sep"></div>
        <div class="pj-tb-group">
          <button data-action="pretty" class="pj-active">Pretty</button>
          <button data-action="raw">Raw</button>
        </div>
        <div class="pj-tb-sep pj-pretty-only"></div>
        <div class="pj-tb-group pj-pretty-only">
          <button data-action="collapse">Collapse all</button>
          <button data-action="expand">Expand all</button>
          <button data-action="l1">1 level</button>
          <button data-action="l2">2 levels</button>
        </div>
        <div class="pj-tb-sep pj-pretty-only"></div>
        <div class="pj-tb-group pj-pretty-only">
          <button data-action="lines" class="${showLines ? 'pj-active' : ''}">Lines</button>
        </div>
      </div>
      <div class="pj-tb-right">
        <div class="pj-tb-group">
          <span class="pj-tb-label">Indent</span>
          <button data-action="i2" class="${currentIndent === 2 ? 'pj-active' : ''}">2</button>
          <button data-action="i4" class="${currentIndent === 4 ? 'pj-active' : ''}">4</button>
        </div>
        <div class="pj-tb-sep"></div>
        <div class="pj-tb-group">
          <button data-action="copy">Copy</button>
        </div>
      </div>
    `;
    return bar;
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  const stored = await chrome.storage.local.get({ 'pj:indent': 2, 'pj:lines': true });
  currentIndent = stored['pj:indent'];
  let showLines = stored['pj:lines'];

  document.title = PJ_NAME;
  document.body.id = 'pj-body';
  document.body.innerHTML = '';

  const toolbar = buildToolbar();

  const treeEl = document.createElement('div');
  treeEl.id = 'pj-tree';
  treeEl.style.setProperty('--pj-indent', currentIndent === 2 ? '1.4em' : '2.8em');
  treeEl.appendChild(buildNode(data, null, true, 0));

  gutterEl = document.createElement('div');
  gutterEl.id = 'pj-gutter';

  const wrapEl = document.createElement('div');
  wrapEl.id = 'pj-wrap';
  wrapEl.appendChild(gutterEl);
  wrapEl.appendChild(treeEl);

  const rawEl = document.createElement('pre');
  rawEl.id = 'pj-raw';

  document.body.appendChild(toolbar);
  document.body.appendChild(wrapEl);
  document.body.appendChild(rawEl);

  function applyLines() {
    gutterEl.style.display = showLines ? '' : 'none';
    toolbar.querySelector('[data-action="lines"]').classList.toggle('pj-active', showLines);
  }

  // Measure actual row height from the DOM and set it as a CSS variable so
  // gutter line numbers stay pixel-aligned regardless of font size.
  const sampleRow = treeEl.querySelector('.pj-row, .pj-header');
  if (sampleRow) {
    gutterEl.style.setProperty('--pj-row-height', sampleRow.getBoundingClientRect().height + 'px');
  }

  refreshGutter();
  applyLines();

  // ── Toolbar event delegation ──────────────────────────────────────────────────
  toolbar.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'collapse') {
      setAll(false);
    } else if (action === 'l1') {
      expandToDepth(1);
    } else if (action === 'l2') {
      expandToDepth(2);
    } else if (action === 'expand') {
      setAll(true);
    } else if (action === 'lines') {
      showLines = !showLines;
      setOpt('lines', showLines);
      applyLines();
    } else if (action === 'raw' || action === 'pretty') {
      isRaw = action === 'raw';
      toolbar.classList.toggle('pj-mode-raw', isRaw);
      toolbar.classList.toggle('pj-mode-pretty', !isRaw);
      toolbar.querySelector('[data-action="pretty"]').classList.toggle('pj-active', !isRaw);
      toolbar.querySelector('[data-action="raw"]').classList.toggle('pj-active', isRaw);
      wrapEl.style.display = isRaw ? 'none' : '';
      rawEl.style.display = isRaw ? 'block' : 'none';
      if (isRaw) rawEl.textContent = JSON.stringify(data, null, currentIndent);
    } else if (action === 'copy') {
      navigator.clipboard.writeText(rawText).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = 'Copy'), 1500);
      });
    } else if (action === 'i2' || action === 'i4') {
      currentIndent = action === 'i2' ? 2 : 4;
      setOpt('indent', currentIndent);
      toolbar.querySelectorAll('[data-action="i2"],[data-action="i4"]').forEach(b =>
        b.classList.toggle('pj-active', b.dataset.action === action)
      );
      treeEl.style.setProperty('--pj-indent', currentIndent === 2 ? '1.4em' : '2.8em');
      if (isRaw) rawEl.textContent = JSON.stringify(data, null, currentIndent);
    }
  });
})();
