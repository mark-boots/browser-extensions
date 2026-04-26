import {
  IconLayoutNavbarFilled, IconLayoutSidebarFilled, IconLayoutSidebarRightFilled,
  IconTerminal2, IconSettings,
} from '@tabler/icons-react';

export default function Header({
  tabName, onTabNameChange,
  hasUnsaved, autoSave, autoRun,
  onAutoSaveChange, onAutoRunChange,
  onSave, onRun,
  layout, onLayoutChange,
  consoleOpen, onConsoleToggle,
  onOpenSettings, onOpenTabs,
}) {
  return (
    <header>
      <div className="header-left">
        <span className="logo" onClick={onOpenTabs} title="My CodeTabs">CodeTab</span>
        <span className="header-sep">/</span>
        <input
          className="tab-name-input"
          value={tabName}
          onChange={e => onTabNameChange(e.target.value)}
          spellCheck={false}
        />
        {hasUnsaved && !autoSave && <span className="unsaved-dot" title="Unsaved changes" />}
        {hasUnsaved && !autoSave && (
          <button className="btn-save" onClick={onSave} title="Save (Ctrl+S)">Save</button>
        )}
        {!autoRun && (
          <button className="btn-run" onClick={onRun} title="Run preview (Ctrl+Enter)">▶ Run</button>
        )}
        <div className="header-sep-thin" />
        <label className="header-toggle">
          <input type="checkbox" checked={autoSave} onChange={e => onAutoSaveChange(e.target.checked)} /> Auto-save
        </label>
        <label className="header-toggle">
          <input type="checkbox" checked={autoRun} onChange={e => onAutoRunChange(e.target.checked)} /> Auto-run
        </label>
      </div>

      <div className="actions">
        <div className="layout-switcher">
          <button
            className={`layout-btn${layout === 'top' ? ' active' : ''}`}
            onClick={() => onLayoutChange('top')}
            title="Editors on top"
          >
            <IconLayoutNavbarFilled size={16} />
          </button>
          <button
            className={`layout-btn${layout === 'left' ? ' active' : ''}`}
            onClick={() => onLayoutChange('left')}
            title="Editors on left"
          >
            <IconLayoutSidebarFilled size={16} />
          </button>
          <button
            className={`layout-btn${layout === 'right' ? ' active' : ''}`}
            onClick={() => onLayoutChange('right')}
            title="Editors on right"
          >
            <IconLayoutSidebarRightFilled size={16} />
          </button>
          <button
            className={`layout-btn${consoleOpen ? ' active' : ''}`}
            onClick={onConsoleToggle}
            title="Toggle console"
          >
            <IconTerminal2 size={16} />
          </button>
        </div>
        <div className="divider" />
        <button onClick={onOpenSettings} title="Editor settings">
          <IconSettings size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Settings
        </button>
      </div>
    </header>
  );
}
