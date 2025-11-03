// complements/data/brandingFS.ts
import React from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FbDB } from '@/app/lib/services/firebase';
import { deepMerge } from '@/complements/utils/deep-merge';
import FM from '@/complements/i18n/FM';

import type iBranding from '@/app/lib/branding/interface';
import baseBranding from '@/seeds/branding';           // TSX con <FM/>

import { resolveFMToStrings } from '@/complements/utils/resolveFM';
// ⛔️ Quitar este import (cliente):
// import { getI18nEffective } from '@/complements/data/i18nFS';

type UIString = string | JSX.Element; // acepta <FM /> o string por defecto

export type BrandingFS = iBranding<UIString>;

const GLOBAL_PATH =
  process.env.NEXT_PUBLIC_BRANDING_DOC_PATH || 'branding/default';

const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
const isArr = Array.isArray;
const isFM = (node: any) => React.isValidElement(node) && (node as any).type === FM;

// ---------- Firestore readers/writers (cliente) ----------
export async function loadBrandingGlobal(): Promise<Partial<BrandingFS> | undefined> {
  try {
    const snap = await getDoc(doc(FbDB, GLOBAL_PATH));
    return snap.exists() ? (snap.data() as Partial<BrandingFS>) : undefined;
  } catch {
    return undefined;
  }
}
export async function saveBrandingGlobal(partial: Partial<BrandingFS>) {
  await setDoc(doc(FbDB, GLOBAL_PATH), partial, { merge: true });
}

// ---------- Effective (PWA): TSX+JSON (pres FM) → FS → resolver FM ----------
export async function getBrandingEffectivePWA(
  locale: string
): Promise<iBranding<UIString>> {
  const isServer = typeof window === 'undefined';

  let g: Partial<BrandingFS> | undefined;
  let dict: Record<string, string> = {};

  if (isServer) {
    // SERVER: usa REST helpers
    const [{ loadBrandingGlobalServer }, { getI18nEffectiveServer }] = await Promise.all([
      import('@/complements/data/brandingFS.server'),
      import('@/complements/data/i18nFS.server'),
    ]);
    [g, dict] = await Promise.all([
      loadBrandingGlobalServer(),
      getI18nEffectiveServer(locale),
    ]);
  } else {
    // CLIENTE: SDK web
    const [{ getI18nEffective }] = await Promise.all([
      import('@/complements/data/i18nFS'),
    ]);
    g = await loadBrandingGlobal();
    dict = await getI18nEffective(locale);
  }

  // 1) Base: solo TSX (con <FM/>)
  const base = baseBranding as iBranding;

  // 2) FS pisa base (estructura global)
  const merged = deepMerge(base, g) as iBranding;

  type UIString = string | JSX.Element; // acepta <FM /> o string por defecto

  // 3) Resolver <FM/> con el diccionario efectivo
  return resolveFMToStrings<iBranding, iBranding<UIString>>(merged, dict)
}

// ---------- Admin RAW (si lo usas en UI; conserva <FM/>) ----------
export async function getBrandingAdminRaw(locale: string): Promise<iBranding> {
  const isServer = typeof window === 'undefined';
  let g: Partial<BrandingFS> | undefined;

  if (isServer) {
    const { loadBrandingGlobalServer } = await import('@/complements/data/brandingFS.server');
    g = await loadBrandingGlobalServer();
  } else {
    g = await loadBrandingGlobal();
  }
  const base = baseBranding as iBranding;
  return deepMerge(base, g) as iBranding;
}

// (Compat) util simple: convierte <FM/> a string usando un diccionario
export function stringifyBrandingWithDict<T = any>(node: any, dict: Record<string, string>): T {
  const walk = (n: any): any => {
    if (Array.isArray(n)) return n.map(walk);
    if (isFM(n)) {
      const props = (n as any).props || {};
      const id = props.id as string | undefined;
      const def = props.defaultMessage as string | undefined;
      return id && dict[id] !== undefined ? dict[id] : (def ?? '');
    }
    if (n && typeof n === 'object') {
      const out: any = {};
      for (const k of Object.keys(n)) out[k] = walk(n[k]);
      return out;
    }
    return n;
  };
  return walk(node) as T;
}

