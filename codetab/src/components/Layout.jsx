import { useEffect, useRef } from 'react';
import Split from 'split.js';

const SIZES_KEY = 'codetab_sizes';

function loadSizes(layout) {
  try { return JSON.parse(localStorage.getItem(SIZES_KEY) || '{}')[layout] || null; } catch { return null; }
}
function saveSizes(layout, main, editors) {
  try {
    const s = JSON.parse(localStorage.getItem(SIZES_KEY) || '{}');
    s[layout] = { main, editors };
    localStorage.setItem(SIZES_KEY, JSON.stringify(s));
  } catch {}
}

export default function Layout({ layout, pane1, pane2, pane3, preview, previewExpanded, onRefresh }) {
  const editorsRef = useRef(null);
  const previewRef = useRef(null);
  const pane1Ref   = useRef(null);
  const pane2Ref   = useRef(null);
  const pane3Ref   = useRef(null);
  const splitRef   = useRef([]);

  useEffect(() => {
    splitRef.current.forEach(s => s.destroy());
    splitRef.current = [];

    const editors = editorsRef.current;
    const previewEl = previewRef.current;
    const panes = [pane1Ref.current, pane2Ref.current, pane3Ref.current];
    if (!editors || !previewEl || panes.some(p => !p)) return;

    const isTop   = layout === 'top';
    const isRight = layout === 'right';
    const saved   = loadSizes(layout);
    const mainSizes   = saved?.main    || [50, 50];
    const editorSizes = saved?.editors || [33, 33, 34];

    const mainElements = isRight ? [previewEl, editors] : [editors, previewEl];
    const mainSplit = Split(mainElements, {
      direction: isTop ? 'vertical' : 'horizontal',
      sizes: mainSizes, minSize: 80, gutterSize: 5,
      onDrag: onRefresh,
      onDragEnd: (sizes) => saveSizes(layout, sizes, editorSplit.getSizes()),
    });

    const editorSplit = Split(panes, {
      direction: isTop ? 'horizontal' : 'vertical',
      sizes: editorSizes, minSize: 50, gutterSize: 5,
      onDrag: onRefresh,
      onDragEnd: (sizes) => saveSizes(layout, mainSplit.getSizes(), sizes),
    });

    splitRef.current = [mainSplit, editorSplit];
    setTimeout(onRefresh, 50);

    return () => {
      splitRef.current.forEach(s => s.destroy());
      splitRef.current = [];
    };
  }, [layout]);

  return (
    <main data-layout={layout}>
      <div className="editors" ref={editorsRef}>
        <div className="editor-pane" ref={pane1Ref}>{pane1}</div>
        <div className="editor-pane" ref={pane2Ref}>{pane2}</div>
        <div className="editor-pane" ref={pane3Ref}>{pane3}</div>
      </div>
      <div ref={previewRef} className={`preview-pane${previewExpanded ? ' preview-expanded' : ''}`}>
        {preview}
      </div>
    </main>
  );
}
