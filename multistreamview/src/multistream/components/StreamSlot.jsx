import { useState, useRef } from 'react';
import { buildPlayerUrl } from '../utils/embedBuilder.js';

const ROLE_TO_ACTION = { main: 'main', pip: 'pip', small: 'eject' };

export default function StreamSlot({ stream, availableActions, onAction }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const initialRole = useRef(stream.role);
  const src = buildPlayerUrl({ ...stream, role: initialRole.current });

  function handleRoleChange(e) {
    const action = ROLE_TO_ACTION[e.target.value];
    if (action && availableActions.includes(action)) onAction(action);
  }

  return (
    <div className="stream-slot" onMouseLeave={() => setConfirmRemove(false)}>
      <div className="stream-overlay">
        {availableActions.includes('pip-corner') && (
          <>
            <span className="pip-drag-handle">⠿</span>
            <div className="pip-overlay-divider" />
          </>
        )}
        {availableActions.includes('drag') && (
          <>
            <span className="slot-drag-handle">⠿</span>
            <div className="pip-overlay-divider" />
          </>
        )}
        {!confirmRemove && <>
          <select className="role-select" value={stream.role} onChange={handleRoleChange}>
            <option value="main">Large</option>
            <option value="pip">PiP</option>
            <option value="small">Small</option>
          </select>
          <button onClick={() => setReloadKey(k => k + 1)}>↺</button>
          {availableActions.includes('chat')   && <button onClick={() => onAction('chat')}>Chat</button>}
          {availableActions.includes('remove') && <button className="btn-remove" onClick={() => setConfirmRemove(true)}>✕</button>}
        </>}
        {confirmRemove && <>
          <span className="remove-confirm-label">Remove?</span>
          <button className="btn-confirm-yes" onClick={() => onAction('remove')}>Yes</button>
          <button className="btn-confirm-no"  onClick={() => setConfirmRemove(false)}>No</button>
        </>}
      </div>
      <iframe
        key={reloadKey}
        src={src}
        title={stream.platform === 'youtube' ? `YT ${stream.videoId}` : `TW ${stream.channel}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
        referrerPolicy="no-referrer"
        className="stream-iframe"
      />
    </div>
  );
}
