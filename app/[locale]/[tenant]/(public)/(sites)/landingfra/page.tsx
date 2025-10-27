import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import GoogleAdsLandingFraPage from "./GAdsLandFPage";
import { Suspense } from "react";

// ⬇ Esto le da metadata a la home usando la config central
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(pageMeta.home);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // 👈 OBLIGATORIO en Next 15
  return (
    <Suspense fallback={null}>
      <GoogleAdsLandingFraPage locale={locale} />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Landing (Google Ads, FR) Page (app/\[locale]/(sites)/landingfra/page.tsx)
QUÉ HACE:
Renderiza la landing en francés enfocada a campañas de Google Ads. Normalmente delega
la UI al componente presentacional GAdsLandFPage y lee searchParams para personalizar
copy, tracking y variantes A/B.

RUTAS RESULTANTES:
/fr/landingfra   /es/landingfra   /en/landingfra   (bajo el segmento (sites))

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'fr' | 'es' | 'en' }      // opcional | locale activo
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

USO (patrón recomendado con el presentacional GAdsLandFPage):
// import GAdsLandFPage from './GAdsLandFPage'
//
// export default async function Page({ params, searchParams }: Props) {
//   const locale = params?.locale ?? 'fr'                  // opcional
//   const variant = (searchParams?.ab === 'v2') ? 'v2' : 'v1'  // opcional
//   const noIndex = searchParams?.noindex === '1'          // opcional
//
//   return (
//     \<GAdsLandFPage
//       locale={locale}                                    // opcional | 'fr'|'es'|'en' | default 'fr'
//       headline="Saveurs latines authentiques, musique live vendredi"  // requerido
//       subheadline="Réservez votre table près de la scène et vibrez"   // opcional
//       hero={{ imageSrc: '/media/hero-ads-fr.webp', alt: 'Groupe en direct' }}  // opcional
//       offer={{ label: '3 tacos et 1 boisson 12 \$', details: 'Offre limitée' }} // opcional
//       features={\[{ id: 'f1', title: 'Stationnement gratuit' }]}       // opcional
//       proof={{ badges: \['Mieux noté'] }}                               // opcional
//       ctaPrimary={{ label: 'Réserver maintenant', href: `/${locale}/reservas` }} // requerido
//       ctaSecondary={{ label: 'Voir le menu', href: `/${locale}/menu` }} // opcional
//       contact={{ phone: '+1 519-555-0123' }}                           // opcional
//       tracking={{
//         ga4EventName: 'ads\_landing\_fr\_view',
//         gtmEvent: 'ads\_landing\_fr\_view',
//         adsConversionId: 'AW-17395397582',
//         adsConversionLabel: 'FrAbCdEf123'
//       }}
//       theme="auto"                                                     // opcional | 'light'|'dark'|'auto'
//       variant={variant}                                                // opcional | 'v1'|'v2'
//       noIndex={noIndex}                                                // opcional | boolean
//       className="container mx-auto px-6"                               // opcional
//     />
//   )
// }

SEARCH PARAMS TÍPICOS (ejemplos de URL):
/fr/landingfra?utm\_source=google\&utm\_medium=cpc\&utm\_campaign=brand         // opcional | UTM estándar
/fr/landingfra?ab=v2\&ref=display\&gclid=EAIaIQobChMI...                     // opcional | A/B y gclid
/fr/landingfra?noindex=1                                                   // opcional | fuerza noindex

NOTAS:

* Page es Server Component por defecto; evita usar Web APIs del navegador aquí.
* Para GA4/GTM y conversiones, dispara eventos desde el presentacional o un client wrapper.
* Propaga UTM y gclid en los href de los CTAs para preservar la atribución.
* Si hay políticas sensibles (alcohol), cuida copy, edades y restricciones locales.
* SEO: si noIndex es true, añade meta robots noindex en layout o dentro del presentacional si lo soporta.
* Caché: contenido de campaña puede usar revalidate 0.

DEPENDENCIAS:

* Next.js App Router (params, searchParams).
* Componente GAdsLandFPage para la UI de la landing.
  ────────────────────────────────────────────────────────── */
