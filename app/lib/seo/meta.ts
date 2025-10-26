// app/lib/seo/meta.ts
import type { Metadata } from "next";
import {
  loadMetaGlobal,
  loadMetaSite,
  loadMetaPage,
  type MetaRecord,
} from "@/app/lib/i18n/store";

/* ──────────────────────────────────────────────────────────
 * Utils
 * ────────────────────────────────────────────────────────── */
type Dict = Record<string, unknown>;

const isStr = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const toStr = (v: unknown): string | undefined =>
  isStr(v) ? v.trim() : undefined;

const toBoolish = (v: unknown): boolean | undefined => {
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return undefined;
};

/** Elimina nulos/objetos vacíos de forma recursiva */
const prune = <T = Dict>(obj: unknown): T | undefined => {
  if (obj == null) return undefined;

  if (Array.isArray(obj)) {
    const arr = obj
      .map((x) => prune(x))
      .filter(
        (x) =>
          !(
            x == null ||
            (typeof x === "object" &&
              !Array.isArray(x) &&
              Object.keys(x as Dict).length === 0)
          )
      );
    return (arr.length ? (arr as unknown as T) : undefined) as T | undefined;
  }

  if (typeof obj === "object") {
    const out: Dict = {};
    for (const [k, v] of Object.entries(obj)) {
      const pv = prune(v);
      if (pv !== undefined) out[k] = pv as unknown;
    }
    return (Object.keys(out).length ? (out as unknown as T) : undefined) as
      | T
      | undefined;
  }

  return obj as T;
};

/* ──────────────────────────────────────────────────────────
 * Coercers: MetaRecord (string/null) → piezas tipadas de Metadata
 * ────────────────────────────────────────────────────────── */
function coerceTwitter(rec?: MetaRecord): Metadata["twitter"] | undefined {
  if (!rec) return undefined;
  const card = toStr(rec["twitter:card"]); // "summary" | "summary_large_image"
  const title = toStr(rec["twitter:title"]);
  const description = toStr(rec["twitter:description"]);
  const images = toStr(rec["twitter:image"]);
  const creator = toStr(rec["twitter:creator"]);
  const site = toStr(rec["twitter:site"]);

  return prune<NonNullable<Metadata["twitter"]>>({
    card,
    title,
    description,
    images: images ? [images] : undefined,
    creator,
    site,
  });
}

function coerceOpenGraph(rec?: MetaRecord): Metadata["openGraph"] | undefined {
  if (!rec) return undefined;
  const ogTitle = toStr(rec["og:title"]);
  const ogDesc = toStr(rec["og:description"]);
  const ogUrl = toStr(rec["og:url"]);
  const ogType = toStr(rec["og:type"]);
  const ogImage = toStr(rec["og:image"]);
  const ogSiteName = toStr(rec["og:site_name"]);
  const ogLocale = toStr(rec["og:locale"]);

  const images = ogImage ? [{ url: ogImage }] : undefined;

  return prune<NonNullable<Metadata["openGraph"]>>({
    title: ogTitle,
    description: ogDesc,
    url: ogUrl,
    type: ogType,
    siteName: ogSiteName,
    locale: ogLocale,
    images,
  });
}

function coerceRobots(rec?: MetaRecord): Metadata["robots"] | undefined {
  if (!rec) return undefined;

  const noindex = toBoolish(rec["noindex"]);
  const nofollow = toBoolish(rec["nofollow"]);
  const index = noindex === true ? false : noindex === false ? true : undefined;
  const follow =
    nofollow === true ? false : nofollow === false ? true : undefined;

  const googleBot: Record<string, string | number | boolean> = {};
  const gIdx = toBoolish(rec["googlebot:index"]);
  const gFoll = toBoolish(rec["googlebot:follow"]);
  if (gIdx !== undefined) googleBot.index = gIdx;
  if (gFoll !== undefined) googleBot.follow = gFoll;

  const gMaxSnippet = toStr(rec["googlebot:max-snippet"]);
  const gMaxImgPrev = toStr(rec["googlebot:max-image-preview"]); // "none" | "standard" | "large"
  const gMaxVidPrev = toStr(rec["googlebot:max-video-preview"]);
  if (gMaxSnippet && !Number.isNaN(Number(gMaxSnippet)))
    googleBot["max-snippet"] = Number(gMaxSnippet);
  if (gMaxImgPrev) googleBot["max-image-preview"] = gMaxImgPrev;
  if (gMaxVidPrev && !Number.isNaN(Number(gMaxVidPrev)))
    googleBot["max-video-preview"] = Number(gMaxVidPrev);

  return prune<NonNullable<Metadata["robots"]>>({
    index,
    follow,
    googleBot: Object.keys(googleBot).length ? googleBot : undefined,
  });
}

function coerceAlternates(
  rec?: MetaRecord
): Metadata["alternates"] | undefined {
  if (!rec) return undefined;
  const canonical = toStr(rec["canonical"]);
  return prune<NonNullable<Metadata["alternates"]>>({
    canonical,
  });
}

function coerceIcons(rec?: MetaRecord): Metadata["icons"] | undefined {
  if (!rec) return undefined;
  const icon = toStr(rec["icon"]);
  const apple = toStr(rec["icon:apple"]);
  return prune<NonNullable<Metadata["icons"]>>({
    icon: icon ? [{ url: icon }] : undefined,
    apple: apple ? [{ url: apple }] : undefined,
  });
}

function coerceSimple(rec?: MetaRecord) {
  if (!rec) return {};
  const titleDefault = toStr(rec["title"]);
  const titleTemplate = toStr(rec["title:template"]);
  const description = toStr(rec["description"]);
  const generator = toStr(rec["generator"]);
  const applicationName = toStr(rec["applicationName"]);
  const creator = toStr(rec["creator"]);
  const publisher = toStr(rec["publisher"]);
  const category = toStr(rec["category"]);
  const referrer = toStr(rec["referrer"]) as Metadata["referrer"]; // Next valida string permitido

  return (
    prune<Partial<Metadata>>({
      title: titleDefault
        ? { default: titleDefault, template: titleTemplate ?? undefined }
        : undefined,
      description,
      generator,
      applicationName,
      creator,
      publisher,
      referrer,
      category,
    }) ?? {}
  );
}

/* ──────────────────────────────────────────────────────────
 * API pública
 * ────────────────────────────────────────────────────────── */

export type PageMetaInput = {
  title?: string | { default: string; template?: string };
  description?: string;
  keywords?: string[];
  alternates?: Metadata["alternates"];
  robots?: Metadata["robots"];
  twitter?: Metadata["twitter"];
  openGraph?: Metadata["openGraph"];
  icons?: Metadata["icons"];
  metadataBase?: string | URL;
  /** Atajo simple para setear la primera imagen OG */
  ogImage?: string;
};

/** Fallbacks/constantes (seguras si no hay envs) */
const FALLBACK_BASE =
  process.env.NEXT_PUBLIC_PROD_SITE_URL || "http://localhost:3000";
export const METADATA_BASE = new URL(FALLBACK_BASE);

export const SITE_NAME = process.env.SITE_NAME || "Your Brand";
export const FALLBACK_TITLE = "Your Brand — Home";
export const FALLBACK_DESC = "Your Brand description.";
export const FALLBACK_OG = "/og/og-default.jpg";

/** Construye Metadata a partir de una entrada puntual (por página) */
export function buildMetadata(input: PageMetaInput = {}): Metadata {
  const titleStr =
    typeof input.title === "string"
      ? input.title
      : input.title?.default ?? FALLBACK_TITLE;

  const description = input.description ?? FALLBACK_DESC;
  const ogImage =
    input.ogImage ||
    // @ts-expect-error — Next valida en runtime el shape de images
    (input.openGraph?.images?.[0]?.url as string | undefined) ||
    FALLBACK_OG;

  const baseOG: NonNullable<Metadata["openGraph"]> = {
    type: "website",
    url: input.openGraph?.url ?? "/",
    siteName: SITE_NAME,
    title: titleStr,
    description,
    images: [{ url: ogImage }],
  };

  return {
    metadataBase:
      typeof input.metadataBase === "string"
        ? new URL(input.metadataBase)
        : input.metadataBase ?? METADATA_BASE,
    title: { default: titleStr, template: `%s | ${SITE_NAME}` },
    description,
    keywords: input.keywords,
    alternates: input.alternates,
    robots: input.robots ?? { index: true, follow: true },
    twitter: input.twitter ?? { card: "summary_large_image" },
    openGraph: { ...baseOG, ...(input.openGraph || {}) },
    icons: input.icons,
  };
}

/**
 * Construye Metadata efectiva combinando:
 *   defaults < global (FS/seed) < site (FS/seed) < page (FS/seed) < overrides
 */
export async function buildMetadataFromSources(
  routeKey: string,
  locale: string,
  defaults: MetaRecord = {},
  overrides?: Partial<Metadata>
): Promise<Metadata> {
  const [g, s, p] = await Promise.all([
    loadMetaGlobal(locale),
    loadMetaSite(locale),
    loadMetaPage(routeKey, locale),
  ]);

  // Merge plano
  const flat: MetaRecord = { ...(defaults || {}), ...(g || {}), ...(s || {}), ...(p || {}) };

  // Piezas tipadas
  const twitter = coerceTwitter(flat);
  const openGraph = coerceOpenGraph(flat);
  const robots = coerceRobots(flat);
  const alternates = coerceAlternates(flat);
  const icons = coerceIcons(flat);
  const simple = coerceSimple(flat);

  // metadataBase
  const mb = toStr(flat["metadataBase"]);
  const metadataBase = mb ? new URL(mb) : METADATA_BASE;

  // keywords (coma/semi/linea)
  const kws = toStr(flat["keywords"]);
  const keywords =
    kws?.split(/,|;|\n/).map((x) => x.trim()).filter(Boolean) || undefined;

  const merged = prune<Metadata>({
    ...simple,
    metadataBase,
    keywords,
    alternates,
    robots,
    twitter,
    openGraph,
    icons,
    ...(overrides || {}),
  });

  return merged || {};
}
