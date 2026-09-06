'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api';

const TOKEN_KEY = 'te_admin_token';

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Token lives in localStorage, which is readable by any script on the origin.
 * Acceptable for an internal console; move to an httpOnly cookie if this ever
 * faces the public internet with real consequences behind it.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(TOKEN_KEY);
    } catch {
      /* storage blocked */
    }

    if (!stored) {
      setReady(true);
      return;
    }

    // Verify rather than trust: an expired token should log the user out.
    apiFetch<AdminUser & { sub: string }>('/auth/me', { token: stored })
      .then((payload) => {
        setToken(stored);
        setUser({ id: payload.sub ?? payload.id, email: payload.email, name: payload.name });
      })
      .catch(() => {
        try {
          window.localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* ignore */
        }
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    try {
      window.localStorage.setItem(TOKEN_KEY, res.token);
    } catch {
      /* ignore */
    }
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ token, user, ready, login, logout }), [token, user, ready, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
