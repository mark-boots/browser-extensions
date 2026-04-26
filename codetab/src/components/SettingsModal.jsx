import { IconX } from '@tabler/icons-react';
import { THEMES } from '../utils/themes';

export default function SettingsModal({
  open, onClose,
  fontSize, onFontSizeChange,
  wrap, onWrapChange,
  themeId, onThemeChange,
  indent, onIndentChange,
  emmetEnabled, onEmmetChange,
}) {
  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content modal-content--settings">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}><IconX size={16} /></button>
        </div>
        <div className="settings-columns">
          <div className="settings-col">
            <div className="settings-row">
              <span>Font size</span>
              <div className="font-size-control">
                <button onClick={() => onFontSizeChange(fontSize - 1)}>−</button>
                <span id="font-size-val">{fontSize}</span>
                <button onClick={() => onFontSizeChange(fontSize + 1)}>+</button>
              </div>
            </div>
            <div className="settings-row">
              <span>Wrap lines</span>
              <input type="checkbox" className="settings-toggle" checked={wrap} onChange={e => onWrapChange(e.target.checked)} />
            </div>
            <div className="settings-row">
              <span>Theme</span>
              <select className="settings-select" value={themeId} onChange={e => onThemeChange(e.target.value)}>
                {THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="settings-row">
              <span>Indent size</span>
              <select className="settings-select" value={indent} onChange={e => onIndentChange(Number(e.target.value))}>
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>
            <div className="settings-row">
              <span>Emmet</span>
              <input type="checkbox" className="settings-toggle" checked={emmetEnabled} onChange={e => onEmmetChange(e.target.checked)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
