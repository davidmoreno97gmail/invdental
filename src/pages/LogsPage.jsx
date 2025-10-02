import React, { useEffect, useState } from 'react';

export default function LogsPage({ apiBase = 'http://localhost:4000', currentUser = null }) {
  const [logs, setLogs] = useState([]);
  const [limit, setLimit] = useState(200);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  useEffect(() => { fetchLogs() }, []);
  function actorHeaders(){ return currentUser ? { 'x-user-id': String(currentUser.id), 'x-user-role': currentUser.rol } : {}; }
  function fetchLogs() {
    if (!currentUser || currentUser.rol !== 'admin') { setLogs([]); return; }
    const qp = new URLSearchParams();
    if (limit) qp.set('limit', String(limit));
    if (start) qp.set('start', start);
    if (end) qp.set('end', end);
    fetch(`${apiBase}/api/logs?${qp.toString()}`, { headers: { ...actorHeaders() } }).then(r=>{
      if (!r.ok) return r.json().then(e=>{ throw new Error(e.error || 'failed') });
      return r.json();
    }).then(setLogs).catch(()=>setLogs([]));
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Registro de acciones (logs)</h2>
      {!currentUser || currentUser.rol !== 'admin' ? (
        <div className="p-4 bg-yellow-100 rounded">Acceso denegado: solo administradores pueden ver los logs.</div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm">Mostrar</label>
            <select value={limit} onChange={e=>setLimit(Number(e.target.value))} className="input">
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <label className="text-sm">Desde</label>
            <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="input" />
            <label className="text-sm">Hasta</label>
            <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="input" />
            <button className="btn btn-primary" onClick={fetchLogs}>Actualizar</button>
          </div>
        </>
      )}
      <div className="overflow-x-auto">
  <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Item ID</th>
              <th className="px-4 py-2">Item</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t">
                <td className="px-4 py-2 text-sm">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2 text-sm">{l.action}</td>
                <td className="px-4 py-2 text-sm">{l.actor ? `${l.actor.name || l.actor} (id:${l.actor.id || ''})` : '-'}</td>
                <td className="px-4 py-2 text-sm">{l.itemId || '-'}</td>
                <td className="px-4 py-2 text-sm">{l.itemName || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
