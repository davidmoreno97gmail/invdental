import React, { useEffect, useState } from 'react';

export default function UsersPage({ apiBase = 'http://localhost:4000', currentUser = null }) {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellidos: '', username: '', rol: 'user' });

  useEffect(() => { fetchUsers() }, []);
  function fetchUsers() { fetch(`${apiBase}/api/users`).then(r=>r.json()).then(setUsers).catch(()=>setUsers([])); }
  function actorHeaders(){ return currentUser ? { 'x-user-id': String(currentUser.id), 'x-user-name': currentUser.nombre } : {}; }
  function edit(u) { setEditing(u); setForm({ nombre: u.nombre, apellidos: u.apellidos, username: u.username, rol: u.rol }); }
  function save() {
    if (editing) {
      fetch(`${apiBase}/api/users/${editing.id}`, { method: 'PUT', headers: {'Content-Type':'application/json', ...actorHeaders()}, body: JSON.stringify(form) }).then(()=>{ setEditing(null); setForm({ nombre: '', apellidos: '', username: '', rol: 'user' }); fetchUsers(); });
    } else {
      fetch(`${apiBase}/api/users`, { method: 'POST', headers: {'Content-Type':'application/json', ...actorHeaders()}, body: JSON.stringify(form) }).then(()=>{ setForm({ nombre: '', apellidos: '', username: '', rol: 'user' }); fetchUsers(); });
    }
  }
  function remove(u){ if(!confirm(`Eliminar usuario ${u.nombre}?`)) return; fetch(`${apiBase}/api/users/${u.id}`, { method:'DELETE', headers: {...actorHeaders()} }).then(()=>fetchUsers()); }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Usuarios</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} className="input" />
        <input placeholder="Apellidos" value={form.apellidos} onChange={e=>setForm(f=>({...f,apellidos:e.target.value}))} className="input" />
        <input placeholder="Usuario" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} className="input" />
        <select value={form.rol} onChange={e=>setForm(f=>({...f,rol:e.target.value}))} className="input">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <div className="mb-4">
        <button className="btn btn-primary" onClick={save}>{editing ? 'Actualizar' : 'Crear'}</button>
        {editing && <button className="btn ml-2" onClick={()=>{setEditing(null); setForm({ nombre:'', apellidos:'', username:'', rol:'user' })}}>Cancelar</button>}
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium">{u.nombre} {u.apellidos} <span className="text-sm text-gray-500">({u.username})</span></div>
              <div className="text-sm text-gray-500">Rol: {u.rol}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 text-sm border" onClick={()=>edit(u)}>Editar</button>
              <button className="px-2 py-1 text-sm border text-red-600" onClick={()=>remove(u)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
