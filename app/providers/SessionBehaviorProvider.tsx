"use client";

import React, {
  createContext,
  useCallback,
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

export function SessionBehaviorProvider({ locale, children }: Props) {
  // ID lógico de la sesión
  const sessionIdRef = useRef<string>(createSessionId());
  // Buffer de eventos en memoria
  const eventsRef = useRef<SessionEvent[]>([]);

  const track = useCallback((event: SessionEvent) => {
    // no hacemos I/O aquí, solo acumulamos
    eventsRef.current.push(event);
  }, []);

  const flush = useCallback(async () => {
    if (typeof window === "undefined") return;
    const events = eventsRef.current;
    if (!events.length) return;

    // Resolvemos tenant según host actual
    const host = window.location?.host;
    const tenantId = resolveTenantFromHost(host) || DEFAULT_TENANT;
    const user = FbAuth.currentUser ?? null;

    const payload: SessionBehavior = {
      sessionId: sessionIdRef.current,
      tenantId,
      userId: user?.uid,
      locale,
      events: [...events],
    };

    try {
      const colRef = collection(FbDB, "nx_audiences", tenantId, "sessions");
      await addDoc(colRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      // No rompemos la UX por analíticas
      console.warn("[SessionBehavior] flush() failed:", e);
    } finally {
      // Reseteamos buffer e iniciamos nueva sesión lógica
      eventsRef.current = [];
      sessionIdRef.current = createSessionId();
    }
  }, [locale]);

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

// Default export para usarlo fácil en layout.tsx
export default SessionBehaviorProvider;
