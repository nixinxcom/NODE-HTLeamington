import type { Metadata, ResolvingMetadata } from "next";
import { Suspense } from "react";
import HomePage from "./HomePage";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import { getEffectiveMetaServer, metaRecordToNext, deepMerge } from "@/app/lib/seo/meta.server";

// Helpers locales (no cambian tu UI)
function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  try { const s = (v as any).toString?.(); return typeof s === "string" && s ? s : null; } catch { return null; }
}
function baseDefaultsToMetaRecord(base: Metadata): Record<string, string | null> {
  const titleVal =
    typeof base.title === "string"
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

// ✅ Firma correcta: (props, parent: ResolvingMetadata)
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;

  // Base actual (tu config central)
  const base = await buildMetadata(pageMeta.home);

  // Overrides (Global + Site + Página 'home') desde Firestore, merge no destructivo
  const defaults = baseDefaultsToMetaRecord(base);
  const rec = await getEffectiveMetaServer("home", locale ?? "es", defaults);
  const override = metaRecordToNext(rec);

  return deepMerge(base, override as Metadata);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // Next 15: params es Promise
  return (
    <Suspense fallback={null}>
      <HomePage />
    </Suspense>
  );
}