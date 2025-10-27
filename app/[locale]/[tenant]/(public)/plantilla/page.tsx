// app/[locale]/(public)/plantilla/page.tsx
import type { Metadata, ResolvingMetadata } from "next";
import { pageMeta } from "@/app/lib/seo/pages";
import { getEffectiveMetaServer, metaRecordToNext, deepMerge } from "@/app/lib/seo/meta.server";
import HomePublicPage from "./HomePublicPage";
import s from "./page.module.css";
import { siteOrigin } from "@/app/lib/site"; // ⬅️ NUEVO: origen dinámico (host:puerto)

// helper: seeds por ruta+locale
function pickLocale(
  rec: Record<string, any>,
  routeKey: string,
  locale: string
) {
  const byRoute = rec[routeKey] ?? {};
  return byRoute[locale] ?? byRoute["*"] ?? byRoute["default"] ?? byRoute["es"] ?? {};
}

// ⬇️ Next 15: params llega como Promise → hay que await
export async function generateMetadata(
  { params }: { params: Promise<Record<string, string | string[] | undefined>> },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const p = await params;
  const locale = (p?.locale as string) || "es";

  const seeds = pickLocale(pageMeta, "plantilla", locale);
  const effective = await getEffectiveMetaServer("plantilla", locale);

  const defaults = {
    title: "Plantilla — Landing base",
    description: "Plantilla lista: i18n, branding, PWA, GTM, contexto y IA.",
    "twitter:card": "summary_large_image",
    "og:image": "/og/og-default.jpg",
    canonical: "/plantilla",
    metadataBase: new URL(siteOrigin()), // ⬅️ CAMBIO: sin hardcode, toma host/puerto reales
  };

  // deepMerge acepta 2 args → en dos pasos
  const merged1 = deepMerge(seeds, effective);
  const merged = deepMerge(merged1, defaults);

  return metaRecordToNext(merged);
}

export default async function Page(
  { params }: { params: Promise<Record<string, string | string[] | undefined>> }
) {
  const p = await params;
  const locale = (p?.locale as string) || "es";

  // ✅ algo desde el servidor (snapshot)
  const ssrTime = new Date().toISOString();

  return (
    <div className={s.section}>
      <HomePublicPage ssrTime={ssrTime} locale={locale} />
    </div>
  );
}
