'use client'

// app/lib/sdk/facultiesClient.ts

export type FacultyKey =
  | "adminPanel"
  | "website"
  | "agentAI"
  | "ecommerce"
  | "booking"
  | "socialmedia"
  | "sellsplatforms"
  | "products"
  | "services"
  | "contact"
  | "settings"
  | "branding"
  | "styles"
  | "maps"
  | "notifications"
  | "paypal"
  | "stripe"
  | "adsense";

type CheckResponse = {
  ok: boolean;
  tenantId?: string | null;
  faculties: Record<string, boolean>;
};

// Decide a qué endpoint llamar:
// - Localhost / puertos de dev => usa el endpoint interno del repo: /api/faculties/check
// - Dominio real + NIXINX_CORE_URL definido => llama al Core remoto.
function getFacultiesApiBase(): { baseUrl: string; mode: "local" | "core" } {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port;

    const isLocalHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local");

    const isDevPort = 
        port === "3000" ||
        port === "3001" ||
        port === "3002" ||
        port === "3003" ||
        port === "3004" ||
        port === "3005" ||
        port === "3006" ||
        port === "3007" ||
        port === "3008" ||
        port === "3009" ||
        port === "30010" ||
        port === "30011" ||
        port === "30012" ||
        port === "30013" ||
        port === "30014" ||
        port === "30015" ||
        port === "30016" ||
        port === "30017" ||
        port === "30018" ||
        port === "30019" ||
        port === "30020" ||
        port === "30021" ||
        port === "30022" ||
        port === "30023" ||
        port === "30024" ||
        port === "30025" ||
        port === "30026" ||
        port === "30027" ||
        port === "30028" ||
        port === "30029" ||
        port === "30030" ||
        port === "5173";

    if (isLocalHost || isDevPort) {
      // Modo desarrollo: usamos el endpoint interno (lee seeds/settings del propio repo)
      return { baseUrl: "", mode: "local" };
    }
  }

  // Producción / dominio real:
  // Si definimos NIXINX_CORE_URL, usamos ese Core central.
  const core = process.env.NEXT_PUBLIC_NIXINX_CORE_URL;
  if (core) {
    return { baseUrl: core.replace(/\/+$/, ""), mode: "core" };
  }

  // Fallback seguro: si no hay CORE_URL, seguir usando el endpoint local.
  return { baseUrl: "", mode: "local" };
}

export async function fetchFaculties(
  topics: FacultyKey[]
): Promise<Record<FacultyKey, boolean>> {
  const { baseUrl, mode } = getFacultiesApiBase();

  const url =
    mode === "local"
      ? "/api/faculties/check"
      : `${baseUrl}/api/faculties/check`;

  // En modo core: le pasamos quién soy (dominio) para que el Core mire su propia BD.
  const clientId =
    typeof window !== "undefined" ? window.location.hostname : undefined;

  const body: any = { topics };
  if (mode === "core" && clientId) {
    body.clientId = clientId;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(mode === "core" && clientId
        ? { "x-nixinx-client-id": clientId }
        : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.warn("[facultiesClient] check failed", mode, res.status);
    const out = {} as Record<FacultyKey, boolean>;
    for (const t of topics) out[t] = false; // falla cerrado
    return out;
  }

  const json = (await res.json()) as CheckResponse;
  const out = {} as Record<FacultyKey, boolean>;

  for (const t of topics) {
    out[t] = !!json.faculties?.[t];
  }

  return out;
}

export async function canUseFaculty(key: FacultyKey): Promise<boolean> {
  const res = await fetchFaculties([key]);
  return !!res[key];
}
