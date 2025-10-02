import React, { useState } from "react";
import UserSelect from "./UserSelect";
import CategorySelect from "./CategorySelect";
import ProviderSelect from "./ProviderSelect";
import PhotoInput from "./PhotoInput";

const mockUsers = [
  { id: 1, nombre: "Admin", apellidos: "", categoria: "Administrador" },
  { id: 2, nombre: "Ana", apellidos: "Pérez", categoria: "Odontólogo" },
];
const mockCategories = [
  { id: 1, nombre: "Material de obturación" },
  { id: 2, nombre: "Instrumental" },
];

export default function ProductForm({ onSave, initialData }) {
  const [form, setForm] = useState(
    initialData || {
      nombre: "",
      cantidad: 0,
      proveedorId: "",
      cantidadMinima: 0,
      foto: "",
      codigoBarras: "",
      usuarioId: "",
      categoriaId: "",
    }
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleUserChange(val) {
    setForm((f) => ({ ...f, usuarioId: val }));
  }
  function handleCategoryChange(val) {
    setForm((f) => ({ ...f, categoriaId: val }));
  }

  function handleProviderChange(val) {
    setForm((f) => ({ ...f, proveedorId: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block">Nombre</label>
        <input name="nombre" value={form.nombre} onChange={handleChange} className="input input-bordered w-full" required />
      </div>
      <div>
        <label className="block">Cantidad</label>
        <input name="cantidad" type="number" value={form.cantidad} onChange={handleChange} className="input input-bordered w-full" required />
      </div>
      <ProviderSelect value={form.proveedorId} onChange={handleProviderChange} />
      <div>
        <label className="block">Cantidad mínima</label>
        <input name="cantidadMinima" type="number" value={form.cantidadMinima} onChange={handleChange} className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block">Foto</label>
        <PhotoInput value={form.foto} onChange={val => setForm(f => ({ ...f, foto: val }))} />
      </div>
      <div>
        <label className="block">Código de barras</label>
        <input name="codigoBarras" value={form.codigoBarras} onChange={handleChange} className="input input-bordered w-full" />
      </div>
      <UserSelect users={mockUsers} value={form.usuarioId} onChange={handleUserChange} />
      <CategorySelect categories={mockCategories} value={form.categoriaId} onChange={handleCategoryChange} />
      <button type="submit" className="btn btn-primary">Guardar</button>
    </form>
  );
}
