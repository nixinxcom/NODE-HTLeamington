import type { Metadata, ResolvingMetadata } from "next";
import { Suspense } from "react";
import GalleryPage from "./GalleryPage";

import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";

import {
  getEffectiveMetaServer,
  metaRecordToNext,
  deepMerge,
} from "@/app/lib/seo/meta.server";

function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  try { const s = (v as any).toString?.(); return typeof s === "string" && s ? s : null; } catch { return null; }
}
function baseDefaultsToMetaRecord(base: Metadata): Record<string, string | null> {
  const titleVal = typeof base.title === "string"
    ? base.title
    : ((base.title as any)?.absolute ?? (base.title as any)?.default ?? null);
  const ogImg = Array.isArray((base as any)?.openGraph?.images)
    ? ((base as any).openGraph.images[0]?.url ?? (base as any).openGraph.images[0] ?? null)
    : null;
  const twImg = Array.isArray((base as any)?.twitter?.images)
    ? ((base as any).twitter.images[0] ?? null)
    : null;
  return {
    title: strOrNull(titleVal),
    description: strOrNull(base.description),
    "og:title": strOrNull((base as any)?.openGraph?.title),
    "og:description": strOrNull((base as any)?.openGraph?.description),
    "og:image": strOrNull(ogImg),
    "twitter:title": strOrNull((base as any)?.twitter?.title),
    "twitter:description": strOrNull((base as any)?.twitter?.description),
    "twitter:image": strOrNull(twImg),
  };
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  const base = await buildMetadata(pageMeta.home);
  const defaults = baseDefaultsToMetaRecord(base);
  const rec = await getEffectiveMetaServer("galeria", locale ?? "es", defaults);
  const override = metaRecordToNext(rec);
  return deepMerge(base, override as Metadata);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const base = (locale?.split("-")[0] ?? "en") as "es" | "en" | "fr";
  const FBT: Record<"es" | "en" | "fr", string> = { es: "Cargando…", en: "Loading…", fr: "Chargement…" };
  return (
    <Suspense fallback={<div className="opacity-70 text-sm px-4 py-6">{FBT[base] ?? FBT.en}</div>}>
      <GalleryPage locale={locale} />
    </Suspense>
  );
}