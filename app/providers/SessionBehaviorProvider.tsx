"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { FbAuth, FbDB } from "@/app/lib/services/firebase";
import { DEFAULT_TENANT, resolveTenantFromHost } from "@/app/lib/tenant/resolve";
import type {
  SessionBehavior,
  SessionEvent,
  SessionUtmInfo,
} from "@/app/lib/audiences/sessionTypes";

export interface SessionBehaviorAPI {
  track: (event: SessionEvent) => void;
  flush: () => Promise<void>;
}

export const SessionBehaviorContext =
  createContext<SessionBehaviorAPI | null>(null);

type Props = {
  locale?: string;
  children: ReactNode;
};

function createSessionId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID() as string;
    }
  } catch {
    // ignoramos y caemos al fallback
  }
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

const DEVICE_KEY = "nx_deviceId";

export function SessionBehaviorProvider({ locale, children }: Props) {
  // ID lógico de la sesión (se renueva en cada flush)
  const sessionIdRef = useRef<string>(createSessionId());
  // Buffer de eventos en memoria
  const eventsRef = useRef<SessionEvent[]>([]);
  // DeviceId persistente (no requiere login)
  const deviceIdRef = useRef<string | null>(null);
  // UTM capturada al inicio de la sesión
  const utmRef = useRef<SessionUtmInfo | null>(null);
  // Evitar flush concurrente
  const isFlushingRef = useRef(false);

  // Inicializar deviceId y UTM una sola vez
  useEffect(() => {
    if (typeof window === "undefined") return;

    // deviceId: lee o crea
    try {
      let deviceId = window.localStorage.getItem(DEVICE_KEY);
      if (!deviceId) {
        deviceId = createSessionId();
        window.localStorage.setItem(DEVICE_KEY, deviceId);
      }
      deviceIdRef.current = deviceId;
    } catch (e) {
      console.warn("[SessionBehavior] no se pudo leer/guardar deviceId:", e);
      deviceIdRef.current = null;
    }

    // UTM: lee parámetros de la URL actual
    try {
      const url = new URL(window.location.href);
      const p = url.searchParams;

      const utmId = p.get("utm_id") ?? undefined;
      const utmSource = p.get("utm_source") ?? undefined;
      const utmMedium = p.get("utm_medium") ?? undefined;
      const utmCampaign = p.get("utm_campaign") ?? undefined;
      const utmTerm = p.get("utm_term") ?? undefined;
      const utmContent = p.get("utm_content") ?? undefined;

      const hasAny =
        utmId ||
        utmSource ||
        utmMedium ||
        utmCampaign ||
        utmTerm ||
        utmContent;

      if (hasAny) {
        utmRef.current = {
          id: utmId,
          source: utmSource,
          medium: utmMedium,
          campaign: utmCampaign,
          term: utmTerm,
          content: utmContent,
        };
      } else {
        utmRef.current = null;
      }
    } catch (e) {
      console.warn("[SessionBehavior] no se pudo leer UTM de la URL:", e);
      utmRef.current = null;
    }
  }, []);

  // Registrar eventos en memoria
  const track = useCallback((event: SessionEvent) => {
    eventsRef.current.push(event);
  }, []);

  // Enviar una sola sesión a Firestore
  const flush = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!FbDB) return;

    const events = eventsRef.current;
    if (!events.length) return;

    if (isFlushingRef.current) return;
    isFlushingRef.current = true;

    // Resolvemos tenant según host actual
    const host = window.location?.host;
    const tenantId = resolveTenantFromHost(host) || DEFAULT_TENANT;
    const user = FbAuth.currentUser ?? null;

    const userId = user?.uid ?? null;
    const deviceId = deviceIdRef.current ?? null;
    const userOrDeviceId = userId || deviceId || null;
    const utm = utmRef.current ?? null;

    const payload: SessionBehavior = {
      sessionId: sessionIdRef.current,
      tenantId,
      userId,
      deviceId,
      userOrDeviceId,
      locale,
      utm,
      events: [...events],
    };

    try {
      const colRef = collection(FbDB, "nx_audiences", tenantId, "sessions");
      await addDoc(colRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[SessionBehavior] flush() failed:", e);
    } finally {
      // Reseteamos buffer e iniciamos nueva sesión lógica
      eventsRef.current = [];
      sessionIdRef.current = createSessionId();
      isFlushingRef.current = false;
    }
  }, [locale]);

  // Auto-flush SOLO antes de descargar la página
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeUnload = () => {
      // no esperamos el Promise, solo lo disparamos
      flush();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [flush]);

  const value = useMemo<SessionBehaviorAPI>(
    () => ({ track, flush }),
    [track, flush],
  );

  return (
    <SessionBehaviorContext.Provider value={value}>
      {children}
    </SessionBehaviorContext.Provider>
  );
}

export default SessionBehaviorProvider;
