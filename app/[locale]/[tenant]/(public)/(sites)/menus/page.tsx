import type { Metadata, ResolvingMetadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import MenuPage from "./MenuPage";
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
  const rec = await getEffectiveMetaServer("menus", locale ?? "es", defaults);
  const override = metaRecordToNext(rec);
  return deepMerge(base, override as Metadata);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense fallback={null}>
      <MenuPage locale={locale} />
    </Suspense>
  );
}


/* ─────────────────────────────────────────────────────────
DOC: Menus Page (app/\[locale]/(sites)/menus/page.tsx)
QUÉ HACE:
Renderiza la página de menús por locale y normalmente delega el UI a un presentacional
como MenuPage. Puede leer searchParams para filtrar por etiqueta, elegir layout, columnas
y controlar el visor o descargas.

RUTAS RESULTANTES:
/es/menus   /en/menus   /fr/menus   — bajo el segmento (sites)

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'es' | 'en' | 'fr' }        // opcional — locale activo
searchParams?: {
tag?: string                                  // opcional — etiqueta inicial, p. ej. "bar"
layout?: 'grid' | 'list'                      // opcional — layout sugerido
columns?: '2' | '3' | '4'                     // opcional — columnas como string
lightbox?: '1' | '0'                          // opcional — activar visor
page?: string                                 // opcional — página actual
pageSize?: string                             // opcional — ítems por página
ref?: string                                  // opcional — fuente personalizada
utm\_source?: string                           // opcional — tracking UTM
utm\_medium?: string                           // opcional — tracking UTM
utm\_campaign?: string                         // opcional — tracking UTM
}
}
export default function Page(props: Props): JSX.Element

USO (patrón recomendado con el presentacional MenuPage):
// import MenuPage, { type MenuAsset } from './MenuPage'
//
// const assets: MenuAsset\[] = \[
//   { id: 'food',    title: 'Menú Alimentos',  src: '/media/Menu Alimentos.png',  type: 'image', alt: 'Menú de alimentos',  tag: 'cocina' },
//   { id: 'liquor',  title: 'Menú Licor',      src: '/media/Menu Licor.png',      type: 'image', alt: 'Menú de licor',      tag: 'bar'    },
//   { id: 'cocktail',title: 'Menú Coctelería', src: '/docs/menu-cocktail.pdf',    type: 'pdf',   tag: 'bar',                download: true }
// ]
//
// export default async function Page({ params, searchParams }: Props) {
//   const locale   = params?.locale ?? 'es'                                  // opcional — 'es'|'en'|'fr' — default 'es'
//   const tag      = searchParams?.tag ?? ''                                 // opcional — string
//   const layout   = (searchParams?.layout as 'grid'|'list') ?? 'grid'       // opcional — 'grid'|'list' — default 'grid'
//   const columns  = Number(searchParams?.columns ?? '3')                    // opcional — 2|3|4 — default 3
//   const lightbox = searchParams?.lightbox !== '0'                          // opcional — boolean — default true
//   const page     = Number(searchParams?.page ?? '1')                       // opcional — number — default 1
//   const pageSize = Number(searchParams?.pageSize ?? '12')                  // opcional — number — default 12
//
//   return (
//     \<MenuPage
//       assets={assets}                      // requerido — MenuAsset\[]
//       layout={layout}                      // opcional — 'grid'|'list' — default 'grid'
//       columns={columns as 2|3|4}           // opcional — 2|3|4 — default 3
//       gap={12}                             // opcional — number px — default 12
//       lightbox={lightbox}                  // opcional — boolean — default true
//       initialTag={tag}                     // opcional — string
//       locale={locale}                      // opcional — 'es'|'en'|'fr'
//       page={page}                          // opcional — number — default 1
//       pageSize={pageSize}                  // opcional — number — default 12
//       className="container mx-auto p-6"    // opcional — string
//     />
//   )
// }

SEARCH PARAMS TÍPICOS (ejemplos de URL):
/es/menus?tag=bar\&layout=grid\&columns=3
/en/menus?layout=list\&page=2\&pageSize=24
/fr/menus?tag=cocina\&lightbox=0

NOTAS:
— Page es Server Component por defecto; no uses Web APIs del navegador aquí.
— Si necesitas visor, observers o manejo de eventos, muévelo al presentacional con "use client".
— Si los menús vienen de CMS o Firestore, haz el fetch aquí con caché adecuada o revalidate según frecuencia.
— Las imágenes de menús no son legibles por buscadores; ofrece PDFs o HTML semántico adicional cuando sea posible.
— Propaga UTM y ref en enlaces posteriores si necesitas atribución de campañas.

DEPENDENCIAS:
— Next.js App Router para params y searchParams.
— Componente presentacional MenuPage para el render visual y la interacción.
────────────────────────────────────────────────────────── */
