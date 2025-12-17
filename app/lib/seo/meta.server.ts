// app/lib/seo/meta.server.ts
// Seguro en local/prod: usa Admin SDK si hay credenciales, si no cae a Web SDK (read-only).
// Devuelve overrides PARCIALES y sanitizados; Next los mergea con tu SEO base (no destructivo).

import "server-only";
import { cache } from "react";
import type { Metadata } from "next";

// ───────────────────────────── Admin o Web SDK (fallback) ─────────────────────────────
function hasAdminCreds() {
  return Boolean(
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_CLIENT_EMAIL
  );
}

type DbMode = { admin: boolean; db: any };

const getDbMode = cache(async (): Promise<DbMode> => {
  if (hasAdminCreds()) {
    try {
      const { getAdminDb } = await import("@/app/lib/firebaseAdmin");
      return { admin: true, db: getAdminDb() };
    } catch (e) {
      console.warn("[meta.server] Admin SDK no disponible, fallback Web SDK:", e);
    }
  }
  const { FbDB } = await import("@/app/lib/services/firebase");
  return { admin: false, db: FbDB };
});

function adminDocRef(db: any, segments: string[]) {
  let ref: any = db;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (i % 2 === 0) ref = ref.collection(s);
    else ref = ref.doc(s);
  }
  return ref;
}

const readDoc = cache(async (...segments: string[]) => {
  const { admin, db } = await getDbMode();

  // 1) intenta Admin SDK
  if (admin) {
    try {
      const snap = await adminDocRef(db, segments).get();
      return snap.exists ? (snap.data() as Record<string, any>) : {};
    } catch (err) {
      console.warn("[meta.server] Admin read failed -> fallback Web SDK", err);
      // sigue abajo al web fallback
    }
  }

  // 2) fallback Web SDK (requiere reglas allow read)
  try {
    const { doc: webDoc, getDoc: webGetDoc } = await import("firebase/firestore");
    const snap = await webGetDoc(webDoc(db, ...segments));
    return snap.exists() ? (snap.data() as Record<string, any>) : {};
  } catch (err) {
    console.warn("[meta.server] Web read failed -> empty meta", err);
    return {};
  }
});

// ────────────────────────────────── API pública ──────────────────────────────────
export type MetaRecord = Record<string, string | null>;

export const loadMetaGlobalServer = (locale: string) =>
  readDoc("meta_global", locale) as Promise<MetaRecord>;

export const loadMetaSiteServer = (locale: string) =>
  readDoc("meta_site", locale) as Promise<MetaRecord>;

export const loadMetaPageServer = (routeKey: string, locale: string) =>
  readDoc("meta_pages", routeKey, "locales", locale) as Promise<MetaRecord>;

export async function getEffectiveMetaServer(
  routeKey: string,
  locale: string,
  defaults: MetaRecord = {}
): Promise<MetaRecord> {
  const [g, s, p] = await Promise.all([
    loadMetaGlobalServer(locale),
    loadMetaSiteServer(locale),
    loadMetaPageServer(routeKey, locale),
  ]);
  return { ...(defaults || {}), ...(g || {}), ...(s || {}), ...(p || {}) };
}

// ───────────────────────────── Adaptador a Next Metadata ─────────────────────────────
// Tipos válidos y helpers de saneamiento
const OG_TYPES = new Set<string>([
  "website","article","book","profile",
  "music.song","music.album","music.playlist","music.radio_station",
  "video.movie","video.episode","video.tv_show","video.other",
]);
const TW_CARD = new Set<string>(["summary","summary_large_image","app","player"]);
const isNonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export function metaRecordToNext(meta: MetaRecord): Partial<Metadata> {
  const md: Partial<Metadata> = {};

  if (isNonEmpty(meta.title))       md.title = meta.title!;
  if (isNonEmpty(meta.description)) md.description = meta.description!;

  if (isNonEmpty(meta.canonical)) {
    md.alternates = { ...(md.alternates ?? {}), canonical: meta.canonical! };
  }
  if (isNonEmpty(meta.robots)) {
    md.robots = meta.robots as any;
  }

  // — OpenGraph seguro (usamos objetos "any" para evitar choques con tipos Next)
  const ogTitle = isNonEmpty(meta["og:title"]) ? meta["og:title"]! : undefined;
  const ogDesc  = isNonEmpty(meta["og:description"]) ? meta["og:description"]! : undefined;
  const ogType  = isNonEmpty(meta["og:type"]) && OG_TYPES.has(meta["og:type"]!) ? meta["og:type"]! : undefined;
  const ogImg   = isNonEmpty(meta["og:image"]) ? meta["og:image"]! : undefined;

  const og: Record<string, any> = {};
  if (ogTitle) og.title = ogTitle;
  if (ogDesc)  og.description = ogDesc;
  if (ogType)  og.type = ogType;          // ← sin castear a tipos estrechos
  if (ogImg)   og.images = [{ url: ogImg }];

  if (Object.keys(og).length > 0) {
    md.openGraph = { ...(md.openGraph as any ?? {}), ...og } as any;
  }

  // — Twitter seguro (objetos "any" por compatibilidad de tipos)
  const twCard = isNonEmpty(meta["twitter:card"]) && TW_CARD.has(meta["twitter:card"]!)
    ? meta["twitter:card"]!
    : undefined;
  const twTitle = isNonEmpty(meta["twitter:title"]) ? meta["twitter:title"]! : undefined;
  const twDesc  = isNonEmpty(meta["twitter:description"]) ? meta["twitter:description"]! : undefined;
  const twImg   = isNonEmpty(meta["twitter:image"]) ? meta["twitter:image"]! : undefined;

  const tw: Record<string, any> = {};
  if (twCard)  tw.card = twCard;
  if (twTitle) tw.title = twTitle;
  if (twDesc)  tw.description = twDesc;
  if (twImg)   tw.images = [twImg];

  if (Object.keys(tw).length > 0) {
    md.twitter = { ...(md.twitter as any ?? {}), ...tw } as any;
  }

  return md;
}

// ───────────────────────────── Merge profundo ADITIVO ─────────────────────────────
export function deepMerge<T extends Record<string, any>>(a: T, b: T): T {
  const out: any = Array.isArray(a) ? [...a] : { ...a };
  for (const k of Object.keys(b || {})) {
    const v = (b as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge(out[k] || {}, v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}
