// app/lib/i18n/store.ts (solo idea base; ajusta a tu repo)
"use client";

import { FbDB } from "@/app/lib/services/firebase";
import { DEFAULT_LOCALES } from "./utils";
import { doc, getDoc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import metaGlobalSeed from "@/seeds/meta.global.json";
import metaSiteSeed   from "@/seeds/meta.site.json";
import metaPagesSeed  from "@/seeds/meta.pages.json";

/** Locales soportados (si existe settings/localization, úsalo; si no, fallback) */
export async function loadSupportedLocales(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(FbDB, "settings", "localization"));
    const data = snap.exists() ? (snap.data() as any) : null;
    const arr = Array.isArray(data?.supported) ? data.supported : null;
    return arr && arr.length ? arr : DEFAULT_LOCALES;
  } catch {
    return DEFAULT_LOCALES;
  }
}

/* ───────────────────────── GLOBAL (FMs) ───────────────────────── */
const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "Providers";

export async function loadFMsGlobal(locale: string): Promise<Record<string, string>> {
  const ref = doc(FbDB, I18N_COLL, locale);
  const snap = await getDoc(ref);
  return (snap.exists() ? (snap.data() as Record<string, string>) : {}) || {};
}

export async function saveFMsGlobal(locale: string, partial: Record<string, string>) {
  const ref = doc(FbDB, I18N_COLL, locale);
  await setDoc(ref, partial, { merge: true });
}

export async function deleteFMsGlobalFields(locale: string, fields: string[]) {
  if (!fields?.length) return;
  const ref = doc(FbDB, I18N_COLL, locale);
  // Firestore limita ~500 writes por update; vamos en trozos por seguridad
  const chunk = <T,>(arr: T[], size = 400) => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };
  for (const group of chunk(fields, 400)) {
    const payload: any = {};
    for (const k of group) payload[k] = deleteField();
    try {
      await updateDoc(ref, payload);
    } catch {
      /* noop (si no existe el doc aún) */
    }
  }
}

/* ───────────────────────── PÁGINAS ─────────────────────────
 * Colección: i18n_pages
 * Doc por routeKey: i18n_pages/{routeKey}
 * Subcolección por locale: i18n_pages/{routeKey}/locales/{locale}
 *    -> { "home.welcome": "Hola", ... }
 */
export async function loadFMsPage(routeKey: string, locale: string): Promise<Record<string, string>> {
  try {
    const key = routeKey?.trim() || "home";
    const loc = locale?.trim() || "es";
    const ref = doc(FbDB, "i18n_pages", key, "locales", loc);
    const snap = await getDoc(ref);
    return (snap.exists() ? (snap.data() as Record<string, string>) : {}) || {};
  } catch {
    return {};
  }
}

export async function saveFMsPage(routeKey: string, locale: string, partial: Record<string, string>) {
  const key = routeKey?.trim() || "home";
  const loc = locale?.trim() || "es";
  const ref = doc(FbDB, "i18n_pages", key, "locales", loc);
  await setDoc(ref, partial, { merge: true });
}

/** Borrar campos en i18n_pages/{routeKey}/locales/{locale} (aditivo) */
export async function deleteFMsPageFields(routeKey: string, locale: string, fields: string[]) {
  if (!fields?.length) return;
  const key = routeKey?.trim() || "home";
  const loc = locale?.trim() || "es";
  const ref = doc(FbDB, "i18n_pages", key, "locales", loc);
  const chunk = <T,>(arr: T[], size = 400) => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };
  for (const group of chunk(fields, 400)) {
    const payload: any = {};
    for (const k of group) payload[k] = deleteField();
    try {
      await updateDoc(ref, payload);
    } catch {
      /* noop */
    }
  }
}

/* ───────────────────────── SITE ───────────────────────── */
export async function loadFMsSite(locale: string): Promise<Record<string, string>> {
  try {
    const ref = doc(FbDB, "i18n_site", locale);
    const snap = await getDoc(ref);
    return (snap.exists() ? (snap.data() as Record<string, string>) : {}) || {};
  } catch {
    return {};
  }
}

export async function saveFMsSite(locale: string, partial: Record<string, string>) {
  const ref = doc(FbDB, "i18n_site", locale);
  await setDoc(ref, partial, { merge: true });
}

/** Borrar campos en i18n_site/{locale} (existente) */
export async function deleteFMsSiteFields(locale: string, fields: string[]) {
  if (!fields?.length) return;
  const ref = doc(FbDB, "i18n_site", locale);
  const chunk = <T,>(arr: T[], size = 400) => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };
  for (const group of chunk(fields, 400)) {
    const payload: any = {};
    for (const k of group) payload[k] = deleteField();
    await updateDoc(ref, payload);
  }
}

export type MetaRecord = Record<string, string | null>;

// Helpers locales (no pisan nada externo)
const _safeStr = (x: unknown) => (typeof x === "string" ? x : "");
const _mergeSeedFS = <T extends object>(seed?: Partial<T> | null, fs?: Partial<T> | null): T =>
  ({ ...(seed || {}), ...(fs || {}) } as T);

// Refs
function metaGlobalRef(locale: string) {
  return doc(FbDB, "meta_global", locale || "es");
}
function metaSiteRef(locale: string) {
  return doc(FbDB, "meta_site", locale || "es");
}
function metaPageRef(routeKey: string, locale: string) {
  return doc(FbDB, "meta_pages", _safeStr(routeKey) || "home", "locales", locale || "es");
}

/** Carga META GLOBAL con merge: seeds ➜ Firestore (FS override) */
export async function loadMetaGlobal(locale: string): Promise<MetaRecord> {
  // seeds: { default?: MetaRecord, es?: MetaRecord, en?: MetaRecord, ... }
  const seed: MetaRecord =
    (metaGlobalSeed as any)?.[locale] ??
    (metaGlobalSeed as any)?.default ??
    {};
  const snap = await getDoc(metaGlobalRef(locale));
  const fs = (snap.exists() ? (snap.data() as MetaRecord) : {}) || {};
  return _mergeSeedFS<MetaRecord>(seed, fs);
}

/** Carga META SITE con merge: seeds ➜ Firestore (FS override) */
export async function loadMetaSite(locale: string): Promise<MetaRecord> {
  // seeds: { default?: MetaRecord, es?: MetaRecord, en?: MetaRecord, ... }
  const seed: MetaRecord =
    (metaSiteSeed as any)?.[locale] ??
    (metaSiteSeed as any)?.default ??
    {};
  const snap = await getDoc(metaSiteRef(locale));
  const fs = (snap.exists() ? (snap.data() as MetaRecord) : {}) || {};
  return _mergeSeedFS<MetaRecord>(seed, fs);
}

/** Carga META PAGE con merge: seeds ➜ Firestore (FS override)
 * seeds/meta.pages.json:
 * {
 *   "home": { "es": {...}, "en": {...} },
 *   "blog": { "es": {...} }
 * }
 */
export async function loadMetaPage(routeKey: string, locale: string): Promise<MetaRecord> {
  const seed: MetaRecord =
    (metaPagesSeed as any)?.[_safeStr(routeKey)]?.[locale] ?? {};
  const snap = await getDoc(metaPageRef(routeKey, locale));
  const fs = (snap.exists() ? (snap.data() as MetaRecord) : {}) || {};
  return _mergeSeedFS<MetaRecord>(seed, fs);
}

// Guardar (FS manda)
export async function saveMetaGlobal(locale: string, partial: Partial<MetaRecord>) {
  await setDoc(metaGlobalRef(locale), partial, { merge: true });
}
export async function saveMetaSite(locale: string, partial: Partial<MetaRecord>) {
  await setDoc(metaSiteRef(locale), partial, { merge: true });
}
export async function saveMetaPage(routeKey: string, locale: string, partial: Partial<MetaRecord>) {
  await setDoc(metaPageRef(routeKey, locale), partial, { merge: true });
}

// Borrar campos (aditivo y tolerante a docs inexistentes)
export async function deleteMetaGlobalFields(locale: string, fields: string[]) {
  if (!fields?.length) return;
  const payload: Record<string, any> = {};
  fields.forEach((f) => (payload[f] = deleteField()));
  try {
    await updateDoc(metaGlobalRef(locale), payload);
  } catch {
    await setDoc(metaGlobalRef(locale), {}, { merge: true });
  }
}
export async function deleteMetaSiteFields(locale: string, fields: string[]) {
  if (!fields?.length) return;
  const payload: Record<string, any> = {};
  fields.forEach((f) => (payload[f] = deleteField()));
  try {
    await updateDoc(metaSiteRef(locale), payload);
  } catch {
    await setDoc(metaSiteRef(locale), {}, { merge: true });
  }
}
export async function deleteMetaPageFields(routeKey: string, locale: string, fields: string[]) {
  if (!fields?.length) return;
  const payload: Record<string, any> = {};
  fields.forEach((f) => (payload[f] = deleteField()));
  try {
    await updateDoc(metaPageRef(routeKey, locale), payload);
  } catch {
    await setDoc(metaPageRef(routeKey, locale), {}, { merge: true });
  }
}

// Orden de filas del editor de META (independiente del de FMs)
export async function loadMetaOrder(docId = "default"): Promise<string[]> {
  const snap = await getDoc(doc(FbDB, "meta_orders", docId));
  const data = (snap.exists() ? (snap.data() as any) : {}) || {};
  return Array.isArray(data.order) ? data.order : [];
}
export async function saveMetaOrder(order: string[], docId = "default") {
  await setDoc(doc(FbDB, "meta_orders", docId), { order }, { merge: true });
}

// ───────────────────── BRANDING (ADITIVO) ─────────────────────
export type BrandRecord = Record<string, any>;

export async function loadBrandGlobal(locale: string): Promise<BrandRecord> {
  const snap = await getDoc(doc(FbDB, "branding_global", locale));
  return snap.exists() ? (snap.data() as any) : {};
}

export async function loadBrandSite(locale: string): Promise<BrandRecord> {
  const snap = await getDoc(doc(FbDB, "branding_site", locale));
  return snap.exists() ? (snap.data() as any) : {};
}

export async function loadBrandPage(routeKey: string, locale: string): Promise<BrandRecord> {
  const snap = await getDoc(doc(FbDB, "branding_pages", routeKey, "locales", locale));
  return snap.exists() ? (snap.data() as any) : {};
}

export async function saveBrandGlobal(locale: string, rec: BrandRecord) {
  await setDoc(doc(FbDB, "branding_global", locale), rec, { merge: true });
}
export async function saveBrandSite(locale: string, rec: BrandRecord) {
  await setDoc(doc(FbDB, "branding_site", locale), rec, { merge: true });
}
export async function saveBrandPage(routeKey: string, locale: string, rec: BrandRecord) {
  await setDoc(doc(FbDB, "branding_pages", routeKey, "locales", locale), rec, { merge: true });
}

export async function deleteBrandGlobalFields(locale: string, fields: string[]) {
  const payload: any = {};
  fields.forEach((f) => (payload[f] = deleteField()));
  try {
    await updateDoc(doc(FbDB, "branding_global", locale), payload);
  } catch {
    // si no existe, crea vacío para evitar error en UI futura
    await setDoc(doc(FbDB, "branding_global", locale), {}, { merge: true });
  }
}
export async function deleteBrandSiteFields(locale: string, fields: string[]) {
  const payload: any = {};
  fields.forEach((f) => (payload[f] = deleteField()));
  try {
    await updateDoc(doc(FbDB, "branding_site", locale), payload);
  } catch {
    await setDoc(doc(FbDB, "branding_site", locale), {}, { merge: true });
  }
}
export async function deleteBrandPageFields(routeKey: string, locale: string, fields: string[]) {
  const payload: any = {};
  fields.forEach((f) => (payload[f] = deleteField()));
  try {
    await updateDoc(doc(FbDB, "branding_pages", routeKey, "locales", locale), payload);
  } catch {
    await setDoc(doc(FbDB, "branding_pages", routeKey, "locales", locale), {}, { merge: true });
  }
}

// Orden (opcional)
export async function saveBrandOrder(order: string[]) {
  await setDoc(doc(FbDB, "branding_orders", "order"), {
    fields: order,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
export async function loadBrandOrder(): Promise<string[]> {
  const snap = await getDoc(doc(FbDB, "branding_orders", "order"));
  return snap.exists() ? ((snap.data() as any)?.fields ?? []) : [];
}
