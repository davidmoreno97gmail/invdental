import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const mockUsers = [
  { id: 1, nombre: "Admin", apellidos: "", categoria: "Administrador", username: "admin", password: "admin", rol: "admin" },
  { id: 2, nombre: "Ana", apellidos: "Pérez", categoria: "Odontólogo", username: "ana", password: "ana", rol: "user" },
];

const API_BASE = 'http://localhost:4000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('invdental_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  function persistUser(u) {
    try {
      if (u) localStorage.setItem('invdental_user', JSON.stringify(u));
      else localStorage.removeItem('invdental_user');
    } catch (e) {}
  }

  function login(username, password) {
    // Try backend auth first
    return fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(r => {
        if (!r.ok) throw new Error('auth failed');
        return r.json();
      })
      .then(userData => {
        setUser(userData);
        persistUser(userData);
        return true;
      })
      .catch(() => {
        const found = mockUsers.find(u => u.username === username && u.password === password);
        if (found) {
          setUser(found);
          persistUser(found);
        }
        return !!found;
      });
  }
  function logout() {
    setUser(null);
    persistUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
