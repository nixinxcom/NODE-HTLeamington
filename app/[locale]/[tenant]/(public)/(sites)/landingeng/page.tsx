import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import GoogleAdsLandingEngPage from "./GAdsLandEPage";
import { Suspense } from "react";

// ⬇ Esto le da metadata a la home usando la config central
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(pageMeta.home);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // 👈 OBLIGATORIO en Next 15
  return (
    <Suspense fallback={null}>
      <GoogleAdsLandingEngPage locale={locale} />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Landing (Google Ads, EN) Page (app/\[locale]/(sites)/landingeng/page.tsx)
QUÉ HACE:
Renderiza la landing en inglés enfocada a campañas de Google Ads. Normalmente delega
la UI al componente presentacional GAdsLandEPage y lee searchParams para personalizar
copy, tracking y variantes A/B.

RUTAS RESULTANTES:
/en/landingeng   /es/landingeng   /fr/landingeng   (bajo el segmento (sites))

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'en' | 'es' | 'fr' }      // opcional | locale activo
searchParams?: {
ref?: string                                 // opcional | fuente personalizada
utm\_source?: string                          // opcional | tracking UTM
utm\_medium?: string                          // opcional | tracking UTM
utm\_campaign?: string                        // opcional | tracking UTM
gclid?: string                               // opcional | Google Ads click id
section?: string                             // opcional | ancla o bloque a enfocar
ab?: 'v1' | 'v2'                             // opcional | variante A/B
noindex?: '1' | '0'                          // opcional | forzar meta robots noindex
offer?: string                               // opcional | id de oferta para el copy
}
}
export default function Page(props: Props): JSX.Element

USO (patrón recomendado con el presentacional GAdsLandEPage):
// import GAdsLandEPage from './GAdsLandEPage'
//
// export default async function Page({ params, searchParams }: Props) {
//   const locale = params?.locale ?? 'en'                              // opcional | 'en'|'es'|'fr' | default 'en'
//   const variant = (searchParams?.ab === 'v2') ? 'v2' : 'v1'          // opcional | 'v1'|'v2'
//   const noIndex = searchParams?.noindex === '1'                      // opcional | boolean
//
//   return (
//     \<GAdsLandEPage
//       locale={locale}                                                // opcional | 'en'|'es'|'fr' | default 'en'
//       headline="Authentic Latin Flavors, Live Music Fridays"         // requerido | string
//       subheadline="Book your table near the stage and feel the vibe" // opcional | string
//       hero={{ imageSrc: '/media/hero-ads.webp', alt: 'Live band' }}  // opcional | { imageSrc?, alt?, videoSrc? }
//       offer={{ label: '3 tacos & 1 pop \$12', details: 'Limited' }}   // opcional | objeto oferta
//       features={\[{ id: 'f1', title: 'Free Parking' }]}               // opcional | array de features
//       proof={{ badges: \['Top Rated'] }}                              // opcional | prueba social
//       ctaPrimary={{ label: 'Reserve Now', href: `/${locale}/reservas` }} // requerido | objeto CTA
//       ctaSecondary={{ label: 'View Menu', href: `/${locale}/menu` }} // opcional | objeto CTA
//       contact={{ phone: '+1 519-555-0123' }}                         // opcional | bloque contacto
//       tracking={{
//         ga4EventName: 'ads\_landing\_view',                            // opcional | string
//         gtmEvent: 'ads\_landing\_view',                                // opcional | string
//         adsConversionId: 'AW-17395397582',                           // opcional | string
//         adsConversionLabel: 'AbCdEfGhIjKlMnOp'                       // opcional | string
//       }}
//       theme="auto"                                                   // opcional | 'light'|'dark'|'auto' | default 'auto'
//       variant={variant}                                              // opcional | 'v1'|'v2'
//       noIndex={noIndex}                                              // opcional | boolean
//       className="container mx-auto px-6"                             // opcional | string
//     />
//   )
// }

SEARCH PARAMS TÍPICOS (ejemplos de URL):
/en/landingeng?utm\_source=google\&utm\_medium=cpc\&utm\_campaign=brand          // opcional | UTM estándar
/en/landingeng?ab=v2\&ref=display\&gclid=EAIaIQobChMI...                      // opcional | A/B y gclid
/en/landingeng?noindex=1                                                    // opcional | fuerza noindex

NOTAS:

* Page es Server Component por defecto; evita usar Web APIs del navegador aquí.
* Para GA4/GTM y conversiones, dispara eventos desde el presentacional o un client wrapper.
* Propaga UTM y gclid en los href de los CTAs para preservar la atribución.
* Si hay políticas sensibles (alcohol), cuida copy, edades y restricciones locales.
* SEO: si noIndex es true, añade meta robots noindex en layout o dentro del presentacional si lo soporta.
* Caché: contenido altamente dinámico por campaña puede usar revalidate 0.

DEPENDENCIAS:

* Next.js App Router (params, searchParams).
* Componente GAdsLandEPage para la UI de la landing.
  ────────────────────────────────────────────────────────── */
