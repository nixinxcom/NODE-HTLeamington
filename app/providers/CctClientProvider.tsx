'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type CctPayload = {
  v: number;
  cid: string;
  caps: string[];
  iat: number;
  exp: number;
  rev: number;
  ps?: number; // periodStart (unix seconds)
  pe?: number; // periodEnd   (unix seconds)
};

type CctCtxValue = {
  loading: boolean;
  token: string | null;
  payload: CctPayload | null;
  lastError: string | null;
  hasCap: (cap: string) => boolean;
  refresh: (opts?: { force?: boolean }) => Promise<void>;
};

const CctCtx = createContext<CctCtxValue | null>(null);

// refresco 30s antes de expirar (lo que pediste)
const REFRESH_SKEW_SEC = 30;
// si quedan más de 45s, consideramos el token “suficientemente vivo” para no pedir otro
const CACHE_OK_SEC = 45;

function b64urlDecodeToJson(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const json = atob(b64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getClientId(): string {
  // En tu repo ya existe NEXT_PUBLIC_TENANT (scripts/dev-tenant.js)
  // También tolera NEXT_PUBLIC_NIXINX_TENANT_ID por compat
  return (
    (process.env.NEXT_PUBLIC_TENANT || process.env.NEXT_PUBLIC_NIXINX_TENANT_ID || '').trim()
  );
}

function getIssuerBase(): string {
  // Embedded: mismo origin => ""
  // NX extirpado: pones https://nixinx.org
  return (process.env.NEXT_PUBLIC_CCT_ISSUER_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
}

function getDesiredTtlSec(): number {
  // Por default 6h. Puedes moverlo con env sin tocar código.
  const raw = Number(process.env.NEXT_PUBLIC_CCT_TTL_SEC ?? 21600);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 21600;
}

export function CctClientProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<CctPayload | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (p: CctPayload) => {
      clearTimer();
      const nowMs = Date.now();
      const refreshAtMs = (p.exp - REFRESH_SKEW_SEC) * 1000;
      const delayMs = Math.max(1000, refreshAtMs - nowMs); // mínimo 1s
      timerRef.current = window.setTimeout(() => {
        // refresh silencioso (no “parpadea” loading)
        void refresh({ force: true });
      }, delayMs) as unknown as number;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearTimer],
  );

  const refresh = useCallback(
    async (opts?: { force?: boolean }) => {
      const force = !!opts?.force;

      // dedupe: si ya hay refresh en curso, no dispares otro
      if (inFlightRef.current) return inFlightRef.current;

      const run = (async () => {
        const cid = getClientId();
        if (!cid) {
          setToken(null);
          setPayload(null);
          setLastError('missing_clientId');
          setLoading(false);
          return;
        }

        const storageKey = `nixinx.cct.${cid}`;
        const nowSec = Math.floor(Date.now() / 1000);

        // 1) si ya tengo token en memoria y sigue vivo, no hago nada (a menos que sea force)
        if (!force && token && payload?.exp && payload.exp > nowSec + CACHE_OK_SEC) {
          setLoading(false);
          return;
        }

        // 2) cache local (sessionStorage)
        if (!force) {
          try {
            const cached = sessionStorage.getItem(storageKey);
            if (cached) {
              const parsed = JSON.parse(cached) as { token: string; payload: CctPayload };
              if (parsed?.token && parsed?.payload?.exp && parsed.payload.exp > nowSec + CACHE_OK_SEC) {
                setToken(parsed.token);
                setPayload(parsed.payload);
                setLastError(null);
                setLoading(false);
                scheduleRefresh(parsed.payload);
                return;
              }
            }
          } catch {
            // ignore
          }
        }

        // 3) pedir token al issuer
        setLoading(true);
        setLastError(null);

        const base = getIssuerBase();
        const ttlSec = getDesiredTtlSec();
        const url = `${base}/api/cct/issue?clientId=${encodeURIComponent(cid)}&ttlSec=${ttlSec}`;

        let res: Response;
        try {
          res = await fetch(url, { method: 'GET', cache: 'no-store' });
        } catch {
          setToken(null);
          setPayload(null);
          setLastError('network_error');
          setLoading(false);
          return;
        }

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // si no viene JSON, igual tratamos el status
        }

        if (!res.ok) {
          // típico: 403 con { ok:false, error:"contract_expired" } o "blocked"
          const err = (data?.error as string) || `http_${res.status}`;
          setToken(null);
          setPayload(null);
          setLastError(err);
          setLoading(false);
          try {
            sessionStorage.removeItem(storageKey);
          } catch {}
          return;
        }

        const t = data?.token as string | undefined;
        const p = t ? (b64urlDecodeToJson(t) as CctPayload | null) : null;

        if (!t || !p || !Array.isArray(p.caps)) {
          setToken(null);
          setPayload(null);
          setLastError('bad_token');
          setLoading(false);
          return;
        }

        setToken(t);
        setPayload(p);
        setLastError(null);
        setLoading(false);

        try {
          sessionStorage.setItem(storageKey, JSON.stringify({ token: t, payload: p }));
        } catch {
          // ignore
        }

        scheduleRefresh(p);
      })();

      inFlightRef.current = run;
      try {
        await run;
      } finally {
        inFlightRef.current = null;
      }
    },
    [payload, scheduleRefresh, token],
  );

  useEffect(() => {
    void refresh();
    return () => clearTimer();
  }, [refresh, clearTimer]);

  // si el usuario vuelve a la pestaña y el token está por morir, refrescamos
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload?.exp && payload.exp <= nowSec + CACHE_OK_SEC) {
        void refresh({ force: true });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [payload?.exp, refresh]);

  const hasCap = useCallback(
    (cap: string) => {
      if (!payload?.caps?.length) return false;
      return payload.caps.includes(cap);
    },
    [payload],
  );

  const value = useMemo<CctCtxValue>(
    () => ({ loading, token, payload, lastError, hasCap, refresh }),
    [loading, token, payload, lastError, hasCap, refresh],
  );

  return <CctCtx.Provider value={value}>{children}</CctCtx.Provider>;
}

export function useCct() {
  const ctx = useContext(CctCtx);
  if (!ctx) throw new Error('useCct must be used within CctClientProvider');
  return ctx;
}
