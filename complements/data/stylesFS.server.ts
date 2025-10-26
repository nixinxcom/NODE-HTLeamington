// complements/data/stylesFS.server.ts
"use server";

/**
 * Carga el documento de estilos desde Firestore usando la REST API.
 * Esta función corre en el servidor (sin SDK web).
 */
const API = "https://firestore.googleapis.com/v1";
const DB = "(default)";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY;

const COLL =
  process.env.NEXT_PUBLIC_STYLES_COLL || "styles";

const DOC_ID =
  process.env.NEXT_PUBLIC_STYLES_DOC || "global";

/** Convierte Firestore Value → JS */
function fireToJs(v: any): any {
  if (!v || typeof v !== "object") return v;
  const k = Object.keys(v)[0];
  if (k === "nullValue") return null;
  if (k === "booleanValue") return !!v.booleanValue;
  if (k === "integerValue") return Number(v.integerValue);
  if (k === "doubleValue") return Number(v.doubleValue);
  if (k === "timestampValue") return v.timestampValue;
  if (k === "stringValue") return String(v.stringValue ?? "");
  if (k === "bytesValue") return v.bytesValue;
  if (k === "referenceValue") return v.referenceValue;
  if (k === "geoPointValue") return v.geoPointValue;
  if (k === "arrayValue") return (v.arrayValue?.values ?? []).map(fireToJs);
  if (k === "mapValue") return fireFieldsToJs(v.mapValue?.fields ?? {});
  return undefined;
}
function fireFieldsToJs(fields: Record<string, any>): any {
  const out: any = {};
  for (const [k, v] of Object.entries(fields || {})) {
    out[k] = fireToJs(v);
  }
  return out;
}

export async function loadStylesGlobalServer(): Promise<any | null> {
  if (!PROJECT_ID) return null;
  const url = `${API}/projects/${PROJECT_ID}/databases/${DB}/documents/${COLL}/${DOC_ID}${API_KEY ? `?key=${API_KEY}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    // 404 cuando el doc aún no existe es normal → devolvemos null
    return null;
  }
  const data = await res.json();
  if (data && data.fields) {
    return fireFieldsToJs(data.fields);
  }
  return null;
}
