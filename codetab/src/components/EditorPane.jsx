import { useRef, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { indentUnit } from '@codemirror/language';
import { IconSettings } from '@tabler/icons-react';
import { makeEmmetExtensions } from '../utils/emmet';

export default function EditorPane({
  label, value, onChange, lang, emmetType,
  onFormat, onCopy,
  onGearClick, gearActive,
  warning,
  theme, fontSize, wrap, indent, emmetEnabled,
}) {
  const emmetEnabledRef = useRef(emmetEnabled);
  emmetEnabledRef.current = emmetEnabled;

  const extensions = useMemo(() => {
    const exts = [
      lang,
      indentUnit.of(' '.repeat(indent)),
      EditorView.theme({ '.cm-content, .cm-gutters': { fontSize: `${fontSize}px` } }),
    ];
    if (wrap) exts.push(EditorView.lineWrapping);
    if (emmetType) exts.push(...makeEmmetExtensions(emmetType, emmetEnabledRef));
    return exts;
  }, [lang, indent, fontSize, wrap, emmetType]);

  return (
    <>
      <div className="pane-label">
        <span className="pane-label-left">{label}</span>
        <div className="pane-actions">
          <button className="pane-btn" onClick={onFormat}>Format</button>
          <button className="pane-btn" onClick={onCopy}>Copy</button>
          <button
            className={`pane-btn pane-btn-icon${gearActive ? ' active' : ''}`}
            onClick={onGearClick}
            title={emmetType === 'markup' ? 'HTML settings' : `${label} resources`}
          >
            <IconSettings size={13} />
          </button>
        </div>
      </div>
      {warning && (
        <div className="pane-warning">
          Only body content needed — &lt;html&gt;, &lt;head&gt; and &lt;body&gt; tags are added automatically.
        </div>
      )}
      <div className="editor-container">
        <CodeMirror
          value={value}
          onChange={onChange}
          theme={theme}
          extensions={extensions}
          height="100%"
          style={{ height: '100%' }}
        />
      </div>
    </>
  );
}
