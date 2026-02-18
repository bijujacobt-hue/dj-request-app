import { useState } from 'react';
import { updateGuestName } from '../utils/api';

export default function NamePicker({ guest, onNameUpdated }) {
  const [editing, setEditing] = useState(false);
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!customName.trim()) return;
    setLoading(true);
    try {
      const updated = await updateGuestName(guest.id, customName.trim());
      onNameUpdated(updated);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Enter your name..."
          className="bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={loading || !customName.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-slate-400 hover:text-white text-sm"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-purple-400 font-medium">{guest.display_name}</span>
      <button
        onClick={() => { setCustomName(guest.display_name); setEditing(true); }}
        className="text-slate-500 hover:text-slate-300 text-xs"
      >
        change name
      </button>
    </div>
  );
}
