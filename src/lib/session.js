// Session storage helpers. The token key is shared with pages that still read it directly,
// so keep 'token' / 'user' as the storage keys.
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const LAST_ACTIVE_KEY = 'lastActive';
const NOTICE_KEY = 'authNotice';

export const SESSION_KEYS = { TOKEN_KEY, USER_KEY, LAST_ACTIVE_KEY };

const safe = (fn, fallback = null) => {
  try { return fn(); } catch { return fallback; }
};

export const getToken = () => safe(() => localStorage.getItem(TOKEN_KEY));

export const parseJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// NOTE: this only reads the payload. The backend is the only party that can verify the signature,
// so everything here is UX / defence in depth, never an authorization decision.
export const isExpired = (payload, skewSeconds = 30) =>
  !payload || typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now() + skewSeconds * 1000;

// The admin portal is for PrepOne admins only. CoachOne tokens (source === 'coachone') never qualify.
export const isAdminPayload = (payload) =>
  Boolean(payload) && payload.role === 'admin' && payload.source !== 'coachone';

export const saveSession = (token, user) => {
  safe(() => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  });
};

export const clearSession = () => {
  safe(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    localStorage.removeItem('userRole');
  });
};

// Re-derives the user from the stored token each time; the stored 'user' blob is never trusted on its own.
export const loadSession = () => {
  const token = getToken();
  if (!token) return null;
  const payload = parseJwt(token);
  if (isExpired(payload) || !isAdminPayload(payload)) {
    clearSession();
    return null;
  }
  return payload;
};

export const touchActivity = () => safe(() => localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())));
export const getLastActive = () => Number(safe(() => localStorage.getItem(LAST_ACTIVE_KEY), 0)) || 0;

// Message shown on the login page after a forced sign-out (expired, idle, rejected token).
// Read it with peek during render (idempotent, StrictMode-safe) and clear it in an effect.
export const setAuthNotice = (message) => safe(() => sessionStorage.setItem(NOTICE_KEY, message));
export const peekAuthNotice = () => safe(() => sessionStorage.getItem(NOTICE_KEY) || '', '');
export const clearAuthNotice = () => safe(() => sessionStorage.removeItem(NOTICE_KEY));
