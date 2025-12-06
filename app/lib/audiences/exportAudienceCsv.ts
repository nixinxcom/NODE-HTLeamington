// app/lib/audiences/exportAudienceCsv.ts
"use client";

import { getFunctions, httpsCallable } from "firebase/functions";

type ExportAudienceMembersPayload = {
  audienceId: string;
};

type ExportAudienceMembersResponse = {
  csv: string;
  fileName: string;
  rows: number;
};

/**
 * Pequeño helper para obtener una instancia de Functions
 * usando la app por defecto (mismo patrón que FbDB pero sin wrapper).
 */
let _functionsInstance: ReturnType<typeof getFunctions> | null = null;

function getFunctionsInstance() {
  if (!_functionsInstance) {
    _functionsInstance = getFunctions();
  }
  return _functionsInstance;
}

/**
 * Llama a la callable `exportAudienceMembersToCsv` (Cloud Functions)
 * y dispara la descarga del CSV en el navegador.
 *
 * Uso típico en un componente client:
 *
 *   await exportAudienceCsv(audienceId);
 *
 * También devuelve el contenido por si quieres hacer algo extra
 * (mostrar toast con número de filas, etc.).
 */
export async function exportAudienceCsv(
  audienceId: string,
): Promise<ExportAudienceMembersResponse> {
  if (!audienceId) {
    throw new Error("exportAudienceCsv: audienceId es requerido");
  }

  const functions = getFunctionsInstance();
  const fn = httpsCallable<
    ExportAudienceMembersPayload,
    ExportAudienceMembersResponse
  >(functions, "exportAudienceMembersToCsv");

  const res = await fn({ audienceId });
  const data = res.data;

  // En SSR no hay window/document: sólo devolvemos los datos
  if (typeof window === "undefined") {
    return data;
  }

  try {
    const blob = new Blob([data.csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = data.fileName || `audience-${audienceId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[exportAudienceCsv] Error al descargar CSV", err);
    // No reventamos, igual devolvemos data para que el caller decida
  }

  return data;
}
