import { buildPlayerUrl } from '../utils/embedBuilder.js';
import { usePip } from '../hooks/usePip.js';
import { useState } from 'react';

const CORNERS = [
  { value: 'top-left',     label: '↖' },
  { value: 'top-right',    label: '↗' },
  { value: 'bottom-left',  label: '↙' },
  { value: 'bottom-right', label: '↘' },
];

export default function PipStream({ stream, onAction }) {
  const { pipRef, style, corner, setCorner, onResizeMouseDown } = usePip();
  const [overlayVisible, setOverlayVisible] = useState(false);

  if (!stream) return null;

  const src = buildPlayerUrl(stream);

  return (
    <div
      ref={pipRef}
      style={style}
      className="pip-stream"
      onMouseEnter={() => setOverlayVisible(true)}
      onMouseLeave={() => setOverlayVisible(false)}
    >
      <iframe
        src={src}
        title="PiP stream"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        className="stream-iframe"
      />
      {overlayVisible && (
        <div className="stream-overlay pip-overlay">
          {CORNERS.map(c => (
            <button
              key={c.value}
              className={`pip-corner-btn ${corner === c.value ? 'pip-corner-btn--active' : ''}`}
              onClick={() => setCorner(c.value)}
              title={c.value.replace('-', ' ')}
            >
              {c.label}
            </button>
          ))}
          <div className="pip-overlay-divider" />
          <button onClick={() => onAction('main')}>Main</button>
          <button onClick={() => onAction('small')}>Small</button>
          <button className="btn-remove" onClick={() => onAction('remove')}>✕</button>
        </div>
      )}
      <div
        className="pip-resize-handle"
        onMouseDown={onResizeMouseDown}
      />
    </div>
  );
}
