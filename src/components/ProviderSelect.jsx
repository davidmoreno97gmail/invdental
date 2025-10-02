import React, { useEffect, useState } from 'react';

export default function ProviderSelect({ value, onChange }) {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/providers')
      .then(r => r.json())
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  return (
    <div>
      <label className="block">Proveedor</label>
      <select
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? '' : Number(v));
        }}
        className="input input-bordered w-full"
      >
        <option value="">-- Sin proveedor --</option>
        {providers.map(p => (
          <option key={p.id} value={String(p.id)}>{p.nombre}</option>
        ))}
      </select>
    </div>
  );
}
