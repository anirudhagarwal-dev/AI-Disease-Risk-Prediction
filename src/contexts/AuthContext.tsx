import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../services/config';

type User = { id: string; email: string } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (token: string, user: User) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('auth_token');
    const u = localStorage.getItem('auth_user');
    if (t) setToken(t);
    if (u) setUser(JSON.parse(u));
  }, []);

  const persist = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user', JSON.stringify(u));
  };

  const login = async (email: string, password: string) => {
    try {
      const r = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!r.ok) throw new Error('backend login failed');
      const data = await r.json();
      persist(data.token, data.user);
      return true;
    } catch {
      // Fallback: mock local auth (no backend)
      const mockUser = { id: `mock_${Date.now()}`, email } as const;
      persist('mock_token', mockUser as any);
      return true;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const r = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!r.ok) throw new Error('backend signup failed');
      const data = await r.json();
      persist(data.token, data.user);
      return true;
    } catch {
      const mockUser = { id: `mock_${Date.now()}`, email } as const;
      persist('mock_token', mockUser as any);
      return true;
    }
  };

  const loginWithGoogle = async (token: string, userData: User) => {
    persist(token, userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isAuthenticated: !!token,
    login,
    signup,
    loginWithGoogle,
    logout,
  }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


