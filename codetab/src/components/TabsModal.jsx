import { IconX } from '@tabler/icons-react';
import { formatDate } from '../utils/storage';

export default function TabsModal({ open, tabs, currentId, onOpen, onNew, onDuplicate, onExport, onDelete, onClose }) {
  if (!open) return null;
  const sorted = Object.values(tabs).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h2>My CodeTabs</h2>
          <button className="btn-new-codetab" onClick={onNew}>+ New CodeTab</button>
          <button className="modal-close" onClick={onClose}><IconX size={16} /></button>
        </div>
        <div className="tabs-list">
          {sorted.length === 0 ? (
            <p className="tabs-empty">No saved CodeTabs yet.</p>
          ) : sorted.map(tab => (
            <div key={tab.id} className={`tab-item${tab.id === currentId ? ' tab-item--active' : ''}`}>
              <div className="tab-info">
                <span className="tab-item-name">{tab.name || 'Untitled'}</span>
                <span className="tab-item-date">{formatDate(tab.updatedAt)}</span>
              </div>
              <div className="tab-actions">
                <button className="tab-btn tab-btn-open"      onClick={() => onOpen(tab.id)}>Open</button>
                <button className="tab-btn tab-btn-duplicate" onClick={() => onDuplicate(tab.id)}>Duplicate</button>
                <button className="tab-btn tab-btn-export"    onClick={() => onExport(tab.id)}>Export</button>
                <button className="tab-btn tab-btn-delete"    onClick={() => onDelete(tab.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
