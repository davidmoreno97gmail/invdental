import React from 'react';

export default function ConfirmDialog({ open, title = 'Confirmar', message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 rounded bg-gray-100" onClick={onCancel}>Cancelar</button>
          <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}
