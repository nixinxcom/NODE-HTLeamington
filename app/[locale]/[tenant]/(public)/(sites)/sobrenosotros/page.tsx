import type { Metadata, ResolvingMetadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import AboutUsPage from "./AboutUsPage";
import { Suspense } from "react";

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

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  const base = await buildMetadata(pageMeta.home);
  const defaults = baseDefaultsToMetaRecord(base);
  const rec = await getEffectiveMetaServer("aboutus", locale ?? "es", defaults);
  const override = metaRecordToNext(rec);
  return deepMerge(base, override as Metadata);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense fallback={null}>
      <AboutUsPage locale={locale} />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: About Us Page (app/\[locale]/(sites)/sobrenosotros/page.tsx)
QUÉ HACE:
Renderiza la portada de "Sobre nosotros" por idioma y normalmente delega la UI
al componente presentacional AboutUsPage. Puede leer searchParams para enfocar
una sección (misión, historia, equipo), elegir variante visual, y propagar UTMs.

RUTAS RESULTANTES:
/es/sobrenosotros   /en/sobrenosotros   /fr/sobrenosotros   — segmento (sites)

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'es' | 'en' | 'fr' }   // opcional — locale activo
searchParams?: {
section?: 'hero' | 'mission' | 'story' | 'values' | 'team' | 'timeline' | 'stats' | 'contact' // opcional — bloque a enfocar
variant?: 'v1' | 'v2'                    // opcional — variante A/B
ref?: string                              // opcional — fuente personalizada
utm\_source?: string                       // opcional — tracking UTM
utm\_medium?: string                       // opcional — tracking UTM
utm\_campaign?: string                     // opcional — tracking UTM
lang?: 'es' | 'en' | 'fr'                 // opcional — forzar idioma de UI
}
}
export default function Page(props: Props): JSX.Element

USO (patrón recomendado con el presentacional AboutUsPage):
// import AboutUsPage from './AboutUsPage'
//
// export default async function Page({ params, searchParams }: Props) {
//   const locale = searchParams?.lang ?? params?.locale ?? 'es'
//   const variant = (searchParams?.variant === 'v2') ? 'v2' : 'v1'
//   const section = searchParams?.section ?? 'hero'
//
//   return (
//     \<AboutUsPage
//       locale={locale}                          // opcional — 'es'|'en'|'fr'
//       title="Quiénes somos"                    // opcional
//       subtitle="Sabor auténtico y comunidad"   // opcional
//       hero={{ imageSrc: '/media/hero-about.webp', alt: 'Ambiente del lugar' }} // opcional
//       mission="Acercar la cultura latinoamericana con cocina y música."         // opcional
//       story="Iniciamos como un sueño familiar..."                                // opcional
//       values={\[{ title: 'Autenticidad' }, { title: 'Hospitalidad' }]}           // opcional
//       team={\[{ id: 't1', name: 'Equipo', role: 'Staff' }]}                      // opcional
//       timeline={\[{ id: 'e1', date: '2022', title: 'Apertura' }]}                // opcional
//       stats={\[{ label: 'Capacidad', value: '240' }]}                             // opcional
//       ctaPrimary={{ label: 'Reservar', href: `/${locale}/reservas` }}           // opcional
//       ctaSecondary={{ label: 'Ver menú', href: `/${locale}/menus` }}            // opcional
//       theme={variant === 'v2' ? 'dark' : 'auto'}                                 // opcional — 'light'|'dark'|'auto'
//       className="container mx-auto px-6 py-10"                                   // opcional
//     />
//   )
// }

SEARCH PARAMS TÍPICOS (ejemplos de URL):
/es/sobrenosotros?section=team
/en/sobrenosotros?variant=v2\&utm\_source=google\&utm\_medium=cpc\&utm\_campaign=brand
/fr/sobrenosotros?lang=fr

NOTAS:
— Page es Server Component por defecto; evita usar Web APIs del navegador aquí.
— SEO: define metadata en el layout superior o con generateMetadata específico si esta sección lo requiere.
— Datos estructurados: agrega JSON-LD en page/layout (Organization, LocalBusiness) si corresponde.
— Caché: si el contenido cambia poco, usa revalidate en segundos; si depende de campaña o usuario, considera 0.
— i18n: evita strings fijos si ya usas mensajes por locale; mapea props desde tu sistema de traducciones.
— Atribución: si llegan UTMs o ref, propágalos en enlaces a reservas o contacto cuando apliquen.

DEPENDENCIAS:
— Next.js App Router (params, searchParams).
— Componente presentacional AboutUsPage para el render visual e interacción.
────────────────────────────────────────────────────────── */
