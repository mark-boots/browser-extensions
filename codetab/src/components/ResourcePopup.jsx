import { useEffect, useRef, useState } from 'react';

export default function ResourcePopup({ anchor, type, resources, onChange, onClose }) {
  const popupRef = useRef(null);
  const [input, setInput] = useState('');
  const items = resources[type] || [];

  useEffect(() => {
    if (!anchor || !popupRef.current) return;
    const rect = anchor.getBoundingClientRect();
    const popup = popupRef.current;
    popup.style.left = Math.max(rect.right - 256, 8) + 'px';
    popup.style.top  = (rect.bottom + 6) + 'px';
  }, [anchor]);

  useEffect(() => {
    const close = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target) && e.target !== anchor) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', close), 0);
    return () => document.removeEventListener('mousedown', close);
  }, [anchor, onClose]);

  function addUrl() {
    const url = input.trim();
    if (!url || items.includes(url)) return;
    onChange({ ...resources, [type]: [...items, url] });
    setInput('');
  }

  function removeUrl(i) {
    onChange({ ...resources, [type]: items.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="html-meta-popup" ref={popupRef}>
      <div className="resource-popup-list">
        {items.length === 0 ? (
          <div className="resource-popup-empty">No resources added.</div>
        ) : items.map((url, i) => (
          <div key={i} className="resource-popup-item">
            <span>{url}</span>
            <button className="resource-popup-remove" onClick={() => removeUrl(i)}>✕</button>
          </div>
        ))}
      </div>
      <div className="resource-popup-add-row">
        <input
          className="html-meta-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addUrl()}
          placeholder={type === 'css' ? 'https://cdn.example.com/style.css' : 'https://cdn.example.com/script.js'}
        />
        <button className="pane-btn" onClick={addUrl}>Add</button>
      </div>
    </div>
  );
}
