// complements/data/brandingFS.server.ts
// NO "use client"
import type { BrandingFS } from "./brandingFS";

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { nullValue: null };

function fromValue(v: any): any {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return !!v.booleanValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v) return fromFields(v.mapValue.fields || {});
  return undefined;
}
function fromFields(fields?: Record<string, FirestoreValue>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = fromValue(v);
  return out;
}

export async function loadBrandingGlobalServer(): Promise<
  Partial<BrandingFS> | undefined
> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
  const path = process.env.NEXT_PUBLIC_BRANDING_DOC_PATH || "branding/default";
  const [coll, doc] = path.split("/");
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${coll}/${doc}?key=${apiKey}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return undefined;
    const json = (await res.json()) as any;
    const fields = json?.fields as Record<string, FirestoreValue> | undefined;
    if (!fields) return undefined;
    return fromFields(fields) as Partial<BrandingFS>;
  } catch {
    return undefined;
  }
}
