import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import GoogleAdsLandingEspPage from "./GAdsLandSPage";
import { Suspense } from "react";

// ⬇ Esto le da metadata a la home usando la config central
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(pageMeta.home);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // 👈 OBLIGATORIO en Next 15
  return (
    <Suspense fallback={null}>
      <GoogleAdsLandingEspPage locale={locale} />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Landing (Google Ads, ES) Page (app/\[locale]/(sites)/landingesp/page.tsx)
QUÉ HACE:
Renderiza la landing en español enfocada a campañas de Google Ads. Normalmente delega
la UI al componente presentacional GAdsLandSPage y lee searchParams para personalizar
copy, tracking y variantes A/B.

RUTAS RESULTANTES:
/es/landingesp   /en/landingesp   /fr/landingesp   (bajo el segmento (sites))

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'es' | 'en' | 'fr' }      // opcional | locale activo
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

USO (patrón recomendado con el presentacional GAdsLandSPage):
// import GAdsLandSPage from './GAdsLandSPage'
//
// export default async function Page({ params, searchParams }: Props) {
//   const locale = params?.locale ?? 'es'                              // opcional
//   const variant = (searchParams?.ab === 'v2') ? 'v2' : 'v1'          // opcional
//   const noIndex = searchParams?.noindex === '1'                      // opcional
//
//   return (
//     \<GAdsLandSPage
//       locale={locale}                                                // opcional | 'es'|'en'|'fr' | default 'es'
//       headline="Sabor auténtico y música en vivo"                    // requerido
//       subheadline="Reserva tu mesa cerca del escenario"              // opcional
//       hero={{ imageSrc: '/media/hero-ads-es.webp', alt: 'Banda en vivo' }}   // opcional
//       offer={{ label: '3 tacos y 1 refresco \$12', details: 'Por tiempo limitado' }} // opcional
//       features={\[{ id: 'f1', title: 'Estacionamiento gratis' }]}     // opcional
//       proof={{ badges: \['Mejor calificado'] }}                       // opcional
//       ctaPrimary={{ label: 'Reservar ahora', href: `/${locale}/reservas` }}   // requerido
//       ctaSecondary={{ label: 'Ver menú', href: `/${locale}/menu` }}  // opcional
//       contact={{ phone: '+1 519-555-0123' }}                         // opcional
//       tracking={{
//         ga4EventName: 'ads\_landing\_es\_view',
//         gtmEvent: 'ads\_landing\_es\_view',
//         adsConversionId: 'AW-17395397582',
//         adsConversionLabel: 'ZyXwVuTsRqPoNm'
//       }}
//       theme="auto"                                                   // opcional | 'light'|'dark'|'auto'
//       variant={variant}                                              // opcional | 'v1'|'v2'
//       noIndex={noIndex}                                              // opcional | boolean
//       className="container mx-auto px-6"                             // opcional
//     />
//   )
// }

SEARCH PARAMS TÍPICOS (ejemplos de URL):
/es/landingesp?utm\_source=google\&utm\_medium=cpc\&utm\_campaign=brand         // opcional | UTM estándar
/es/landingesp?ab=v2\&ref=display\&gclid=EAIaIQobChMI...                     // opcional | A/B y gclid
/es/landingesp?noindex=1                                                   // opcional | fuerza noindex

NOTAS:

* Page es Server Component por defecto; evita usar Web APIs del navegador aquí.
* Para GA4/GTM y conversiones, dispara eventos desde el presentacional o un client wrapper.
* Propaga UTM y gclid en los href de los CTAs para preservar la atribución.
* Si hay políticas sensibles como alcohol, cuida copy, edades y restricciones locales.
* SEO: si noIndex es true, añade meta robots noindex en layout o dentro del presentacional si lo soporta.
* Caché: contenido dinámico por campaña puede usar revalidate 0.

DEPENDENCIAS:

* Next.js App Router (params, searchParams).
* Componente GAdsLandSPage para la UI de la landing.
  ────────────────────────────────────────────────────────── */
