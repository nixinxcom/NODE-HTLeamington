// app/lib/firestoreRest.ts
// Drop-in REST helpers para Firestore v1 (documents)
// Requiere FIREBASE_PROJECT_ID en el entorno.

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string;
if (!PROJECT_ID) {
  // No lanzamos excepción aquí para no romper el build;
  // los métodos fallarán con mensaje claro si se invocan sin PROJECT_ID.
  // console.warn('FIREBASE_PROJECT_ID no definido — fsGetDoc/fsSetDoc lo necesitarán.');
}

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/* ------------------- Encode/Decode helpers (JS <-> Firestore Value) ------------------- */
function encodeValue(v: any): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  }
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  // object/map
  return { mapValue: { fields: encodeMap(v) } };
}

function encodeMap(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, val] of Object.entries(obj ?? {})) {
    out[k] = encodeValue(val);
  }
  return out;
}

function decodeValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue?.values ?? []).map(decodeValue);
  if ('mapValue' in val) return decodeMap(val.mapValue?.fields ?? {});
  return undefined;
}

function decodeMap(fields: Record<string, any>): any {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields ?? {})) {
    out[k] = decodeValue(v);
  }
  return out;
}

function decodeDoc(json: any): any {
  if (!json) return {};
  if (json.fields) return decodeMap(json.fields);
  // si fue create/patch y regresó el doc completo
  if (json?.document?.fields) return decodeMap(json.document.fields);
  return {};
}

/* ----------------------------------- API ----------------------------------- */
export async function fsGetDoc(opts: {
  col: string;
  id: string;
  idToken?: string; // opcional; útil si la regla requiere auth
}): Promise<any> {
  if (!PROJECT_ID) throw new Error('FIREBASE_PROJECT_ID no está definido');
  const { col, id, idToken } = opts;
  const url = `${BASE}/${encodeURIComponent(col)}/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
    cache: 'no-store',
  });

  // 👇 único cambio: 404 => null (documento no existe), sin throw
  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`fsGetDoc ${res.status}: ${t}`);
  }

  const json = await res.json();
  return decodeDoc(json);
}


/**
 * set (merge) con REST v1
 * - usa PATCH /documents/{col}/{id}?updateMask.fieldPaths=...
 * - body: { fields: ... } (formato tipado)
 */
export async function fsSetDoc(opts: {
  col: string;
  id: string;
  data: Record<string, any>;
  idToken: string; // requerido para reglas con request.auth
  merge?: boolean; // default true
}): Promise<any> {
  if (!PROJECT_ID) throw new Error('FIREBASE_PROJECT_ID no está definido');
  const { col, id, data, idToken, merge = true } = opts;

  const path = `${BASE}/${encodeURIComponent(col)}/${encodeURIComponent(id)}`;
  const fields = encodeMap(data);

  // si merge, especificamos updateMask por cada campo de primer nivel
  const keys = Object.keys(data ?? {});
  const qs = merge && keys.length
    ? keys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')
    : ''; // sin máscara reemplaza el doc completo

  const url = qs ? `${path}?${qs}` : path;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields }),
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`fsSetDoc ${res.status}: ${text}`);
  }

  const json = await res.json();
  return decodeDoc(json);
}
