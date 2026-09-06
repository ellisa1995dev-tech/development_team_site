'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from './api';
import { useToast } from '@/components/Toast';

const TOKEN_KEY = 'te_user_token';

export interface SiteUser {
  id: string;
  email: string;
  fullName: string;
  company?: string | null;
}

interface UserAuthState {
  token: string | null;
  user: SiteUser | null;
  ready: boolean;
  isRegistered: boolean;
  register: (input: RegisterInput) => Promise<SiteUser>;
  login: (email: string, password: string) => Promise<SiteUser>;
  logout: () => void;
  /**
   * Gate for actions that need an account. Shows the required "Please register."
   * alert and returns false when the visitor is not signed in.
   */
  requireRegistration: (action: string) => boolean;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  company?: string;
  signupSessionId?: string;
}

const UserAuthContext = createContext<UserAuthState | null>(null);

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked — session lives for this page load only */
  }
}

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SiteUser | null>(null);
  const [ready, setReady] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const { warning, info } = useToast();

  tokenRef.current = token;

  // Verify any stored token rather than trusting it — it may have expired.
  useEffect(() => {
    const stored = readToken();
    if (!stored) {
      setReady(true);
      return;
    }

    apiFetch<SiteUser>('/users/me', { token: stored })
      .then((me) => {
        setToken(stored);
        setUser(me);
      })
      .catch(() => writeToken(null))
      .finally(() => setReady(true));
  }, []);

  // Keep the admin console's "online now" counter accurate while signed in.
  useEffect(() => {
    if (!token) return;

    const ping = () => {
      const current = tokenRef.current;
      if (!current) return;
      apiFetch('/users/heartbeat', { method: 'POST', token: current }).catch(() => undefined);
    };

    ping();
    const timer = window.setInterval(ping, 60_000);
    return () => window.clearInterval(timer);
  }, [token]);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiFetch<{ token: string; user: SiteUser }>('/users/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    writeToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: SiteUser }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    writeToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    writeToken(null);
    setToken(null);
    setUser(null);
    info('Signed out', 'You can sign back in at any time.');
  }, [info]);

  const requireRegistration = useCallback(
    (action: string) => {
      if (tokenRef.current) return true;
      warning('Please register.', `You need a registered account before ${action}.`);
      return false;
    },
    [warning],
  );

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      isRegistered: Boolean(token),
      register,
      login,
      logout,
      requireRegistration,
    }),
    [token, user, ready, register, login, logout, requireRegistration],
  );

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
}

export function useUserAuth(): UserAuthState {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used inside UserAuthProvider');
  return ctx;
}
