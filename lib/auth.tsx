'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, setOnSessionExpired } from './api';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  showExpiryWarning: boolean;
  isSessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  stayLoggedIn: () => Promise<void>;
  dismissExpired: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const WARNING_MS = 5 * 60 * 1000; // 5 minutes before expiry

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (expiredTimerRef.current) clearTimeout(expiredTimerRef.current);
  }, []);

  const scheduleTimers = useCallback((expiresAt: number) => {
    clearTimers();
    const now = Date.now();
    // expiresAt is a Unix timestamp in seconds
    const expiresMs = expiresAt * 1000;
    const msUntilExpiry = expiresMs - now;
    const msUntilWarning = msUntilExpiry - WARNING_MS;

    if (msUntilWarning > 0) {
      warningTimerRef.current = setTimeout(() => setShowExpiryWarning(true), msUntilWarning);
    } else if (msUntilExpiry > 0) {
      // Already within warning window — show immediately
      setShowExpiryWarning(true);
    }

    if (msUntilExpiry > 0) {
      expiredTimerRef.current = setTimeout(() => {
        setShowExpiryWarning(false);
        setIsSessionExpired(true);
      }, msUntilExpiry);
    }
  }, [clearTimers]);

  // Register onSessionExpired callback (API 401 path)
  useEffect(() => {
    setOnSessionExpired(() => {
      setShowExpiryWarning(false);
      setIsSessionExpired(true);
    });
    return () => setOnSessionExpired(null);
  }, []);

  // Listen for token refreshed via apiFetch auto-refresh
  useEffect(() => {
    function handleTokenRefreshed(e: Event) {
      const expiresAt = (e as CustomEvent<{ expiresAt: number }>).detail.expiresAt;
      setShowExpiryWarning(false);
      scheduleTimers(expiresAt);
    }
    window.addEventListener('ut:token-refreshed', handleTokenRefreshed);
    return () => window.removeEventListener('ut:token-refreshed', handleTokenRefreshed);
  }, [scheduleTimers]);

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    const expiresAt = localStorage.getItem('ut_expires_at');
    if (token) {
      if (expiresAt) scheduleTimers(Number(expiresAt));
      api.auth.getMe()
        .then((profile: any) => setUser({ id: profile.id, email: profile.email, name: profile.name, role: profile.role }))
        .catch(() => {
          localStorage.removeItem('ut_token');
          localStorage.removeItem('ut_refresh_token');
          localStorage.removeItem('ut_expires_at');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    return clearTimers;
  }, [scheduleTimers, clearTimers]);

  async function login(email: string, password: string) {
    const data = await api.auth.login({ email, password }) as any;
    localStorage.setItem('ut_token', data.token);
    localStorage.setItem('ut_refresh_token', data.refreshToken);
    localStorage.setItem('ut_expires_at', String(data.expiresAt));
    scheduleTimers(data.expiresAt);
    try {
      const profile: any = await api.auth.getMe();
      setUser({ id: profile.id, email: profile.email, name: profile.name, role: profile.role });
    } catch {
      localStorage.removeItem('ut_token');
      localStorage.removeItem('ut_refresh_token');
      localStorage.removeItem('ut_expires_at');
      throw new Error('Profil tidak ditemukan. Silakan daftar ulang atau hubungi admin.');
    }
  }

  async function logout() {
    clearTimers();
    await api.auth.logout().catch(() => {});
    localStorage.removeItem('ut_token');
    localStorage.removeItem('ut_refresh_token');
    localStorage.removeItem('ut_expires_at');
    setUser(null);
    setShowExpiryWarning(false);
    setIsSessionExpired(false);
  }

  async function stayLoggedIn() {
    const refreshToken = localStorage.getItem('ut_refresh_token');
    if (!refreshToken) {
      setShowExpiryWarning(false);
      setIsSessionExpired(true);
      return;
    }
    try {
      const data = await api.auth.refresh({ refreshToken });
      localStorage.setItem('ut_token', data.token);
      localStorage.setItem('ut_refresh_token', data.refreshToken);
      localStorage.setItem('ut_expires_at', String(data.expiresAt));
      setShowExpiryWarning(false);
      scheduleTimers(data.expiresAt);
    } catch {
      setShowExpiryWarning(false);
      setIsSessionExpired(true);
    }
  }

  function dismissExpired() {
    setIsSessionExpired(false);
    clearTimers();
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, showExpiryWarning, isSessionExpired, login, logout, stayLoggedIn, dismissExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
