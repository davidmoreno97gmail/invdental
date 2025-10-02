import React from "react";

export default function CategorySelect({ categories, value, onChange }) {
  return (
    <div>
      <label className="block">Categoría</label>
      <select className="input input-bordered w-full" value={value} onChange={e => onChange(e.target.value)} required>
        <option value="">Selecciona categoría</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>
    </div>
  );
}
