import React, { createContext, useContext, useMemo, useState } from 'react';
import { loginRequest, signupRequest } from '../lib/api';

const AuthContext = createContext(null);

function readStoredAuth() {
  const token = localStorage.getItem('mms_token');
  const userRaw = localStorage.getItem('mms_user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  return { token, user };
}

export function AuthProvider({ children }) {
  const stored = readStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);

  const isAuthenticated = !!token;

  const login = async ({ email, password }) => {
    const data = await loginRequest({ email, password });
    localStorage.setItem('mms_token', data.token);
    localStorage.setItem('mms_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async ({ full_name, email, password }) => {
    const data = await signupRequest({ full_name, email, password });
    localStorage.setItem('mms_token', data.token);
    localStorage.setItem('mms_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('mms_token');
    localStorage.removeItem('mms_user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, isAuthenticated, login, signup, logout }),
    [token, user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
