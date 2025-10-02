import React from 'react';

export default function Toast({ toasts = [], onClose }) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2 z-50">
      {toasts.map(t => (
        <div key={t.id} className="bg-black text-white px-3 py-2 rounded shadow" onClick={() => onClose && onClose(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
