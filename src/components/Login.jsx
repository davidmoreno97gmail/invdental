import React, { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    Promise.resolve(login(form.username, form.password))
      .then(ok => {
        if (!ok) setError("Usuario o contraseña incorrectos");
      })
      .catch(() => setError("Usuario o contraseña incorrectos"));
  }
  return (
    <form className="max-w-xs mx-auto mt-16 p-6 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Iniciar sesión</h2>
      {error && <div className="alert alert-error mb-2">{error}</div>}
      <input name="username" className="input input-bordered w-full mb-2" placeholder="Usuario" value={form.username} onChange={handleChange} />
      <input name="password" type="password" className="input input-bordered w-full mb-4" placeholder="Contraseña" value={form.password} onChange={handleChange} />
      <button className="btn btn-primary w-full">Entrar</button>
    </form>
  );
}
