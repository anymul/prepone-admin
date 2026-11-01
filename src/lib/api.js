// src/lib/api.js
import axios from 'axios';
import { getToken } from './session';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export const authHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
  ...extra,
});

// Only http(s) URLs are allowed into href/src. Blocks javascript:, data: and vbscript: URLs that could
// come from a compromised or hand-edited database record. Returns '' when the URL is not safe.
export const safeHttpUrl = (url, base) => {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url, base || window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch {
    return '';
  }
};

const apiHref = () => {
  try { return new URL(API_BASE_URL, window.location.origin).href.replace(/\/+$/, ''); } catch { return ''; }
};

const isApiUrl = (url) => {
  try {
    const target = new URL(url, window.location.origin).href;
    const base = apiHref();
    return Boolean(base) && (target === base || target.startsWith(`${base}/`));
  } catch {
    return false;
  }
};

const isLoginRequest = (url) => /\/auth\/login(\?|$)/.test(url);

const notifyUnauthorized = (sentToken) => {
  // Ignore a late 401 from a request made with an old token (e.g. just after signing in again).
  if (sentToken && sentToken !== getToken()) return;
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
};

let installed = false;

// Single place for the cross-cutting HTTP behaviour so each page does not need to repeat it:
//  - attach the bearer token to calls to our own API when the page did not
//  - treat a 401 from the API as "session over" (the AuthProvider signs out and returns to /login)
// Pages keep using plain fetch()/axios; calls to other origins are left alone.
export function installHttpGuards() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (!url || !isApiUrl(url)) return nativeFetch(input, init);

    const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
    const token = getToken();
    if (token && !headers.has('Authorization') && !isLoginRequest(url)) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const sentToken = (headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');

    const res = await nativeFetch(input, { ...init, headers });
    if (res.status === 401 && !isLoginRequest(url)) notifyUnauthorized(sentToken);
    return res;
  };

  axios.interceptors.request.use((config) => {
    const url = axios.getUri(config);
    if (isApiUrl(url) && !isLoginRequest(url)) {
      const token = getToken();
      if (token && !config.headers?.Authorization) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const url = err?.config ? axios.getUri(err.config) : '';
      if (err?.response?.status === 401 && isApiUrl(url) && !isLoginRequest(url)) {
        const sent = String(err.config.headers?.Authorization || '').replace(/^Bearer\s+/i, '');
        notifyUnauthorized(sent);
      }
      return Promise.reject(err);
    }
  );
}

export const api = {
  async get(path, opts = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: authHeaders(opts.headers),
      ...opts,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GET ${path} failed with status ${res.status}`);
    }
    return res.json();
  },
  async post(path, body, opts = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(opts.headers),
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `POST ${path} failed with status ${res.status}`);
    }
    return res.json();
  },
  async patch(path, body, opts = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: authHeaders(opts.headers),
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `PATCH ${path} failed with status ${res.status}`);
    }
    return res.json();
  },
  async delete(path, opts = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: authHeaders(opts.headers),
      ...opts,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `DELETE ${path} failed with status ${res.status}`);
    }
    return res.json();
  },
};

