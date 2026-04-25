import ChatTabs from './ChatTabs.jsx';
import ChatPane from './ChatPane.jsx';
import AddSlot from './AddSlot.jsx';
import { SwapH } from './Icons.jsx';
import { usePref } from '../hooks/usePref.js';

export default function Sidebar({ streams, activeTabId, onTabClick, onResizeStart, visible, sidebarSide, onSwapSide, onAdd, viewId }) {
  const [smallOrder] = usePref(viewId, 'smallOrder', []);

  const main     = streams.find(s => s.role === 'main');
  const pip      = streams.find(s => s.role === 'pip');
  const rawSmall = streams.filter(s => s.role === 'small');
  const orderedSmall = [
    ...smallOrder.map(id => rawSmall.find(s => s.id === id)).filter(Boolean),
    ...rawSmall.filter(s => !smallOrder.includes(s.id)).sort((a, b) => a.addedAt - b.addedAt),
  ];
  const tabOrder = [
    ...(main ? [main] : []),
    ...(pip  ? [pip]  : []),
    ...orderedSmall,
  ];

  const isLeft = sidebarSide === 'left';

  return (
    <div className={`sidebar${isLeft ? ' sidebar--left' : ''}`} style={{ overflow: visible ? '' : 'hidden' }}>
      {visible && <div className="sidebar-resize-handle" onMouseDown={onResizeStart} />}
      <div className="sidebar-toolbar">
        <button className="sidebar-swap-btn" onClick={onSwapSide} title="Move chat to other side"><SwapH size={13} /></button>
        <AddSlot onAdd={onAdd} />
      </div>
      {streams.length > 0 && (
        <>
          <ChatTabs
            tabOrder={tabOrder}
            activeTabId={activeTabId}
            onTabClick={onTabClick}
          />
          <div className="sidebar-content">
            {streams.map(stream => (
              <ChatPane
                key={stream.id}
                stream={stream}
                visible={stream.id === activeTabId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
