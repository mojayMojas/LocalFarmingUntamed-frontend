import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api
      .get('/api/auth/me')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    tokenStore.set(res.token);
    setUser(res);
    return res;
  }, []);

  const registerWith = useCallback(async (path, payload) => {
    const res = await api.post(path, payload);
    tokenStore.set(res.token);
    setUser(res);
    return res;
  }, []);

  const refresh = useCallback(() => api.get('/api/auth/me').then(setUser), []);

  const value = useMemo(
    () => ({ user, ready, login, logout, registerWith, refresh }),
    [user, ready, login, logout, registerWith, refresh]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const HOME_BY_ROLE = {
  ADMIN: '/admin',
  FARMER: '/farmer',
  CUSTOMER: '/customer',
  DRIVER: '/driver',
};
