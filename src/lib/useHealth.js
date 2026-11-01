import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './api';

// Polls the public /health endpoint. state: 'loading' | 'ok' | 'degraded' | 'down'.
// A 503 from the API still carries a JSON body describing what is degraded, so it is read like a 200.
export function useHealth(intervalMs = 60000) {
  const [health, setHealth] = useState({ state: 'loading', data: null, checkedAt: null });

  const check = useCallback(async (signal) => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal });
      const data = await res.json().catch(() => null);
      const state = res.ok && data?.status === 'healthy' ? 'ok' : data ? 'degraded' : 'down';
      setHealth({ state, data, checkedAt: new Date() });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setHealth({ state: 'down', data: null, checkedAt: new Date() });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    check(controller.signal);
    const timer = setInterval(() => check(controller.signal), intervalMs);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [check, intervalMs]);

  return { ...health, refresh: () => check() };
}

export const HEALTH_LABEL = {
  loading: 'Checking API',
  ok: 'API healthy',
  degraded: 'API degraded',
  down: 'API unreachable',
};
