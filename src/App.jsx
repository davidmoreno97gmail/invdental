import { exportToCSV } from "./utils/exportCSV";

import React, { useState, useEffect } from "react";
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from "./components/AuthContext";
import Login from "./components/Login";

import InventoryTable from "./components/InventoryTable";
import ProductForm from "./components/ProductForm";
import QRGenerator from "./components/QRGenerator";
import QRScanner from "./components/QRScanner";
import SearchBar from "./components/SearchBar";
import ProvidersPage from "./pages/ProvidersPage";
import UsersPage from "./pages/UsersPage";
import CategoriesPage from "./pages/CategoriesPage";
import LogsPage from "./pages/LogsPage";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";





function App() {
  console.log('App render start');
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [log, setLog] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  // view is now controlled by router
  const [confirmRemoveFromStockProduct, setConfirmRemoveFromStockProduct] = useState(null);
  const [toasts, setToasts] = useState([]);

  function addToast(message) {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }

  function removeToast(id) { setToasts(t => t.filter(x => x.id !== id)); }

  const API_BASE = 'http://localhost:4000';
  const currentUser = user;
  function actorHeaders() {
    if (!currentUser) return {};
    return { 'x-user-id': String(currentUser.id), 'x-user-name': currentUser.nombre };
  }

  // Load products from backend (fallback to empty local state on error)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE}/api/products`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        // normalize qr URLs that start with /api to point to backend host
        const normalized = (data || []).map(p => ({
          ...p,
          qr: p.qr && typeof p.qr === 'string' && p.qr.startsWith('/api') ? `${API_BASE}${p.qr}` : p.qr
        }));
        setProducts(normalized);
      })
      .catch((err) => {
        console.warn('Could not load products from API, using local state', err);
      })
      .finally(() => setLoading(false));
    return () => { mounted = false };
  }, []);

  // fetch providers
  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/api/providers`)
      .then(r => r.json())
      .then(data => { if (!mounted) return; setProviders(data || []) })
      .catch(() => { /* ignore */ })
    return () => { mounted = false };
  }, []);


  function handleSave(product) {
    let newProducts;
    // If there's a backend, prefer calling it. Otherwise, fallback to local operations.
    if (selected && selected.id) {
      // update
      fetch(`${API_BASE}/api/products/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...actorHeaders() },
        body: JSON.stringify({ ...selected, ...product })
      })
        .then(r => r.json())
        .then(updated => {
          setProducts(products.map(p => p.id === updated.id ? updated : p));
          setLog(l => [...l, { tipo: 'editar', producto: updated.nombre, usuario: user?.nombre, fecha: new Date().toLocaleString() }]);
          addToast('Producto actualizado');
        })
        .catch(() => {
          const fallback = products.map((p) => (p.id === selected.id ? { ...selected, ...product } : p));
          setProducts(fallback);
          setLog((l) => [
            ...l,
            { tipo: "editar", producto: product.nombre, usuario: user?.nombre, fecha: new Date().toLocaleString() },
          ]);
        })
        .finally(() => {
          setShowForm(false);
          setSelected(null);
        });
    } else {
      // create
      const payload = { ...product, qr: '' };
      fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...actorHeaders() },
        body: JSON.stringify(payload)
      })
        .then(r => r.json())
        .then(created => {
          // if backend didn't generate qr, create local one
          if (!created.qr) created.qr = window.location.href + "?id=" + created.id;
          // normalize if backend returned relative path
          if (created.qr && created.qr.startsWith('/api')) created.qr = `${API_BASE}${created.qr}`;
          setProducts(prev => [created, ...prev]);
          setLog(l => [...l, { tipo: 'añadir', producto: created.nombre, usuario: user?.nombre, fecha: new Date().toLocaleString() }]);
          addToast('Producto creado');
        })
        .catch(() => {
          const id = Date.now();
          const local = { ...product, id, qr: window.location.href + "?id=" + id };
          setProducts(prev => [local, ...prev]);
          setLog((l) => [
            ...l,
            { tipo: "añadir", producto: product.nombre, usuario: user?.nombre, fecha: new Date().toLocaleString() },
          ]);
        })
        .finally(() => {
          setShowForm(false);
          setSelected(null);
        });
    }
  }

  function handleRemove(product) {
    // Try backend delete, fall back to local state
  fetch(`${API_BASE}/api/products/${product.id}`, { method: 'DELETE', headers: { ...actorHeaders() } })
      .then(res => {
        if (!res.ok) throw new Error('delete failed');
        setProducts(products.filter((p) => p.id !== product.id));
        setLog((l) => [
          ...l,
          { tipo: "quitar", producto: product.nombre, usuario: user?.nombre, fecha: new Date().toLocaleString() },
        ]);
        addToast('Producto eliminado');
      })
      .catch(() => {
        // fallback
        setProducts(products.filter((p) => p.id !== product.id));
        setLog((l) => [
          ...l,
          { tipo: "quitar", producto: product.nombre, usuario: user?.nombre, fecha: new Date().toLocaleString() },
        ]);
      });
  }

  function handleRemoveFromStock(product) {
    // set cantidad to 0 via PUT
    const updated = { ...product, cantidad: 0 };
    fetch(`${API_BASE}/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...actorHeaders() },
      body: JSON.stringify(updated),
    })
      .then(r => r.json())
      .then(data => {
        // normalize qr on update
        const updated = data.qr && data.qr.startsWith('/api') ? { ...data, qr: `${API_BASE}${data.qr}` } : data;
        setProducts(products.map(p => p.id === updated.id ? updated : p));
        setLog(l => [...l, { tipo: 'quitar_stock', producto: data.nombre, usuario: user?.nombre, fecha: new Date().toLocaleString() }]);
        addToast('Cantidad puesta a 0');
      })
      .catch(() => {
        // fallback local
        setProducts(products.map(p => p.id === product.id ? { ...p, cantidad: 0 } : p));
        setLog(l => [...l, { tipo: 'quitar_stock', producto: product.nombre, usuario: user?.nombre, fecha: new Date().toLocaleString() }]);
        addToast('Error al modificar cantidad (modo offline)');
      });
  }

  function handleScan(result) {
    setShowScanner(false);
    if (result) {
      const found = products.find((p) => (window.location.href + "?id=" + p.id) === result);
      if (found) setSelected(found);
      else alert("Producto no encontrado por QR");
    }
  }

  // Búsqueda avanzada
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(q) ||
      p.proveedor?.toLowerCase().includes(q) ||
      p.codigoBarras?.toLowerCase().includes(q)
    );
  });

  if (!user) return <Login />;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
  <aside className="w-64 bg-white shadow h-screen sticky top-0">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Inventario</h2>
          <p className="text-sm text-gray-500">Dental App</p>
        </div>
        <nav className="p-4 space-y-2">
          <NavLink to="/stock" className={({isActive})=>`w-full block px-3 py-2 rounded hover:bg-gray-100 ${isActive?'bg-gray-100':''}`} >Stock</NavLink>
          <NavLink to="/providers" className={({isActive})=>`w-full block px-3 py-2 rounded hover:bg-gray-100 ${isActive?'bg-gray-100':''}`} >Proveedores</NavLink>
          <NavLink to="/users" className={({isActive})=>`w-full block px-3 py-2 rounded hover:bg-gray-100 ${isActive?'bg-gray-100':''}`} >Usuarios</NavLink>
          <NavLink to="/categories" className={({isActive})=>`w-full block px-3 py-2 rounded hover:bg-gray-100 ${isActive?'bg-gray-100':''}`} >Categorías</NavLink>
          <NavLink to="/logs" className={({isActive})=>`w-full block px-3 py-2 rounded hover:bg-gray-100 ${isActive?'bg-gray-100':''}`} >Logs</NavLink>
        </nav>
      </aside>

  {/* Main */}
      <main className="flex-1 p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Stock</h1>
            <p className="text-sm text-gray-500">Resumen del inventario y acciones</p>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} />
            <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setShowForm(true); setSelected(null); }}>Añadir producto</button>
              <button className="px-3 py-2 rounded bg-gray-200" onClick={() => setShowScanner((s) => !s)}>Escanear QR</button>
              <button className="px-3 py-2 rounded bg-purple-600 text-white" onClick={() => exportToCSV(products)}>Exportar</button>
              <div className="px-3 py-2 rounded bg-white border">{user.nombre} ({user.rol})</div>
              <button className="px-2 py-1 text-sm border rounded-lg hover:bg-gray-100" onClick={logout}>Salir</button>
            </div>
          </div>
        </header>
      {/* Alerta de stock bajo */}
      {filtered.some(p => Number(p.cantidad) < Number(p.cantidadMinima)) && (
        <div className="p-4 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200 mb-4">¡Hay productos con stock por debajo del mínimo!</div>
      )}
      {showForm && (
        <div className="mb-4">
          <ProductForm onSave={handleSave} initialData={selected} />
        </div>
      )}
      {showScanner && (
        <div className="mb-4">
          <QRScanner onResult={handleScan} />
        </div>
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/providers" replace />} />
        <Route path="/stock" element={
          <InventoryTable
            products={filtered}
            onSelect={(prod) => { setSelected(prod); setShowForm(true); }}
            onRemove={handleRemove}
            onRemoveFromStock={handleRemoveFromStock}
            providers={providers}
          />
        } />
        <Route path="/providers" element={<ProvidersPage apiBase={API_BASE} currentUser={currentUser} />} />
        <Route path="/users" element={<UsersPage apiBase={API_BASE} currentUser={currentUser} />} />
        <Route path="/categories" element={<CategoriesPage apiBase={API_BASE} currentUser={currentUser} />} />
        <Route path="/logs" element={<LogsPage apiBase={API_BASE} />} />
      </Routes>
      {selected && (
        <div className="my-4">
          <h2 className="font-semibold">QR del producto seleccionado</h2>
          <QRGenerator value={selected.qr || (window.location.href + "?id=" + selected.id)} />
          <div className="flex gap-2 mt-2">
            <button className="px-4 py-2 rounded-lg font-medium bg-yellow-500 text-white hover:bg-yellow-600" onClick={() => setConfirmRemoveFromStockProduct(selected)}>Quitar del stock</button>
            {user.rol === "admin" && (
              <button className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600" onClick={() => handleRemove(selected)}>Quitar producto</button>
            )}
          </div>
          <ConfirmDialog
            open={!!confirmRemoveFromStockProduct}
            title="Quitar del stock"
            message={confirmRemoveFromStockProduct ? `¿Deseas poner la cantidad a 0 para '${confirmRemoveFromStockProduct.nombre}' (ID ${confirmRemoveFromStockProduct.id})?` : ''}
            onCancel={() => setConfirmRemoveFromStockProduct(null)}
            onConfirm={() => { if (confirmRemoveFromStockProduct) { handleRemoveFromStock(confirmRemoveFromStockProduct); setConfirmRemoveFromStockProduct(null); } }}
          />
        </div>
      )}
      <div className="mt-8">
        <h2 className="font-semibold mb-2">Registro de acciones</h2>
        <ul className="text-sm bg-gray-50 rounded p-2">
          {log.map((l, i) => (
            <li key={i}>{l.fecha}: {l.usuario} {l.tipo} <b>{l.producto}</b></li>
          ))}
        </ul>
      </div>
  <Toast toasts={toasts} onClose={removeToast} />
      </main>
    </div>
  );
}

export default App;
