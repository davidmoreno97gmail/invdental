import React from "react";

export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      className="input input-bordered w-full mb-4"
      placeholder="Buscar por nombre, proveedor, código..."
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}
