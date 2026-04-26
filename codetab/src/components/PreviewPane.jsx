import { useRef, useState } from 'react';
import { IconMaximize, IconMinimize } from '@tabler/icons-react';

const CONSOLE_H_KEY = 'codetab_console_h';

export default function PreviewPane({ iframeRef, consoleOpen, entries, onClearConsole, expanded, onToggleExpand }) {
  const [consoleH, setConsoleH] = useState(() => parseInt(localStorage.getItem(CONSOLE_H_KEY) || '180'));
  const resizeRef = useRef(null);

  function onResizeStart(e) {
    e.preventDefault();
    const startY = e.clientY;
    const startH = consoleH;
    resizeRef.current?.classList.add('dragging');

    function onMove(e) {
      const newH = Math.min(Math.max(startH + (startY - e.clientY), 80), window.innerHeight * 0.7);
      setConsoleH(newH);
    }
    function onUp() {
      resizeRef.current?.classList.remove('dragging');
      localStorage.setItem(CONSOLE_H_KEY, consoleH);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <>
      <div className="pane-label">
        <span className="pane-label-left">Preview</span>
        <button className={`layout-btn${expanded ? ' active' : ''}`} onClick={onToggleExpand} title={expanded ? 'Collapse preview' : 'Expand preview'}>
          {expanded ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
        </button>
      </div>
      <iframe id="preview" ref={iframeRef} src="preview.html" title="Preview" />
      {consoleOpen && (
        <div className="console-panel" style={{ height: consoleH }}>
          <div className="console-resize-handle" ref={resizeRef} onMouseDown={onResizeStart} />
          <div className="console-toolbar">
            <span className="console-title">Console</span>
            <button className="console-btn" onClick={onClearConsole}>Clear</button>
          </div>
          <div className="console-entries">
            {entries.map((entry, i) => (
              <div key={i} className={`console-entry console-entry--${entry.type}`}>
                <span className="console-badge">{entry.type}</span>
                <span>{entry.args.join(' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
