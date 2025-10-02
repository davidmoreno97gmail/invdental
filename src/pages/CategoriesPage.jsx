import React, { useEffect, useState } from 'react';

export default function CategoriesPage({ apiBase = 'http://localhost:4000', currentUser = null }) {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  useEffect(() => { fetchCategories() }, []);
  function fetchCategories() { fetch(`${apiBase}/api/categories`).then(r=>r.json()).then(setCategories).catch(()=>setCategories([])); }
  function actorHeaders(){ return currentUser ? { 'x-user-id': String(currentUser.id), 'x-user-name': currentUser.nombre } : {}; }
  function save() {
    if (editing) {
      fetch(`${apiBase}/api/categories/${editing.id}`, { method:'PUT', headers:{'Content-Type':'application/json', ...actorHeaders()}, body: JSON.stringify({ nombre: name }) }).then(()=>{ setName(''); setEditing(null); fetchCategories(); });
    } else {
      fetch(`${apiBase}/api/categories`, { method:'POST', headers:{'Content-Type':'application/json', ...actorHeaders()}, body: JSON.stringify({ nombre: name }) }).then(()=>{ setName(''); fetchCategories(); });
    }
  }
  function edit(c){ setEditing(c); setName(c.nombre); }
  function remove(c){ if(!confirm(`Eliminar categoría ${c.nombre}?`)) return; fetch(`${apiBase}/api/categories/${c.id}`, { method:'DELETE', headers: {...actorHeaders()} }).then(()=>fetchCategories()); }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Categorías</h2>
      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="Nombre categoría" value={name} onChange={e=>setName(e.target.value)} />
        <button className="btn btn-primary" onClick={save}>{editing ? 'Actualizar' : 'Crear'}</button>
        {editing && <button className="btn" onClick={()=>{ setEditing(null); setName(''); }}>Cancelar</button>}
      </div>
      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
            <div>{c.nombre}</div>
            <div className="flex gap-2">
              <button className="px-2 py-1 text-sm border" onClick={()=>edit(c)}>Editar</button>
              <button className="px-2 py-1 text-sm border text-red-600" onClick={()=>remove(c)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
