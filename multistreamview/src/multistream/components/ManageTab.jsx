import { useState } from 'react';

export default function ManageTab({ streams, onAdd, onRemove }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const ok = onAdd(trimmed);
    if (ok === false) {
      setError('Invalid or unrecognised URL');
    } else {
      setInput('');
      setError('');
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleAdd();
  }

  return (
    <div className="manage-tab">
      <div className="manage-add">
        <input
          type="text"
          placeholder="YouTube or Twitch URL"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={handleKey}
          className="manage-input"
        />
        <button onClick={handleAdd} className="manage-btn-add">Add</button>
        {error && <p className="manage-error">{error}</p>}
      </div>
      <ul className="manage-list">
        {streams.map((s) => (
          <li key={s.id} className="manage-item">
            <span className={`platform-badge platform-badge--${s.platform}`}>
              {s.platform === 'youtube' ? 'YT' : 'TW'}
            </span>
            <span className="manage-item-label">
              {s.platform === 'youtube' ? s.videoId : s.channel}
            </span>
            <span className="manage-item-role">{s.role}</span>
            <button onClick={() => onRemove(s.id)} className="manage-btn-remove">✕</button>
          </li>
        ))}
        {streams.length === 0 && (
          <li className="manage-empty">No streams added yet.</li>
        )}
      </ul>
    </div>
  );
}
