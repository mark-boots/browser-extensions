import { useRef, useEffect } from 'react';
import StreamSlot from './StreamSlot.jsx';
import { ChevronUp, ChevronDown, SwapV } from './Icons.jsx';
import { usePref } from '../hooks/usePref.js';

const BAR_HEIGHT_DEFAULT = 140;
const BAR_MIN     = 80;
const BAR_MAX_PCT = 0.4;
const SLOT_GAP    = 4;
const PIP_MARGIN  = 12;
const PIP_W       = 360;
const PIP_H       = Math.round(PIP_W * 9 / 16);
const MIN_PIP_W   = 240;
const PIP_ASPECT  = 9 / 16;

export default function StreamArea({ streams, onAction, viewId }) {
  const [pipCorner,   setPipCorner]   = usePref(viewId, 'pipCorner',   'top-right');
  const [pipSize,     setPipSize]     = usePref(viewId, 'pipSize',     { w: PIP_W, h: PIP_H });
  const [barHeight,   setBarHeight]   = usePref(viewId, 'barHeight',   BAR_HEIGHT_DEFAULT);
  const [barVisible,  setBarVisible]  = usePref(viewId, 'barVisible',  true);
  const [barPosition, setBarPosition] = usePref(viewId, 'barPosition', 'bottom');
  const [smallOrder,  setSmallOrder]  = usePref(viewId, 'smallOrder',  []);
  const areaRef = useRef(null);

  const effectiveBarHeight = barVisible ? barHeight : 0;
  const barIsTop = barPosition === 'top';

  function maxBarHeightFor(n, areaWidth) {
    if (n === 0) return BAR_MAX_PCT * (areaRef.current?.getBoundingClientRect().height ?? 9999);
    return SLOT_GAP + (areaWidth - (n + 1) * SLOT_GAP) * 9 / (16 * n);
  }

  const slotWidth   = Math.round((barHeight - SLOT_GAP) * 16 / 9);
  const rawSmall    = streams.filter(s => s.role === 'small');
  useEffect(() => {
    const areaRect = areaRef.current?.getBoundingClientRect();
    if (!areaRect) return;
    const max = maxBarHeightFor(rawSmall.length, areaRect.width);
    setBarHeight(h => h > max ? max : h);
  }, [rawSmall.length]);

  const orderedSmall = [
    ...smallOrder.map(id => rawSmall.find(s => s.id === id)).filter(Boolean),
    ...rawSmall.filter(s => !smallOrder.includes(s.id)).sort((a, b) => a.addedAt - b.addedAt),
  ];

  function availableActions(role) {
    if (role === 'main') return ['pip', 'eject', 'chat', 'remove'];
    if (role === 'pip')  return ['pip-corner', 'main', 'eject', 'chat', 'remove'];
    return ['drag', 'main', 'pip', 'chat', 'remove'];
  }

  function handleSmallDragMouseDown(e, dragId) {
    if (e.button !== 0) return;
    if (e.target.closest('select, button')) return;
    e.preventDefault();
    e.stopPropagation();

    const shield = document.createElement('div');
    shield.style.cssText = 'position:fixed;inset:0;z-index:9998;cursor:grabbing;';
    document.body.appendChild(shield);

    const originalOrder = orderedSmall.map(s => s.id);
    const startIdx  = originalOrder.indexOf(dragId);
    const slotStride = slotWidth + SLOT_GAP;
    const startX    = e.clientX;
    let lastNewIdx  = startIdx;

    function onMove(e) {
      const offset = Math.round((e.clientX - startX) / slotStride);
      const newIdx = Math.max(0, Math.min(originalOrder.length - 1, startIdx + offset));
      if (newIdx === lastNewIdx) return;
      lastNewIdx = newIdx;
      const newOrder = [...originalOrder];
      newOrder.splice(startIdx, 1);
      newOrder.splice(newIdx, 0, dragId);
      setSmallOrder(newOrder);
    }

    function onUp() {
      shield.remove();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const RESIZE_CURSORS = {
    'top-right': 'nesw-resize', 'top-left': 'nwse-resize',
    'bottom-right': 'nwse-resize', 'bottom-left': 'nesw-resize',
  };
  const RESIZE_GRADIENTS = {
    'top-right':    'linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.3) 50%)',
    'top-left':     'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.3) 50%)',
    'bottom-right': 'linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.3) 50%)',
    'bottom-left':  'linear-gradient(45deg,  transparent 50%, rgba(255,255,255,0.3) 50%)',
  };
  const RESIZE_POS = {
    'top-right':    { bottom: 0, left:  0 },
    'top-left':     { bottom: 0, right: 0 },
    'bottom-right': { top:    0, left:  0 },
    'bottom-left':  { top:    0, right: 0 },
  };

  function handlePipDragMouseDown(e) {
    if (e.button !== 0) return;
    // Don't drag when clicking interactive controls
    if (e.target.closest('select, button')) return;
    e.preventDefault();
    e.stopPropagation();

    const pipEl = areaRef.current.querySelector('[data-role="pip"]');
    if (!pipEl) return;

    const areaRect = areaRef.current.getBoundingClientRect();
    const pipRect  = pipEl.getBoundingClientRect();
    const startX   = pipRect.left - areaRect.left;
    const startY   = pipRect.top  - areaRect.top;
    const startMX  = e.clientX;
    const startMY  = e.clientY;

    const shield = document.createElement('div');
    shield.style.cssText = 'position:fixed;inset:0;z-index:9998;cursor:grabbing;';
    document.body.appendChild(shield);

    pipEl.style.transition = 'none';

    const mainTop    = barIsTop ? effectiveBarHeight : 0;
    const mainBottom = barIsTop ? areaRect.height : areaRect.height - effectiveBarHeight;
    const mainHeight = mainBottom - mainTop;

    function onMove(e) {
      const x = Math.max(0, Math.min(areaRect.width - pipSize.w, startX + (e.clientX - startMX)));
      const y = Math.max(mainTop, Math.min(mainBottom - pipSize.h, startY + (e.clientY - startMY)));
      pipEl.style.left   = x + 'px';
      pipEl.style.top    = y + 'px';
      pipEl.style.right  = 'auto';
      pipEl.style.bottom = 'auto';
    }

    function onUp(e) {
      shield.remove();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      const finalX = startX + (e.clientX - startMX);
      const finalY = startY + (e.clientY - startMY);
      const h = (finalX + pipSize.w / 2) < areaRect.width / 2 ? 'left' : 'right';
      const v = (finalY + pipSize.h / 2) < mainTop + mainHeight / 2 ? 'top' : 'bottom';

      pipEl.style.left = pipEl.style.top = pipEl.style.right = pipEl.style.bottom = '';
      pipEl.style.transition = '';
      setPipCorner(`${v}-${h}`);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleResizeMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const shield = document.createElement('div');
    shield.style.cssText = `position:fixed;inset:0;z-index:9998;cursor:${RESIZE_CURSORS[pipCorner]};`;
    document.body.appendChild(shield);
    const origW  = pipSize.w;
    const startX = e.clientX;
    const dxMult = (pipCorner === 'top-right' || pipCorner === 'bottom-right') ? -1 : 1;
    function onMove(e) {
      const w = Math.max(MIN_PIP_W, origW + dxMult * (e.clientX - startX));
      setPipSize({ w, h: Math.round(w * PIP_ASPECT) });
    }
    function onUp() {
      shield.remove();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleDividerMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    const shield = document.createElement('div');
    shield.style.cssText = 'position:fixed;inset:0;z-index:9998;cursor:ns-resize;';
    document.body.appendChild(shield);
    const areaRect = areaRef.current.getBoundingClientRect();
    const maxH = Math.min(areaRect.height * BAR_MAX_PCT, maxBarHeightFor(rawSmall.length, areaRect.width));
    function onMove(e) {
      const newHeight = barIsTop
        ? Math.max(BAR_MIN, Math.min(maxH, e.clientY - areaRect.top))
        : Math.max(BAR_MIN, Math.min(maxH, areaRect.bottom - e.clientY));
      setBarHeight(newHeight);
    }
    function onUp() {
      shield.remove();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const areaVars = {
    '--bar-height':  `${effectiveBarHeight}px`,
    '--slot-width':  `${slotWidth}px`,
    '--slot-gap':    `${SLOT_GAP}px`,
    '--pip-w':       `${pipSize.w}px`,
    '--pip-h':       `${pipSize.h}px`,
    '--pip-margin':  `${PIP_MARGIN}px`,
    '--pip-top':     `${(barIsTop ? effectiveBarHeight : 0) + PIP_MARGIN}px`,
    '--pip-bottom':  `${(barIsTop ? 0 : effectiveBarHeight) + PIP_MARGIN}px`,
  };

  const dividerPos  = barIsTop ? { top: barHeight }    : { bottom: barHeight };
  const togglePos   = barIsTop
    ? { top: barVisible ? effectiveBarHeight - 16 : 0 }
    : { bottom: barVisible ? effectiveBarHeight - 16 : 0 };
  const ToggleIcon = barIsTop
    ? (barVisible ? ChevronUp   : ChevronDown)
    : (barVisible ? ChevronDown : ChevronUp);

  return (
    <div className="stream-area" ref={areaRef} style={areaVars} data-bar-position={barPosition}>
      {streams.length === 0 && (
        <div className="stream-area-empty">Add a stream to get started</div>
      )}

      {barVisible && (
        <div
          className="stream-bar-divider"
          style={dividerPos}
          onMouseDown={handleDividerMouseDown}
        />
      )}

      <div className="bar-controls" style={togglePos} data-bar-open={barVisible ? 'true' : 'false'}>
        <button className="bar-toggle" onClick={() => setBarVisible(v => !v)}><ToggleIcon size={10} /></button>
        <button className="bar-swap"   onClick={() => setBarPosition(p => p === 'bottom' ? 'top' : 'bottom')}><SwapV size={10} /></button>
      </div>

      {streams.map(stream => {
        const smallIdx = stream.role === 'small'
          ? orderedSmall.findIndex(s => s.id === stream.id)
          : undefined;
        return (
          <div
            key={stream.id}
            className="stream-slot-wrap"
            data-role={stream.role}
            data-pip-corner={stream.role === 'pip' ? pipCorner : undefined}
            style={smallIdx !== undefined ? { '--small-index': smallIdx } : undefined}
            onMouseDown={
              stream.role === 'pip'   ? handlePipDragMouseDown :
              stream.role === 'small' ? (e) => handleSmallDragMouseDown(e, stream.id) :
              undefined
            }
          >
            <StreamSlot
              stream={stream}
              availableActions={availableActions(stream.role)}
              onAction={(action) => onAction(stream.id, action)}
            />
            {stream.role === 'pip' && (
              <div
                className="pip-resize-handle"
                style={{ ...RESIZE_POS[pipCorner], cursor: RESIZE_CURSORS[pipCorner], background: RESIZE_GRADIENTS[pipCorner] }}
                onMouseDown={handleResizeMouseDown}
              />
            )}
          </div>
        );
      })}

    </div>
  );
}
