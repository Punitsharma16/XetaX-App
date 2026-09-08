import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';
import { storage } from '@/lib/storage';

/** AuthUserDto as the backend returns it (both flag spellings tolerated). */

/** POST /auth/v1/login → TokenResponse */

const Ctx = createContext(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
};

/** Thrown by login() when the account still has to confirm its email. */
export class EmailNotVerifiedError extends Error {
  email;
  constructor(email) {super('EMAIL_NOT_VERIFIED');this.email = email;}
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [server, setServerState] = useState(API_BASE_URL);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const savedServer = await storage.getJson(storage.SERVER_KEY);
      if (savedServer) {api.setBaseUrl(savedServer);setServerState(savedServer);}
      const [t, u] = await Promise.all([storage.getToken(), storage.getJson(storage.USER_KEY)]);
      // An expired access token is fine — the API layer refreshes it on the first 401.
      if (t && u) {setUser(u);setStatus('signedIn');} else
      setStatus('signedOut');
    })();
  }, []);

  const clear = useCallback(async () => {
    await Promise.all([storage.setToken(null), storage.setRefreshToken(null), storage.setJson(storage.USER_KEY, null)]);
    setUser(null);setStatus('signedOut');
  }, []);

  const logout = useCallback(async () => {
    try {await api.post('auth/v1/logoutRefreshToken', {});} catch {/* best effort */}
    await clear();
    router.replace('/(auth)/login');
  }, [clear, router]);

  useEffect(() => {
    api.setUnauthorizedHandler(() => {clear().then(() => router.replace('/(auth)/login'));});
    return () => api.setUnauthorizedHandler(null);
  }, [clear, router]);

  const acceptTokens = useCallback(async (t) => {
    await Promise.all([
    storage.setToken(t.accessToken),
    storage.setRefreshToken(t.refreshToken),
    storage.setJson(storage.USER_KEY, t.userDto)]
    );
    setUser(t.userDto);setStatus('signedIn');
    router.replace('/(tabs)');
  }, [router]);

  const login = useCallback(async (email, password) => {
    const e = email.trim().toLowerCase();
    try {
      const res = await api.post('auth/v1/login', { email: e, password });
      if (!res?.accessToken || !res?.userDto) throw new Error('Incorrect email or password.');
      await acceptTokens(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.body?.message === 'EMAIL_NOT_VERIFIED') {
        throw new EmailNotVerifiedError(e);
      }
      if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 400)) {
        throw new Error('Incorrect email or password.');
      }
      throw err;
    }
  }, [acceptTokens]);

  const setServer = useCallback(async (url) => {
    api.setBaseUrl(url);
    setServerState(url);
    await storage.setJson(storage.SERVER_KEY, url);
  }, []);

  const refreshUser = useCallback(async (patch) => {
    setUser((u) => {
      const next = u ? { ...u, ...patch } : u;
      if (next) storage.setJson(storage.USER_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ status, user, server, login, acceptTokens, logout, setServer, refreshUser }),
  [status, user, server, login, acceptTokens, logout, setServer, refreshUser]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
