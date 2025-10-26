// app/lib/styles/server.ts
import "server-only";
import { getFirestore } from "firebase-admin/firestore";
// Asegura que el Admin SDK esté inicializado (side-effect import)
import "@/app/lib/firebaseAdmin";

import { stylesSeedDoc as STYLES_SEED } from "@/app/lib/styles/styles";

export type Styles = Record<string, any>;

// ---------- Utils ----------
const isArr = Array.isArray;
const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const clone = <T,>(v: T): T => {
  try {
    // Node 18+ / Next runtime
    // @ts-ignore
    return structuredClone(v);
  } catch {
    return JSON.parse(JSON.stringify(v));
  }
};

/** Profundo con preferencia por FS (b gana; arrays reemplazan) */
const mergePreferFS = (a: any, b: any): any => {
  if (b === undefined) return a;
  if (a === undefined) return b;
  if (isArr(a) && isArr(b)) return b.slice();
  if (isRecord(a) && isRecord(b)) {
    const out: any = { ...(a as any) };
    for (const k of Object.keys(b)) out[k] = mergePreferFS((a as any)[k], (b as any)[k]);
    return out;
  }
  return b;
};

// ---------- Config ----------
const DEFAULT_PATH = process.env.NEXT_PUBLIC_STYLES_DOC_PATH || "styles/default";
const isValidDocPath = (p: string) => p.split("/").filter(Boolean).length % 2 === 0;

// ---------- API ----------
/**
 * Carga styles efectivo (seed TS → Firestore con prioridad FS)
 * para SSR/Route Handlers.
 *
 * Regla: Efectivo = (TSX) → FS     (FS > TSX)
 */
export async function loadStylesSSR(docPath?: string): Promise<Styles> {
  const path = docPath || DEFAULT_PATH;
  const seed: Styles = clone((STYLES_SEED ?? {}) as Styles);

  // Si el path no es "collection/doc", devuelve seed
  if (!isValidDocPath(path)) return seed;

  try {
    const db = getFirestore();
    const snap = await db.doc(path).get();
    if (!snap.exists) return seed;
    const fsData = snap.data() as Styles;
    return mergePreferFS(seed, fsData);
  } catch {
    // Si Firestore falla/no está configurado, regresa seed
    return seed;
  }
}

export function getStylesDocPath(): string {
  return DEFAULT_PATH;
}
