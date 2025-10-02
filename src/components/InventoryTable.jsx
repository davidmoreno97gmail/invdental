import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

const mockUsers = [
  { id: 1, nombre: "Admin", apellidos: "", categoria: "Administrador" },
  { id: 2, nombre: "Ana", apellidos: "Pérez", categoria: "Odontólogo" },
];
const mockCategories = [
  { id: 1, nombre: "Material de obturación" },
  { id: 2, nombre: "Instrumental" },
];

export default function InventoryTable({ products, onSelect, onRemove, onRemoveFromStock, providers = [] }) {
  const [toDelete, setToDelete] = useState(null);
  const [toRemoveStock, setToRemoveStock] = useState(null);
  function getUser(id) {
    const u = mockUsers.find((u) => u.id.toString() === (id || "").toString());
    return u ? `${u.nombre} ${u.apellidos}` : "-";
  }
  function getCategory(id) {
    const c = mockCategories.find((c) => c.id.toString() === (id || "").toString());
    return c ? c.nombre : "-";
  }
  const providerMap = (providers || []).reduce((acc, p) => { acc[p.id] = p; return acc }, {});
  return (
    <div>
      {/* Card grid for small screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:hidden">
        {products.map((prod) => (
          <div key={prod.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold">{prod.nombre}</h3>
                <p className="text-sm text-gray-500">ID: {prod.id}</p>
              </div>
              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                {prod.qr ? <img src={prod.qr} alt="QR" className="h-12 w-12" /> : <span className="text-xs text-gray-400">No QR</span>}
              </div>
            </div>
            <p className="text-sm text-gray-600">Proveedor: {providerMap[prod.proveedorId]?.nombre || prod.proveedor || '-'}</p>
            <p className="text-sm text-gray-600">Cantidad: <b>{prod.cantidad}</b></p>
            <div className="flex gap-2 mt-3">
              <button className="px-3 py-1 rounded bg-blue-50 text-blue-600" onClick={() => onSelect(prod)}>Editar</button>
              <button className="px-3 py-1 rounded bg-yellow-50 text-yellow-700" onClick={() => setToRemoveStock(prod)}>Quitar del stock</button>
              <button className="px-3 py-1 rounded bg-red-50 text-red-600" onClick={() => setToDelete(prod)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Table for md+ screens */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Proveedor</th>
              <th className="px-4 py-2">Cantidad mínima</th>
              <th className="px-4 py-2">Foto</th>
              <th className="px-4 py-2">Código de barras</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">QR</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <tr key={prod.id} className="border-t">
                <td className="px-4 py-2">{prod.id}</td>
                <td className="px-4 py-2">{prod.nombre}</td>
                <td className="px-4 py-2">{prod.cantidad}</td>
                <td className="px-4 py-2">{providerMap[prod.proveedorId]?.nombre || prod.proveedor}</td>
                <td className="px-4 py-2">{prod.cantidadMinima}</td>
                <td className="px-4 py-2">
                  {prod.foto ? (
                    <img src={prod.foto} alt="foto" className="h-10 w-10 object-cover rounded" />
                  ) : (
                    <span className="text-gray-400">Sin foto</span>
                  )}
                </td>
                <td className="px-4 py-2">{prod.codigoBarras}</td>
                <td className="px-4 py-2">{getCategory(prod.categoriaId)}</td>
                <td className="px-4 py-2">{getUser(prod.usuarioId)}</td>
                <td className="px-4 py-2">
                  {prod.qr ? (
                    <img src={prod.qr} alt="QR" className="h-10 w-10" />
                  ) : (
                    <span className="text-gray-400">Sin QR</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 items-center">
                    <button className="text-blue-600 hover:underline" onClick={() => onSelect(prod)}>
                      Editar
                    </button>
                    <button className="text-yellow-600 hover:underline" onClick={() => setToRemoveStock(prod)}>
                      Quitar del stock
                    </button>
                    <button className="text-red-600 hover:underline" onClick={() => setToDelete(prod)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar producto"
        message={toDelete ? `¿Deseas eliminar el producto '${toDelete.nombre}' (ID ${toDelete.id})? Esta acción no se puede deshacer.` : ''}
        onCancel={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) { onRemove && onRemove(toDelete); setToDelete(null); } }}
      />
      <ConfirmDialog
        open={!!toRemoveStock}
        title="Quitar del stock"
        message={toRemoveStock ? `¿Deseas poner la cantidad a 0 para '${toRemoveStock.nombre}' (ID ${toRemoveStock.id})?` : ''}
        onCancel={() => setToRemoveStock(null)}
        onConfirm={() => { if (toRemoveStock) { onRemoveFromStock && onRemoveFromStock(toRemoveStock); setToRemoveStock(null); } }}
      />
    </div>
  );
}
