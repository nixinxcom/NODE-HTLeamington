//app\providers\FdvProvider.tsx
"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";
import { PANEL_SCHEMAS } from "@/complements/factory/panelSchemas";
import type { PanelSchema } from "@/complements/factory/panelSchema.types";

type FdvRecord = Record<string, unknown>;

type FdvContextValue = {
  /** Datos cargados desde Firestore, indexados por schema.id (branding, settings, etc.) */
  data: FdvRecord;
  loading: boolean;
  error?: string;
};

const FdvContext = createContext<FdvContextValue>({
  data: {},
  loading: true,
  error: undefined,
});

type Props = { children: React.ReactNode };

/**
 * Provider maestro de Fuente De Verdad (FDV).
 *
 * Pipeline:
 *   PanelSchema (core, isProvider:true) → Firestore → FdvProvider → APP
 *
 * - Lee todos los PanelSchema con isProvider = true.
 * - Por cada uno hace getDoc(FbDB, fsCollection, fsDocId).
 * - Coloca los resultados bajo data[schema.id].
 *
 * Ej: data["branding"] ← doc Providers/Branding
 */
export default function FdvProvider({ children }: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<FdvRecord>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(undefined);

      try {
        const providerSchemas: PanelSchema[] = Object.values(PANEL_SCHEMAS).filter(
          (s) => s.isProvider,
        );

        const results: FdvRecord = {};

        for (const schema of providerSchemas) {
          try {
            const ref = doc(FbDB, schema.fsCollection, schema.fsDocId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              results[schema.id] = snap.data();
            } else {
              results[schema.id] = undefined;
            }
          } catch (err) {
            console.warn(
              "[FdvProvider] error leyendo",
              schema.fsCollection,
              schema.fsDocId,
              err,
            );
            // No revienta todo, sólo deja ese schema undefined
          }
        }

        if (!cancelled) {
          setData(results);
        }
      } catch (e) {
        console.error("[FdvProvider] error general cargando FDV:", e);
        if (!cancelled) {
          setError("load");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
    }),
    [data, loading, error],
  );

  return (
    <FdvContext.Provider value={value}>
      {children}
    </FdvContext.Provider>
  );
}

/** Hook base para leer el contexto completo */
export function useFdvData(): FdvContextValue {
  return useContext(FdvContext);
}

/**
 * Hook genérico por panelId:
 *
 *   const { value: branding } = useProvider("branding");
 *
 * El id viene 100% del core (schema.id), no se define en el nodo.
 */
export function useProvider<T = unknown>(
  id: string,
): {
  value: T | null;
  loading: boolean;
  error?: string;
} {
  const { data, loading, error } = useFdvData();

  return {
    value: (data[id] as T) ?? null,
    loading,
    error,
  };
}
