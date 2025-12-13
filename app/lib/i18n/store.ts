// app/lib/i18n/store.ts
"use client";

import { FbDB } from "@/app/lib/services/firebase";
import { DEFAULT_LOCALES } from "./utils";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  type DocumentReference,
  type DocumentData,
} from "firebase/firestore";

/* ───────────────────────── helpers ───────────────────────── */

const chunk = <T,>(arr: T[], size = 400) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

async function deleteFields(
  ref: DocumentReference<DocumentData>,
  fields: string[],
  chunkSize = 400
) {
  if (!fields?.length) return;

  for (const group of chunk(fields, chunkSize)) {
    const payload: Record<string, any> = {};
    for (const f of group) payload[f] = deleteField();

    try {
      await updateDoc(ref, payload);
    } catch {
      // si el doc no existe, lo creamos y reintentamos (para que el delete sí suceda)
      await setDoc(ref, {}, { merge: true });
      try {
        await updateDoc(ref, payload);
      } catch {
        // noop: si sigue fallando, no tumbes UI
      }
    }
  }
}

const _safeStr = (x: unknown) => (typeof x === "string" ? x : "");

/* ───────────────────────── Locales soportados ───────────────────────── */

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

/* ───────────────────────── FMs GLOBAL ───────────────────────── */

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
  const ref = doc(FbDB, I18N_COLL, locale);
  await deleteFields(ref, fields, 400);
}

/* ───────────────────────── PÁGINAS (FMs) ───────────────────────── */

const I18N_PAGES_COLL = process.env.NEXT_PUBLIC_I18N_PAGES_COLL || "i18n_pages";

export async function loadFMsPage(routeKey: string, locale: string): Promise<Record<string, string>> {
  try {
    const key = routeKey?.trim() || "home";
    const loc = locale?.trim() || "es";
    const ref = doc(FbDB, I18N_PAGES_COLL, key, "locales", loc);
    const snap = await getDoc(ref);
    return (snap.exists() ? (snap.data() as Record<string, string>) : {}) || {};
  } catch {
    return {};
  }
}

export async function saveFMsPage(routeKey: string, locale: string, partial: Record<string, string>) {
  const key = routeKey?.trim() || "home";
  const loc = locale?.trim() || "es";
  const ref = doc(FbDB, I18N_PAGES_COLL, key, "locales", loc);
  await setDoc(ref, partial, { merge: true });
}

export async function deleteFMsPageFields(routeKey: string, locale: string, fields: string[]) {
  const key = routeKey?.trim() || "home";
  const loc = locale?.trim() || "es";
  const ref = doc(FbDB, I18N_PAGES_COLL, key, "locales", loc);
  await deleteFields(ref, fields, 400);
}

/* ───────────────────────── SITE (FMs) ───────────────────────── */

const I18N_SITE_COLL = process.env.NEXT_PUBLIC_I18N_SITE_COLL || "i18n_site";

export async function loadFMsSite(locale: string): Promise<Record<string, string>> {
  try {
    const ref = doc(FbDB, I18N_SITE_COLL, locale);
    const snap = await getDoc(ref);
    return (snap.exists() ? (snap.data() as Record<string, string>) : {}) || {};
  } catch {
    return {};
  }
}

export async function saveFMsSite(locale: string, partial: Record<string, string>) {
  const ref = doc(FbDB, I18N_SITE_COLL, locale);
  await setDoc(ref, partial, { merge: true });
}

export async function deleteFMsSiteFields(locale: string, fields: string[]) {
  const ref = doc(FbDB, I18N_SITE_COLL, locale);
  await deleteFields(ref, fields, 400);
}

/* ───────────────────────── META (SOLO FIRESTORE) ───────────────────────── */

export type MetaRecord = Record<string, string | null>;

const META_GLOBAL_COLL = process.env.NEXT_PUBLIC_META_GLOBAL_COLL || "meta_global";
const META_SITE_COLL = process.env.NEXT_PUBLIC_META_SITE_COLL || "meta_site";
const META_PAGES_COLL = process.env.NEXT_PUBLIC_META_PAGES_COLL || "meta_pages";

function metaGlobalRef(locale: string) {
  return doc(FbDB, META_GLOBAL_COLL, locale || "es");
}
function metaSiteRef(locale: string) {
  return doc(FbDB, META_SITE_COLL, locale || "es");
}
function metaPageRef(routeKey: string, locale: string) {
  return doc(FbDB, META_PAGES_COLL, _safeStr(routeKey) || "home", "locales", locale || "es");
}

export async function loadMetaGlobal(locale: string): Promise<MetaRecord> {
  const snap = await getDoc(metaGlobalRef(locale));
  return (snap.exists() ? (snap.data() as MetaRecord) : {}) || {};
}

export async function loadMetaSite(locale: string): Promise<MetaRecord> {
  const snap = await getDoc(metaSiteRef(locale));
  return (snap.exists() ? (snap.data() as MetaRecord) : {}) || {};
}

export async function loadMetaPage(routeKey: string, locale: string): Promise<MetaRecord> {
  const snap = await getDoc(metaPageRef(routeKey, locale));
  return (snap.exists() ? (snap.data() as MetaRecord) : {}) || {};
}

export async function saveMetaGlobal(locale: string, partial: Partial<MetaRecord>) {
  await setDoc(metaGlobalRef(locale), partial, { merge: true });
}
export async function saveMetaSite(locale: string, partial: Partial<MetaRecord>) {
  await setDoc(metaSiteRef(locale), partial, { merge: true });
}
export async function saveMetaPage(routeKey: string, locale: string, partial: Partial<MetaRecord>) {
  await setDoc(metaPageRef(routeKey, locale), partial, { merge: true });
}

export async function deleteMetaGlobalFields(locale: string, fields: string[]) {
  await deleteFields(metaGlobalRef(locale), fields, 400);
}
export async function deleteMetaSiteFields(locale: string, fields: string[]) {
  await deleteFields(metaSiteRef(locale), fields, 400);
}
export async function deleteMetaPageFields(routeKey: string, locale: string, fields: string[]) {
  await deleteFields(metaPageRef(routeKey, locale), fields, 400);
}

// Orden de filas del editor de META
export async function loadMetaOrder(docId = "default"): Promise<string[]> {
  const snap = await getDoc(doc(FbDB, "meta_orders", docId));
  const data = (snap.exists() ? (snap.data() as any) : {}) || {};
  return Array.isArray(data.order) ? data.order : [];
}
export async function saveMetaOrder(order: string[], docId = "default") {
  await setDoc(doc(FbDB, "meta_orders", docId), { order }, { merge: true });
}

/* ───────────────────── BRANDING (ADITIVO) ───────────────────── */

export type BrandRecord = Record<string, any>;

const BRAND_GLOBAL_COLL = process.env.NEXT_PUBLIC_BRAND_GLOBAL_COLL || "branding_global";
const BRAND_SITE_COLL = process.env.NEXT_PUBLIC_BRAND_SITE_COLL || "branding_site";
const BRAND_PAGES_COLL = process.env.NEXT_PUBLIC_BRAND_PAGES_COLL || "branding_pages";

export async function loadBrandGlobal(locale: string): Promise<BrandRecord> {
  const snap = await getDoc(doc(FbDB, BRAND_GLOBAL_COLL, locale));
  return snap.exists() ? (snap.data() as any) : {};
}

export async function loadBrandSite(locale: string): Promise<BrandRecord> {
  const snap = await getDoc(doc(FbDB, BRAND_SITE_COLL, locale));
  return snap.exists() ? (snap.data() as any) : {};
}

export async function loadBrandPage(routeKey: string, locale: string): Promise<BrandRecord> {
  const snap = await getDoc(doc(FbDB, BRAND_PAGES_COLL, routeKey, "locales", locale));
  return snap.exists() ? (snap.data() as any) : {};
}

export async function saveBrandGlobal(locale: string, rec: BrandRecord) {
  await setDoc(doc(FbDB, BRAND_GLOBAL_COLL, locale), rec, { merge: true });
}
export async function saveBrandSite(locale: string, rec: BrandRecord) {
  await setDoc(doc(FbDB, BRAND_SITE_COLL, locale), rec, { merge: true });
}
export async function saveBrandPage(routeKey: string, locale: string, rec: BrandRecord) {
  await setDoc(doc(FbDB, BRAND_PAGES_COLL, routeKey, "locales", locale), rec, { merge: true });
}

export async function deleteBrandGlobalFields(locale: string, fields: string[]) {
  await deleteFields(doc(FbDB, BRAND_GLOBAL_COLL, locale), fields, 400);
}
export async function deleteBrandSiteFields(locale: string, fields: string[]) {
  await deleteFields(doc(FbDB, BRAND_SITE_COLL, locale), fields, 400);
}
export async function deleteBrandPageFields(routeKey: string, locale: string, fields: string[]) {
  await deleteFields(doc(FbDB, BRAND_PAGES_COLL, routeKey, "locales", locale), fields, 400);
}

// Orden (opcional)
export async function saveBrandOrder(order: string[]) {
  await setDoc(
    doc(FbDB, "branding_orders", "order"),
    { fields: order, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}
export async function loadBrandOrder(): Promise<string[]> {
  const snap = await getDoc(doc(FbDB, "branding_orders", "order"));
  return snap.exists() ? ((snap.data() as any)?.fields ?? []) : [];
}
