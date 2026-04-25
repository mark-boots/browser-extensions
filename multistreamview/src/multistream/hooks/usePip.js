import { useState, useCallback, useRef } from 'react';

const MARGIN = 12;
const MIN_WIDTH = 240;
const ASPECT = 9 / 16;

function cornerStyle(corner, width, height) {
  const base = {
    position: 'absolute',
    width,
    height,
    zIndex: 100,
    transition: 'top 0.2s ease, left 0.2s ease, right 0.2s ease, bottom 0.2s ease',
  };
  switch (corner) {
    case 'top-right':    return { ...base, top: MARGIN,    right:  MARGIN, bottom: 'auto', left:  'auto' };
    case 'top-left':     return { ...base, top: MARGIN,    left:   MARGIN, bottom: 'auto', right: 'auto' };
    case 'bottom-right': return { ...base, bottom: MARGIN, right:  MARGIN, top:   'auto',  left:  'auto' };
    case 'bottom-left':  return { ...base, bottom: MARGIN, left:   MARGIN, top:   'auto',  right: 'auto' };
  }
}

export function usePip() {
  const [corner, setCorner] = useState('top-right');
  const [size, setSize]     = useState({ width: 360, height: 202 });
  const pipRef              = useRef(null);
  const shieldRef           = useRef(null);
  const resizeRef           = useRef(null);

  const onResizeMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const shield = document.createElement('div');
    shield.style.cssText = 'position:fixed;inset:0;z-index:9998;cursor:nwse-resize;';
    document.body.appendChild(shield);
    shieldRef.current = shield;
    resizeRef.current = { startX: e.clientX, origWidth: size.width };

    function onMove(e) {
      const { startX, origWidth } = resizeRef.current;
      const newWidth  = Math.max(MIN_WIDTH, origWidth + (e.clientX - startX));
      const newHeight = Math.round(newWidth * ASPECT);
      setSize({ width: newWidth, height: newHeight });
    }

    function onUp() {
      shieldRef.current?.remove();
      shieldRef.current = null;
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [size.width]);

  const style = cornerStyle(corner, size.width, size.height);

  return { pipRef, style, corner, setCorner, onResizeMouseDown };
}
