import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, authHeaders } from './api';

// GET a JSON path on our API. Unwraps `{ data }` envelopes (pass { raw: true } to keep the whole body, e.g. when
// pagination sits beside `data`); throws on any non-2xx.
export async function getJson(path, signal, { raw = false } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders(), signal });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return raw ? data : (data?.data ?? data);
}

// Send JSON (POST/PATCH/PUT/DELETE). Throws an Error carrying the server's message when the request fails.
export async function sendJson(method, path, body, signal) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.errors?.[0]?.errors?.[0] ? ` (${data.errors[0].errors[0]})` : '';
    const error = new Error(`${data?.message || `Request failed (${res.status})`}${detail}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

// One async resource: [{ status: 'loading' | 'ready' | 'error', data }, reload].
// Previous data stays available while a reload is in flight so panels keep their frame.
export function useResource(loader, deps) {
  const [state, setState] = useState({ status: 'loading', data: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ status: 'loading', data: s.data }));
    loader(controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((err) => {
        if (err?.name !== 'AbortError') setState({ status: 'error', data: null });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return [state, useCallback(() => setNonce((n) => n + 1), [])];
}
