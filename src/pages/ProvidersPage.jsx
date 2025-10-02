import React, { useEffect, useState } from 'react';

export default function ProvidersPage({ apiBase = 'http://localhost:4000', currentUser = null }) {
  const [providers, setProviders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => { fetchProviders() }, []);

  function fetchProviders() {
    fetch(`${apiBase}/api/providers`).then(r => r.json()).then(setProviders).catch(() => setProviders([]));
  }

  function edit(p) { setEditing(p); setName(p.nombre); }

  function actorHeaders(){ return currentUser ? { 'x-user-id': String(currentUser.id), 'x-user-name': currentUser.nombre } : {}; }

  function save() {
    const payload = { nombre: name };
    if (editing) {
      fetch(`${apiBase}/api/providers/${editing.id}`, { method: 'PUT', headers: {'Content-Type':'application/json', ...actorHeaders()}, body: JSON.stringify(payload) })
        .then(r => r.json()).then(() => { setName(''); setEditing(null); fetchProviders(); });
    } else {
      fetch(`${apiBase}/api/providers`, { method: 'POST', headers: {'Content-Type':'application/json', ...actorHeaders()}, body: JSON.stringify(payload) })
        .then(r => r.json()).then(() => { setName(''); fetchProviders(); });
    }
  }

  function remove(p) { if (!confirm(`Eliminar proveedor ${p.nombre}?`)) return; fetch(`${apiBase}/api/providers/${p.id}`, { method: 'DELETE', headers: {...actorHeaders()} }).then(() => fetchProviders()); }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Proveedores</h2>
      <div className="mb-4 flex gap-2">
        <input value={name} onChange={(e)=>setName(e.target.value)} className="input input-bordered" placeholder="Nombre proveedor" />
        <button className="btn btn-primary" onClick={save}>{editing ? 'Actualizar' : 'Crear'}</button>
        {editing && <button className="btn" onClick={() => { setEditing(null); setName(''); }}>Cancelar</button>}
      </div>
      <div className="space-y-2">
        {providers.map(p => (
          <div key={p.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium">{p.nombre}</div>
              <div className="text-sm text-gray-500">{p.contacto} • {p.email} • {p.telefono}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 text-sm border" onClick={() => edit(p)}>Editar</button>
              <button className="px-2 py-1 text-sm border text-red-600" onClick={() => remove(p)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
