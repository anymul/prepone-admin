import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { API_BASE_URL, UNAUTHORIZED_EVENT } from './api';
import {
  SESSION_KEYS,
  clearSession,
  getLastActive,
  isAdminPayload,
  isExpired,
  loadSession,
  parseJwt,
  saveSession,
  setAuthNotice,
  touchActivity,
} from './session';

const AuthContext = createContext(null);

// Sign out after this many minutes without any interaction (in any tab). 0 disables it.
const IDLE_TIMEOUT_MS = Number(import.meta.env.VITE_IDLE_TIMEOUT_MIN ?? 60) * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 15 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession());
  const loading = false; // session is restored synchronously from storage
  const lastWrite = useRef(0);

  const logout = useCallback((reason) => {
    clearSession();
    if (typeof reason === 'string' && reason) setAuthNotice(reason);
    setUser(null);
  }, []);

  const login = async (email, password) => {
    try {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const cleanPassword = password ? password.trim() : '';

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) return { success: false, message: 'Too many attempts. Please wait a few minutes and try again.' };
        return { success: false, message: data.message || data.errors?.[0] || 'Invalid credentials' };
      }

      const payload = parseJwt(data.token);
      if (!payload || isExpired(payload)) {
        return { success: false, message: 'Received an invalid session from the server.' };
      }
      // The API accepts any PrepOne account at /auth/login; this portal is admin-only.
      if (!isAdminPayload(payload)) {
        return { success: false, message: 'This account does not have admin access.' };
      }

      saveSession(data.token, payload);
      setUser(payload);
      return { success: true };
    } catch {
      return { success: false, message: 'Network or server error' };
    }
  };

  // Server said 401: the token is expired, revoked or invalid.
  useEffect(() => {
    const onUnauthorized = () => logout('Your session has expired. Please sign in again.');
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  // Keep tabs in sync: signing out (or in) in one tab applies to the others.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== SESSION_KEYS.TOKEN_KEY && e.key !== null) return;
      setUser(loadSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Token expiry + inactivity watchdog while signed in.
  useEffect(() => {
    if (!user) return undefined;

    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite.current > ACTIVITY_WRITE_THROTTLE_MS) {
        lastWrite.current = now;
        touchActivity();
      }
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));

    const timer = setInterval(() => {
      if (!loadSession()) {
        logout('Your session has expired. Please sign in again.');
        return;
      }
      if (IDLE_TIMEOUT_MS > 0 && Date.now() - (getLastActive() || Date.now()) > IDLE_TIMEOUT_MS) {
        logout('You were signed out after a period of inactivity.');
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      clearInterval(timer);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
