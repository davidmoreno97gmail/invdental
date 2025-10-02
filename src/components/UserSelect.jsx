import React from "react";

export default function UserSelect({ users, value, onChange }) {
  return (
    <div>
      <label className="block">Usuario responsable</label>
      <select className="input input-bordered w-full" value={value} onChange={e => onChange(e.target.value)} required>
        <option value="">Selecciona usuario</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.nombre} {u.apellidos} ({u.categoria})</option>
        ))}
      </select>
    </div>
  );
}
