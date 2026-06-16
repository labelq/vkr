import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.auth.me()
      .then(u => { if (!cancelled) setUser(u); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await api.auth.register(name, email, password);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
