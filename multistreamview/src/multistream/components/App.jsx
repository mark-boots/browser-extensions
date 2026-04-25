import { useEffect } from 'react';
import { useStreams } from '../hooks/useStreams.js';
import { usePref } from '../hooks/usePref.js';
import StreamArea from './StreamArea.jsx';
import Sidebar from './Sidebar.jsx';
import { ChevronLeft, ChevronRight } from './Icons.jsx';

const SIDEBAR_DEFAULT = 280;
const SIDEBAR_MIN     = 180;
const SIDEBAR_MAX     = 520;

const viewId = new URLSearchParams(window.location.search).get('view') || 'default';

function applyTitle(views) {
  const view = views?.find(v => v.id === viewId);
  document.title = view ? `MSV - ${view.name}` : 'MultiStreamView';
}

chrome.storage.local.get('msv_views', r => applyTitle(r.msv_views));
chrome.storage.onChanged.addListener(changes => {
  if (changes.msv_views) applyTitle(changes.msv_views.newValue);
});

export default function App() {
  const { streams, addStream, removeStream, promoteToMain, promoteToPip, demoteToSmall, ejectToSmall } = useStreams(viewId);
  const [sidebarWidth,   setSidebarWidth]   = usePref(viewId, 'sidebarWidth',   SIDEBAR_DEFAULT);
  const [sidebarVisible, setSidebarVisible] = usePref(viewId, 'sidebarVisible', true);
  const [sidebarSide,    setSidebarSide]    = usePref(viewId, 'sidebarSide',    'right');
  const [activeChatId,   setActiveChatId]   = usePref(viewId, 'activeChatId',   null);

  useEffect(() => {
    if (activeChatId && !streams.find(s => s.id === activeChatId)) {
      setActiveChatId(streams[0]?.id ?? null);
    }
    if (!activeChatId && streams.length > 0) {
      setActiveChatId(streams[0].id);
    }
  }, [streams, activeChatId]);

  function handleAction(id, action) {
    if (action === 'main')   promoteToMain(id);
    if (action === 'pip')    promoteToPip(id);
    if (action === 'small')  demoteToSmall(id);
    if (action === 'remove') removeStream(id);
    if (action === 'eject')  ejectToSmall(id);
    if (action === 'chat')   { setActiveChatId(id); setSidebarVisible(true); }
  }

  function handleSidebarResizeMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    const shield = document.createElement('div');
    shield.style.cssText = 'position:fixed;inset:0;z-index:9998;cursor:ew-resize;';
    document.body.appendChild(shield);
    const startX     = e.clientX;
    const startWidth = sidebarWidth;
    function onMove(e) {
      const delta = sidebarSide === 'right' ? startX - e.clientX : e.clientX - startX;
      setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startWidth + delta)));
    }
    function onUp() {
      shield.remove();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const isLeft = sidebarSide === 'left';
  const cols   = isLeft
    ? `${sidebarVisible ? sidebarWidth : 0}px 1fr`
    : `1fr ${sidebarVisible ? sidebarWidth : 0}px`;
  const areas  = isLeft ? '"sidebar streams"' : '"streams sidebar"';

  const ToggleIcon = isLeft
    ? (sidebarVisible ? ChevronLeft  : ChevronRight)
    : (sidebarVisible ? ChevronRight : ChevronLeft);

  return (
    <div className="app-layout" style={{ gridTemplateColumns: cols, gridTemplateAreas: areas, position: 'relative' }}>
      <StreamArea streams={streams} onAction={handleAction} viewId={viewId} />
      <button
        className="sidebar-toggle"
        style={isLeft ? { left: 0, borderRadius: '0 4px 4px 0', borderLeft: 'none', borderRight: '1px solid #2a2a2e' } : {}}
        onClick={() => setSidebarVisible(v => !v)}
      >
        <ToggleIcon size={12} />
      </button>
      <Sidebar
        streams={streams}
        activeTabId={activeChatId}
        onTabClick={setActiveChatId}
        onResizeStart={handleSidebarResizeMouseDown}
        visible={sidebarVisible}
        sidebarSide={sidebarSide}
        onSwapSide={() => setSidebarSide(s => s === 'right' ? 'left' : 'right')}
        onAdd={addStream}
        viewId={viewId}
      />
    </div>
  );
}
