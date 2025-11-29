// app/providers/BootGate.tsx
"use client";

import React from "react";
import { useFdvData } from "@/app/providers/FdvProvider";

type Props = { children: React.ReactNode };

export default function BootGate({ children }: Props) {
  const { data, loading, error, status } = useFdvData();

  // Mientras FDV no esté listo, mostramos pantalla de arranque
  if (loading || status !== "ready") {
    const branding = (data?.branding ?? {}) as any;

    const appName =
      branding?.appName ||
      branding?.company?.name ||
      process.env.NEXT_PUBLIC_APP_NAME ||
      "Cargando…";

    const bg = branding?.colors?.background || "#000000";
    const fg = branding?.colors?.primary || "#ffffff";

    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: bg, color: fg }}
      >
        <h1 className="text-2xl font-semibold mb-2">{appName}</h1>
        <p className="text-sm opacity-70">Preparando tu experiencia…</p>
        <div className="mt-4 h-8 w-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-red-200">
        <h1 className="text-xl font-bold mb-2">
          No se pudo cargar la configuración.
        </h1>
        <p className="text-sm opacity-70">
          Revisa los docs en Providers/* y vuelve a intentar.
        </p>
      </main>
    );
  }

  // FDV listo: ahora sí montamos ContextProvider + app
  return <>{children}</>;
}
