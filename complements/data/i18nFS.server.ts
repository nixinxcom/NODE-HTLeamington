// NO "use client"

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

function fromValue(v: any): any {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v)  return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v)  return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v)    return null;
  if ("arrayValue" in v)   return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v)     return fromFields(v.mapValue.fields || {});
  return undefined;
}

function fromFields(fields: Record<string, FirestoreValue> | undefined): any {
  const out: any = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = fromValue(v);
  return out;
}

async function fetchDocREST(projectId: string, apiKey: string, coll: string, id: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${coll}/${encodeURIComponent(id)}?key=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null; // 404 u otro => null
    const json = await res.json();
    const flat = fromFields(json?.fields || {});
    if (flat && typeof flat === "object") {
      // Acepta { dict: {...} } o plano
      const maybeDict = (flat.dict && typeof flat.dict === "object") ? flat.dict : flat;
      return maybeDict as Record<string, any>;
    }
    return {};
  } catch {
    return null;
  }
}

/**
 * Devuelve el diccionario i18n desde Firestore via REST.
 * Prioridad de doc: <locale largo> → <locale corto> → {}.
 * Ej.: "en-US" → "en"
 */
export async function getI18nEffectiveServer(locale: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "i18n_global";
  if (!projectId || !apiKey || !locale) return {};
  const shortId = (locale.split("-")[0] || "").trim(); // "en"
  const longId  = locale;                               // "en-US"

  // 1) corto
  if (shortId) {
    const shortDoc = await fetchDocREST(projectId, apiKey, I18N_COLL, shortId);
    if (shortDoc) return shortDoc;
  }
  // 2) largo (back-compat temporal)
  const longDoc = await fetchDocREST(projectId, apiKey, I18N_COLL, longId);
  if (longDoc) return longDoc;

  return {};
}