// app/[locale]/(sites)/blog/layout.tsx
// (server component – sin "use client")

import React from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import {getEffectiveMetaServer,metaRecordToNext,deepMerge} from "@/app/lib/seo/meta.server";
// ✅ ADITIVO: one-liner reutilizable
import { withPageMetadata } from "@/app/lib/seo/withPageMetadata";

const ROUTE_KEY = "blog" as const;
const PAGE_META_KEY = "blog" as keyof typeof pageMeta;

// Helpers (los conservamos)
function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  try { const s = (v as any).toString?.(); return typeof s === "string" && s ? s : null; } catch { return null; }
}
function baseDefaultsToMetaRecord(base: Metadata): Record<string, string | null> {
  const titleVal = typeof base.title === "string" ? base.title : ((base.title as any)?.absolute ?? (base.title as any)?.default ?? null);
  const ogImg = Array.isArray((base as any)?.openGraph?.images) ? ((base as any).openGraph.images[0]?.url ?? (base as any).openGraph.images[0] ?? null) : null;
  const twImg = Array.isArray((base as any)?.twitter?.images) ? ((base as any).twitter.images[0] ?? null) : null;
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

/** ✅ ÚNICA export reconocida por Next (one-liner) */
export const generateMetadata = withPageMetadata({
  routeKey: "blog",
  pageMetaKey: "blog", // cámbialo a "blog" si ya tienes pageMeta.blog
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
