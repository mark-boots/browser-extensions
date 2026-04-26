import { useState, useEffect, useRef, useCallback } from 'react';
import { html } from '@codemirror/lang-html';
import { css  } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import JSZip from 'jszip';

import { getPens, setPens, getCurrentId, setCurrentId, createTab, genId } from './utils/storage';
import { buildDocument } from './utils/document';
import { getThemeExt } from './utils/themes';

import Header        from './components/Header';
import Layout        from './components/Layout';
import EditorPane    from './components/EditorPane';
import PreviewPane   from './components/PreviewPane';
import TabsModal     from './components/TabsModal';
import SettingsModal from './components/SettingsModal';
import HtmlMetaPopup from './components/HtmlMetaPopup';
import ResourcePopup from './components/ResourcePopup';

const HTML_DOC_RE = /<!DOCTYPE|<html[\s>]/i;

// ─── Prettier (lazy import to avoid slowing initial load) ────────────────────
async function formatCode(code, lang) {
  const { format }      = await import('prettier/standalone');
  const babelPlugin     = (await import('prettier/plugins/babel')).default;
  const estreePlugin    = (await import('prettier/plugins/estree')).default;
  const htmlPlugin      = (await import('prettier/plugins/html')).default;
  const cssPlugin       = (await import('prettier/plugins/postcss')).default;
  const parsers = { html: ['html', [htmlPlugin, estreePlugin]], css: ['css', [cssPlugin]], js: ['babel', [babelPlugin, estreePlugin]] };
  const [parser, plugins] = parsers[lang];
  return format(code, { parser, plugins });
}

export default function App() {
  // ─── Current tab content ────────────────────────────────────────────────────
  const [html_,    setHtml]    = useState('');
  const [css_,     setCss]     = useState('');
  const [js_,      setJs]      = useState('');
  const [tabName,  setTabName] = useState('Untitled');
  const [currentId, setCurrentTabId] = useState(null);

  // ─── Per-tab state ───────────────────────────────────────────────────────────
  const [autoRun,   setAutoRun]   = useState(true);
  const [autoSave,  setAutoSave]  = useState(true);
  const [resources, setResources] = useState({ css: [], js: [] });
  const [htmlMeta,  setHtmlMeta]  = useState({ classes: '', bodyClasses: '', head: '' });
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [htmlWarning, setHtmlWarning] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState([]);

  // ─── Global settings ─────────────────────────────────────────────────────────
  const [fontSize, setFontSizeState] = useState(() => parseInt(localStorage.getItem('codetab_fontsize') || '13'));
  const [themeId,  setThemeId]       = useState(() => localStorage.getItem('codetab_theme')  || 'one-dark');
  const [wrap,     setWrapState]     = useState(() => localStorage.getItem('codetab_wrap')   === 'true');
  const [indent,   setIndentState]   = useState(() => parseInt(localStorage.getItem('codetab_indent') || '2'));
  const [emmetEnabled, setEmmetState] = useState(() => localStorage.getItem('codetab_emmet') !== 'false');

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [layout,           setLayoutState]    = useState(() => localStorage.getItem('codetab_layout') || 'top');
  const [previewExpanded,  setPreviewExpanded] = useState(false);
  const [tabsModalOpen,    setTabsModalOpen]  = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [htmlMetaAnchor,   setHtmlMetaAnchor] = useState(null);
  const [resourcePopup,    setResourcePopup]  = useState(null); // { type, anchor }

  const iframeRef   = useRef(null);
  const debounceRef = useRef(null);
  const currentIdRef = useRef(null);

  // ─── Preview ─────────────────────────────────────────────────────────────────
  const updatePreview = useCallback((h = html_, c = css_, j = js_, r = resources, m = htmlMeta) => {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'preview-update',
      html: buildDocument(h, c, j, r, m),
    }, '*');
  }, [html_, css_, js_, resources, htmlMeta]);

  // ─── Console ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.source !== 'codetab-console') return;
      setConsoleEntries(prev => [...prev, { type: e.data.type, args: e.data.args }]);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // ─── Load tab ────────────────────────────────────────────────────────────────
  function loadTab(id) {
    const pens = getPens();
    const tab  = pens[id];
    if (!tab) return;
    currentIdRef.current = id;
    setCurrentTabId(id);
    setCurrentId(id);
    setHtml(tab.html || '');
    setCss(tab.css   || '');
    setJs(tab.js     || '');
    setTabName(tab.name || 'Untitled');
    document.title = (tab.name || 'Untitled') + ' — CodeTab';
    const s = tab.settings || {};
    setAutoRun(s.autoRun  !== false);
    setAutoSave(s.autoSave !== false);
    setResources(tab.resources || { css: [], js: [] });
    setHtmlMeta(tab.htmlMeta   || { classes: '', bodyClasses: '', head: '' });
    setHasUnsaved(false);
    setConsoleOpen(!!tab.consoleOpen);
    setHtmlWarning(HTML_DOC_RE.test(tab.html || ''));
    setConsoleEntries([]);
    setTimeout(() => updatePreview(tab.html || '', tab.css || '', tab.js || '', tab.resources || { css: [], js: [] }, tab.htmlMeta || {}), 0);
  }

  // ─── Boot ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let pens = getPens();
    let id   = getCurrentId();
    if (Object.keys(pens).length === 0) {
      const old = localStorage.getItem('codetab_session');
      const tab = createTab();
      if (old) {
        try {
          const { html: h, css: c, js: j } = JSON.parse(old);
          pens = getPens();
          pens[tab.id].html = h || ''; pens[tab.id].css = c || ''; pens[tab.id].js = j || '';
          setPens(pens);
          localStorage.removeItem('codetab_session');
        } catch {}
      }
      id = tab.id;
    } else if (!id || !pens[id]) {
      id = Object.keys(pens)[Object.keys(pens).length - 1];
    }
    loadTab(id);
  }, []);

  // ─── iframe load → re-send preview ──────────────────────────────────────────
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => updatePreview();
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [updatePreview]);

  // ─── Debounced auto-save / auto-run ─────────────────────────────────────────
  function onEditorChange(field, value) {
    const updaters = { html: setHtml, css: setCss, js: setJs };
    updaters[field](value);
    if (field === 'html') setHtmlWarning(HTML_DOC_RE.test(value));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const h = field === 'html' ? value : html_;
      const c = field === 'css'  ? value : css_;
      const j = field === 'js'   ? value : js_;
      if (autoRun)  updatePreview(h, c, j, resources, htmlMeta);
      if (autoSave) saveCurrentTab({ html: h, css: c, js: j });
      else setHasUnsaved(true);
    }, 300);
  }

  // ─── Save ────────────────────────────────────────────────────────────────────
  function saveCurrentTab(override = {}) {
    const id = currentIdRef.current;
    if (!id) return;
    const pens = getPens();
    if (!pens[id]) return;
    pens[id].html      = override.html ?? html_;
    pens[id].css       = override.css  ?? css_;
    pens[id].js        = override.js   ?? js_;
    pens[id].name      = tabName;
    pens[id].updatedAt = Date.now();
    setPens(pens);
  }

  function manualSave() {
    saveCurrentTab();
    setHasUnsaved(false);
  }

  // ─── Tab operations ───────────────────────────────────────────────────────────
  function openTab(id) {
    saveCurrentTab();
    loadTab(id);
    setTabsModalOpen(false);
  }

  function newTab() {
    saveCurrentTab();
    const tab = createTab();
    loadTab(tab.id);
    setTabsModalOpen(false);
  }

  function deleteTab(id) {
    const pens = getPens();
    if (!pens[id] || !confirm(`Delete "${pens[id].name}"? This cannot be undone.`)) return;
    delete pens[id];
    setPens(pens);
    if (currentIdRef.current === id) {
      const remaining = Object.keys(getPens());
      openTab(remaining.length > 0 ? remaining[remaining.length - 1] : createTab().id);
    }
  }

  function duplicateTab(id) {
    const pens = getPens();
    const tab  = pens[id];
    if (!tab) return;
    const newId = genId();
    const copy  = { ...tab, id: newId, name: tab.name + ' copy',
      resources: JSON.parse(JSON.stringify(tab.resources || { css: [], js: [] })),
      settings:  { ...tab.settings }, htmlMeta: { ...tab.htmlMeta },
      createdAt: Date.now(), updatedAt: Date.now() };
    pens[newId] = copy;
    setPens(pens);
  }

  async function exportTab(id) {
    const tab = getPens()[id];
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

  // ─── Tab name change ─────────────────────────────────────────────────────────
  function onTabNameChange(name) {
    setTabName(name);
    document.title = (name || 'Untitled') + ' — CodeTab';
    const id = currentIdRef.current;
    if (!id) return;
    const pens = getPens();
    if (!pens[id]) return;
    pens[id].name = name || 'Untitled';
    pens[id].updatedAt = Date.now();
    setPens(pens);
  }

  // ─── Per-tab settings ────────────────────────────────────────────────────────
  function saveTabSettings(updates) {
    const id = currentIdRef.current;
    if (!id) return;
    const pens = getPens();
    if (!pens[id]) return;
    pens[id].settings = { ...pens[id].settings, ...updates };
    setPens(pens);
  }

  function onAutoRunChange(val) {
    setAutoRun(val);
    saveTabSettings({ autoRun: val });
    if (val) updatePreview();
  }

  function onAutoSaveChange(val) {
    setAutoSave(val);
    saveTabSettings({ autoSave: val });
  }

  // ─── Resources / htmlMeta ────────────────────────────────────────────────────
  function onResourcesChange(r) {
    setResources(r);
    const id = currentIdRef.current;
    if (!id) return;
    const pens = getPens();
    if (!pens[id]) return;
    pens[id].resources = r;
    setPens(pens);
    updatePreview(html_, css_, js_, r, htmlMeta);
  }

  function onHtmlMetaChange(m) {
    setHtmlMeta(m);
    const id = currentIdRef.current;
    if (!id) return;
    const pens = getPens();
    if (!pens[id]) return;
    pens[id].htmlMeta = m;
    setPens(pens);
    updatePreview(html_, css_, js_, resources, m);
  }

  // ─── Console ─────────────────────────────────────────────────────────────────
  function toggleConsole() {
    const next = !consoleOpen;
    setConsoleOpen(next);
    const id = currentIdRef.current;
    if (!id) return;
    const pens = getPens();
    if (pens[id]) { pens[id].consoleOpen = next; setPens(pens); }
  }

  // ─── Global settings ─────────────────────────────────────────────────────────
  function setFontSize(v) { const s = Math.max(10, Math.min(24, v)); setFontSizeState(s); localStorage.setItem('codetab_fontsize', s); }
  function setTheme(id)   { setThemeId(id);   localStorage.setItem('codetab_theme', id); }
  function setWrap(v)     { setWrapState(v);  localStorage.setItem('codetab_wrap', v); }
  function setIndent(v)   { setIndentState(v); localStorage.setItem('codetab_indent', v); }
  function setEmmet(v)    { setEmmetState(v); localStorage.setItem('codetab_emmet', v); }

  function setLayout(l) {
    setLayoutState(l);
    localStorage.setItem('codetab_layout', l);
  }

  // ─── Format ──────────────────────────────────────────────────────────────────
  async function formatPane(lang, value, setter) {
    try { setter(await formatCode(value, lang)); } catch (e) { console.warn('Format error:', e); }
  }

  // ─── Copy ────────────────────────────────────────────────────────────────────
  function copyText(text) { navigator.clipboard.writeText(text).catch(() => {}); }

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setTabsModalOpen(false); setSettingsModalOpen(false); setHtmlMetaAnchor(null); setResourcePopup(null); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); manualSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); updatePreview(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [html_, css_, js_, resources, htmlMeta]);

  // ─── Theme extension ─────────────────────────────────────────────────────────
  const themeExt = getThemeExt(themeId);

  const editorProps = { theme: themeExt, fontSize, wrap, indent, emmetEnabled };

  const htmlGearActive = !!(htmlMeta.classes || htmlMeta.bodyClasses || htmlMeta.head);
  const cssGearActive  = (resources.css || []).length > 0;
  const jsGearActive   = (resources.js  || []).length > 0;

  return (
    <>
      <Header
        tabName={tabName}          onTabNameChange={onTabNameChange}
        hasUnsaved={hasUnsaved}    autoSave={autoSave}  autoRun={autoRun}
        onAutoSaveChange={onAutoSaveChange} onAutoRunChange={onAutoRunChange}
        onSave={manualSave}        onRun={updatePreview}
        layout={layout}            onLayoutChange={setLayout}
        consoleOpen={consoleOpen}  onConsoleToggle={toggleConsole}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenTabs={() => setTabsModalOpen(true)}
      />

      <Layout
        layout={layout}
        previewExpanded={previewExpanded}
        onRefresh={() => {}}
        pane1={
          <EditorPane label="HTML" value={html_} onChange={v => onEditorChange('html', v)}
            lang={html()} emmetType="markup"
            onFormat={() => formatPane('html', html_, setHtml)} onCopy={() => copyText(html_)}
            onGearClick={e => setHtmlMetaAnchor(htmlMetaAnchor ? null : e.currentTarget)}
            gearActive={htmlGearActive} warning={htmlWarning}
            {...editorProps}
          />
        }
        pane2={
          <EditorPane label="CSS" value={css_} onChange={v => onEditorChange('css', v)}
            lang={css()} emmetType="stylesheet"
            onFormat={() => formatPane('css', css_, setCss)} onCopy={() => copyText(css_)}
            onGearClick={e => setResourcePopup(resourcePopup?.type === 'css' ? null : { type: 'css', anchor: e.currentTarget })}
            gearActive={cssGearActive}
            {...editorProps}
          />
        }
        pane3={
          <EditorPane label="JS" value={js_} onChange={v => onEditorChange('js', v)}
            lang={javascript()}
            onFormat={() => formatPane('js', js_, setJs)} onCopy={() => copyText(js_)}
            onGearClick={e => setResourcePopup(resourcePopup?.type === 'js' ? null : { type: 'js', anchor: e.currentTarget })}
            gearActive={jsGearActive}
            {...editorProps}
          />
        }
        preview={
          <PreviewPane
            iframeRef={iframeRef}
            consoleOpen={consoleOpen}
            entries={consoleEntries}
            onClearConsole={() => setConsoleEntries([])}
            expanded={previewExpanded}
            onToggleExpand={() => setPreviewExpanded(v => !v)}
          />
        }
      />

      <TabsModal
        open={tabsModalOpen}
        tabs={getPens()}
        currentId={currentId}
        onOpen={openTab}
        onNew={newTab}
        onDuplicate={duplicateTab}
        onExport={exportTab}
        onDelete={deleteTab}
        onClose={() => setTabsModalOpen(false)}
      />

      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        fontSize={fontSize}    onFontSizeChange={setFontSize}
        wrap={wrap}            onWrapChange={setWrap}
        themeId={themeId}      onThemeChange={setTheme}
        indent={indent}        onIndentChange={setIndent}
        emmetEnabled={emmetEnabled} onEmmetChange={setEmmet}
      />

      {htmlMetaAnchor && (
        <HtmlMetaPopup
          anchor={htmlMetaAnchor}
          meta={htmlMeta}
          onChange={onHtmlMetaChange}
          onClose={() => setHtmlMetaAnchor(null)}
        />
      )}

      {resourcePopup && (
        <ResourcePopup
          anchor={resourcePopup.anchor}
          type={resourcePopup.type}
          resources={resources}
          onChange={onResourcesChange}
          onClose={() => setResourcePopup(null)}
        />
      )}
    </>
  );
}
