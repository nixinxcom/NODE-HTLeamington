// NO "use client"

// ---------- Firestore wire types ----------
type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

// ---------- Firestore wire -> plain ----------
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

// ---------- Firestore REST helper ----------
async function fetchDocREST(projectId: string, apiKey: string, coll: string, id: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${coll}/${encodeURIComponent(id)}?key=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null; // 404 u otro => null
    const json = await res.json();
    const flat = fromFields(json?.fields || {});
    if (flat && typeof flat === "object") {
      const maybeDict = (flat.dict && typeof flat.dict === "object") ? flat.dict : flat;
      return maybeDict as Record<string, any>;
    }
    return {};
  } catch {
    return null;
  }
}

// ---------- Utils ----------
function shortOf(locale?: string): "es"|"en"|"fr" {
  const v = String(locale || "en").toLowerCase();
  if (v.startsWith("es")) return "es";
  if (v.startsWith("fr")) return "fr";
  return "en";
}

// ---------- NUEVO: inyección opcional de seeds por tenant ----------
export type TenantSeedResolver = (args: { locale: string; tenant?: string }) =>
  | Promise<Record<string,string>>
  | Record<string,string>;

// Resolver por defecto → vacío (no acopla a la app)
let _tenantSeedResolver: TenantSeedResolver | null = null;

/** Permite que la APP (NX) inyecte cómo cargar los seeds de i18n por tenant. */
export function setTenantSeedResolver(fn: TenantSeedResolver) {
  _tenantSeedResolver = fn;
}
/** (opcional) limpiar el resolver */
export function clearTenantSeedResolver() {
  _tenantSeedResolver = null;
}

// ---------- API estable: FS > seeds ----------
export async function getI18nEffectiveServer(locale: string, tenant?: string) {
  const short = shortOf(locale);

  // 1) Seeds del cliente (inyectados por la app si desea)
  let seeds: Record<string,string> = {};
  if (_tenantSeedResolver) {
    try {
      const maybe = await _tenantSeedResolver({ locale: short, tenant });
      if (maybe && typeof maybe === "object") seeds = maybe;
    } catch { /* ignore */ }
  }

  // 2) Firestore pisa seeds (RDD: FS > seeds)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "Providers";

  if (projectId && apiKey) {
    let fsDoc: Record<string,string> = (await fetchDocREST(projectId, apiKey, I18N_COLL, short)) || {};
    if (!Object.keys(fsDoc).length) {
      fsDoc = (await fetchDocREST(projectId, apiKey, I18N_COLL, locale)) || {};
    }
    return { ...seeds, ...fsDoc }; // FS override
  }

  return seeds;
}
