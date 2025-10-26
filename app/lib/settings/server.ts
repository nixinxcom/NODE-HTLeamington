import 'server-only';
import React from 'react';
import { getFirestore } from 'firebase-admin/firestore';
import type { SettingsRecord } from '@/app/lib/settings/types'; // ajusta si tu tipo vive en otro archivo

// Seed TSX (puede contener <FM/>)
import * as settingsSeedModule from '@/seeds/settings';

// Resolvedor de FM e i18n (server)
import { resolveFMToStrings } from '@/complements/utils/resolveFM';
import { getI18nEffectiveServer } from '@/complements/data/i18nFS.server';
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

// Tipado flexible para consumo general en SSR
export type Settings = Record<string, any>;

// Helpers
const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
const isArr = Array.isArray;

// merge: Firestore tiene prioridad; arrays se REEMPLAZAN
const mergePreferFS = (a: any, b: any): any => {
  if (b === undefined) return a;
  if (a === undefined) return b;
  if (isArr(a) && isArr(b)) return b.slice();
  if (isObj(a) && isObj(b)) {
    const out: any = { ...a };
    for (const k of Object.keys(b)) out[k] = mergePreferFS(a[k], b[k]);
    return out;
  }
  return b;
};

const DEFAULT_PATH =
  process.env.NEXT_PUBLIC_SETTINGS_DOC_PATH ||
  'settings/default';

const isValidDocPath = (p: string) => p.split('/').filter(Boolean).length % 2 === 0;

// Acepta default | baseSettings | módulo crudo
const pickSeed = (m: any) => (m?.default ?? m?.baseSettings ?? m ?? {}) as Settings;

/**
 * Carga settings efectivo en entorno de servidor (SSR/Route Handlers).
 * Regla: FS > TSX(FM) > TSX
 * - Si hay <FM id="..."> en TSX → usa i18n[locale][id] o defaultMessage.
 * - Si no hay <FM/> → usa el literal del TSX.
 * - Firestore (path) pisa al TSX.
 */
export async function loadSettingsSSR(
  docPath?: string,
  locale?: string
): Promise<Settings> {
  const path = docPath || DEFAULT_PATH;
  const loc =
  locale
  ?? process.env.NEXT_PUBLIC_DEFAULT_LOCALE
  ?? (process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || process.env.LANGUAGE)?.replace('.UTF-8','').replace('_','-')
  ?? Intl.DateTimeFormat().resolvedOptions().locale
  ?? DEFAULT_LOCALE_SHORT;

  // 1) Seed TSX (puede traer <FM/>)
  const tsxSeed = pickSeed(settingsSeedModule);

  // 2) FS pisa todo (si el path es válido)
  let merged = tsxSeed as Settings;
  if (isValidDocPath(path)) {
    try {
      const db = getFirestore();
      const snap = await db.doc(path).get();
      if (snap.exists) {
        const fsData = snap.data() as Settings;
        merged = mergePreferFS(tsxSeed, fsData);
      }
    } catch {
      // si falla FS, dejamos merged = tsxSeed
    }
  }

  // 3) Resolver <FM/> con el diccionario efectivo por locale
  const dict = await getI18nEffectiveServer(loc);
  const effective = resolveFMToStrings<Settings, Settings>(merged, dict);

  return effective;
}

/** Expone el path efectivo por si lo quieres mostrar o loggear */
export function getSettingsDocPath(): string {
  return DEFAULT_PATH;
}

/** Alias de tema según temporada (con defaults) */
export function getSeasonThemeAliases(settings: SettingsRecord | null | undefined) {
  // Si tus claves están anidadas bajo theme.*, cambia a settings?.theme?.seasonLight / seasonDark
  const light = (settings?.seasonLight ?? 'light').toString().trim();
  const dark  = (settings?.seasonDark  ?? 'dark').toString().trim();
  return { light, dark };
}

/** Versión conveniente que lee de FS/seed y devuelve los alias (server) */
export async function loadSeasonThemeAliases(docPath?: string, locale?: string) {
  const s = (await loadSettingsSSR(docPath, locale)) as unknown as SettingsRecord;
  return getSeasonThemeAliases(s);
}
