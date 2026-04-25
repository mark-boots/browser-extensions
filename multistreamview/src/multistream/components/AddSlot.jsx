import { useState } from 'react';

export default function AddSlot({ onAdd }) {
  const [url,   setUrl]   = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const ok = onAdd(url.trim());
    if (ok) {
      setUrl('');
      setError(false);
    } else {
      setError(true);
    }
  }

  return (
    <form className="add-slot" onSubmit={handleSubmit}>
      <input
        className={`add-slot-input${error ? ' add-slot-input--error' : ''}`}
        value={url}
        onChange={e => { setUrl(e.target.value); setError(false); }}
        placeholder="YouTube / Twitch / Kick URL"
        spellCheck={false}
      />
      <button className="add-slot-btn" type="submit">Add</button>
    </form>
  );
}
