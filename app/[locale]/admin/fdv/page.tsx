// app/[locale]/admin/fdv/page.tsx
"use client";

import React, { useMemo } from "react";
import { useFdvData } from "@/app/providers/FdvProvider";
import { PANEL_SCHEMAS } from "@/complements/factory/panelSchemas";

function jsonPretty(obj: unknown) {
  return JSON.stringify(obj, null, 2);
}

export default function AdminFdvPage() {
  const { data, loading, error } = useFdvData();

  // Paneles marcados para agentes (core)
  const agentPanelIds = useMemo(
    () =>
      Object.values(PANEL_SCHEMAS)
        .filter((s) => s.isAgentFDV)
        .map((s) => s.id),
    []
  );

  // Lo que realmente ve el agente como `context`
  const agentContext = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const id of agentPanelIds) {
      if (data[id] !== undefined) {
        out[id] = data[id];
      }
    }
    return out;
  }, [data, agentPanelIds]);

  return (
    <main style={{ padding: "1rem", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        FDV debug
      </h1>

      {loading && <p>Loading FDV…</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* 1) FDV cruda tal cual viene del provider (sin duplicar secciones) */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
          FDV data (raw)
        </h2>
        <pre
          style={{
            background: "#111",
            color: "#eee",
            padding: "1rem",
            borderRadius: 8,
            overflowX: "auto",
            maxHeight: 400,
          }}
        >
          {jsonPretty(data)}
        </pre>
      </section>

      {/* 2) Contexto que ve el agente (sólo schemas con isAgentFDV:true) */}
      <section>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
          Agent context (lo que se envía a /api/ai-chat)
        </h2>
        <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          Paneles usados como contexto de agentes (isAgentFDV):{" "}
          {agentPanelIds.length ? agentPanelIds.join(", ") : "—"}
        </p>
        <pre
          style={{
            background: "#111",
            color: "#eee",
            padding: "1rem",
            borderRadius: 8,
            overflowX: "auto",
            maxHeight: 400,
          }}
        >
          {jsonPretty(agentContext)}
        </pre>
      </section>
    </main>
  );
}
