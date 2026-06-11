'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, setOnSessionExpired } from './api';
import { STORAGE_KEYS } from './constants';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  is_salut?: boolean;
  is_salut_active?: boolean;
  salut_status?: 'none' | 'pending' | 'approved' | 'rejected' | 'expired';
  is_verified?: boolean;
  // Backend-derived flags (Phase 1 additive)
  is_member?: boolean;
  is_pending?: boolean;
  shipping_address_display?: string | null;
  shipping_address_lines?: string[];
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
  const esRef = useRef<EventSource | null>(null);

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
      // Already within warning window - show immediately
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
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    if (token) {
      if (expiresAt) scheduleTimers(Number(expiresAt));
      api.auth.getMe()
        .then(profile => setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          is_salut: profile.is_salut ?? false,
          is_salut_active: profile.is_salut_active ?? false,
          salut_status: profile.salut_status ?? 'none',
          is_verified: profile.is_verified ?? false,
          is_member: profile.is_member,
          is_pending: profile.is_pending,
          shipping_address_display: profile.shipping_address_display,
          shipping_address_lines: profile.shipping_address_lines,
        }))
        .catch(() => {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH);
          localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    return clearTimers;
  }, [scheduleTimers, clearTimers]);

  // SSE: subscribe to real-time SALUT status updates while logged in
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/status?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as {
          is_salut: boolean;
          is_salut_active: boolean;
          salut_status: AuthUser['salut_status'];
        };
        setUser(prev => {
          if (!prev) return prev;
          if (prev.is_salut === data.is_salut && prev.is_salut_active === data.is_salut_active && prev.salut_status === data.salut_status) return prev;
          return { ...prev, ...data };
        });
      } catch { /* ignore malformed events */ }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(email: string, password: string) {
    const data = await api.auth.login({ email, password });
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.REFRESH, data.refreshToken);
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(data.expiresAt));
    scheduleTimers(data.expiresAt);
    try {
      const profile = await api.auth.getMe();
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        is_salut: profile.is_salut ?? false,
        is_salut_active: profile.is_salut_active ?? false,
        salut_status: profile.salut_status ?? 'none',
        is_verified: profile.is_verified ?? false,
        is_member: profile.is_member,
        is_pending: profile.is_pending,
        shipping_address_display: profile.shipping_address_display,
        shipping_address_lines: profile.shipping_address_lines,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH);
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
      throw new Error('Profil tidak ditemukan. Silakan daftar ulang atau hubungi admin.');
    }
  }

  async function logout() {
    clearTimers();
    await api.auth.logout().catch(() => {});
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    setUser(null);
    setShowExpiryWarning(false);
    setIsSessionExpired(false);
  }

  async function stayLoggedIn() {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH);
    if (!refreshToken) {
      setShowExpiryWarning(false);
      setIsSessionExpired(true);
      return;
    }
    try {
      const data = await api.auth.refresh({ refreshToken });
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.REFRESH, data.refreshToken);
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(data.expiresAt));
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
