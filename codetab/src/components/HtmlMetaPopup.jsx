import { useEffect, useRef } from 'react';

export default function HtmlMetaPopup({ anchor, meta, onChange, onClose }) {
  const popupRef = useRef(null);

  useEffect(() => {
    if (!anchor || !popupRef.current) return;
    const rect = anchor.getBoundingClientRect();
    const popup = popupRef.current;
    const left = Math.min(rect.right - popup.offsetWidth, window.innerWidth - 264);
    popup.style.left = Math.max(left, 8) + 'px';
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

  return (
    <div className="html-meta-popup" ref={popupRef}>
      <div className="html-meta-field">
        <div className="html-meta-label">Classes on &lt;html&gt;</div>
        <input className="html-meta-input" placeholder="e.g. dark-mode" value={meta.classes || ''} onChange={e => onChange({ ...meta, classes: e.target.value })} />
      </div>
      <div className="html-meta-field">
        <div className="html-meta-label">Classes on &lt;body&gt;</div>
        <input className="html-meta-input" placeholder="e.g. dark-mode" value={meta.bodyClasses || ''} onChange={e => onChange({ ...meta, bodyClasses: e.target.value })} />
      </div>
      <div className="html-meta-field">
        <div className="html-meta-label">Stuff for &lt;head&gt;</div>
        <textarea className="html-meta-textarea" placeholder="e.g. <meta>, <link>, <script>" value={meta.head || ''} onChange={e => onChange({ ...meta, head: e.target.value })} />
      </div>
    </div>
  );
}
