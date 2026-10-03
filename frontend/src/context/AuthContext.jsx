import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api.me().then((d) => setUser(d.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  const authenticate = (data) => {
    tokenStore.set(data.token);
    setUser(data.user);
  };

  const login = async (email, password) => authenticate(await api.login({ email, password }));
  const register = async (name, email, password) => authenticate(await api.register({ name, email, password }));
  const completeReset = async (token, password) => authenticate(await api.resetPassword(token, password));

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, completeReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
