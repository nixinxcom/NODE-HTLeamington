// app/providers/useAgentFdv.ts
"use client";

import { useMemo } from "react";
import { useFdvData } from "@/app/providers/FdvProvider";
import { PANEL_SCHEMAS } from "@/complements/factory/panelSchemas";

/**
 * Devuelve los datos FDV correspondientes a los paneles marcados con isAgentFDV:true
 * o a los `sources` solicitados (si se pasa un array concreto).
 */
export function useAgentFdv(sources?: string[]) {
  const { data, loading, error } = useFdvData();

  const context = useMemo(() => {
    const out: Record<string, unknown> = {};
    const schemas = Object.values(PANEL_SCHEMAS).filter(
      (s) => s.isAgentFDV && (!sources || sources.includes(s.id))
    );

    for (const s of schemas) {
      if (data[s.id] !== undefined) {
        out[s.id] = data[s.id];
      }
    }

    return out;
  }, [data, sources?.join("|")]);

  return { context, loading, error };
}
