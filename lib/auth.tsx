'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    if (token) {
      api.auth.getMe()
        .then((profile: any) => setUser({ id: profile.id, email: profile.email, name: profile.name, role: profile.role }))
        .catch(() => localStorage.removeItem('ut_token'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const data = await api.auth.login({ email, password }) as any;
    localStorage.setItem('ut_token', data.token);
    try {
      const profile: any = await api.auth.getMe();
      setUser({ id: profile.id, email: profile.email, name: profile.name, role: profile.role });
    } catch {
      localStorage.removeItem('ut_token');
      throw new Error('Profil tidak ditemukan. Silakan daftar ulang atau hubungi admin.');
    }
  }

  async function logout() {
    await api.auth.logout().catch(() => {});
    localStorage.removeItem('ut_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
