import { Suspense } from "react";
import AdSenseCard from "./AdSenseCard";

export default async function Page(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  return (
    <Suspense fallback={null}>
      <AdSenseCard locale={locale} />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Testings Page (app/\[locale]/(sites)/testings/page.tsx)
QUÉ HACE:
Página de pruebas y verificación técnica. Sirve como "sandbox" para:
— Ensayar integraciones (AdSense, GA4, GTM), medir eventos y revisar inventario.
— Probar componentes UI de forma aislada (p. ej., AdSenseCard).
— Activar flags de depuración vía searchParams sin tocar código.

RUTAS RESULTANTES:
/es/testings   /en/testings   /fr/testings   — bajo el segmento (sites)

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'es' | 'en' | 'fr' }      // opcional — locale activo
searchParams?: {
section?: 'ads' | 'ga4' | 'env' | 'ui'      // opcional — bloque a enfocar
// AdSense (si se renderiza AdSenseCard u otro bloque)
ad\_client?: string                           // opcional — ca-pub-xxxxxxxxxxxxxxxx
ad\_slot?: string                             // opcional — id del bloque (numérico)
ad\_format?: 'auto' | 'fluid' | 'autorelaxed' // opcional — default 'auto'
ad\_layoutKey?: string                        // opcional — requerido por ciertos 'fluid'
ad\_full?: '1' | '0'                          // opcional — data-full-width-responsive
ad\_test?: '1' | '0'                          // opcional — '1' en dev recomendado
// Tracking rápido
ga4\_event?: string                           // opcional — nombre de evento GA4 al montar
gtm\_event?: string                           // opcional — dataLayer.push
// Config general
theme?: 'light' | 'dark' | 'auto'            // opcional — tema visual
debug?: '1' | '0'                            // opcional — muestra datos crudos
verbose?: '1' | '0'                          // opcional — logs detallados en cliente
ref?: string                                  // opcional — fuente personalizada
utm\_source?: string                           // opcional — tracking UTM
utm\_medium?: string                           // opcional — tracking UTM
utm\_campaign?: string                         // opcional — tracking UTM
lang?: 'es' | 'en' | 'fr'                     // opcional — forzar idioma de UI
}
}
export default function Page(props: Props): JSX.Element

USO (patrón recomendado con AdSenseCard):
// import AdSenseCard from './AdSenseCard'
// export default function Page({ params, searchParams }: Props) {
//   const locale = searchParams?.lang ?? params?.locale ?? 'es'
//   const adClient = searchParams?.ad\_client ?? 'ca-pub-1464924959291015'
//   const adSlot = searchParams?.ad\_slot ?? '1234567890'
//   const adFormat = (searchParams?.ad\_format as 'auto'|'fluid'|'autorelaxed') ?? 'auto'
//   const adFull = searchParams?.ad\_full !== '0'
//   const adTest = searchParams?.ad\_test !== '0'
//   return (
//     <div className="container mx-auto px-6 py-8">
//       <h1>Testings ({locale})</h1>
//       \<AdSenseCard
//         client={adClient}                  // opcional — string
//         slot={adSlot}                      // requerido — string
//         format={adFormat}                  // opcional — 'auto'|'fluid'|'autorelaxed'
//         layoutKey={searchParams?.ad\_layoutKey ?? ''} // opcional — string
//         fullWidthResponsive={adFull}       // opcional — boolean
//         adTest={adTest}                    // opcional — boolean
//         style={{ minHeight: 250 }}         // opcional — CSS
//         className="my-6"
//         onRendered={() => { console.log('ads rendered') }} // opcional — función
//       />
//     </div>
//   )
// }

SEARCH PARAMS TÍPICOS (ejemplos de URL):
/es/testings?section=ads\&ad\_client=ca-pub-1464924959291015\&ad\_slot=1234567890
/es/testings?section=ads\&ad\_format=fluid\&ad\_layoutKey=-gw-3+1f-3d+2z
/es/testings?ga4\_event=testing\_view\&gtm\_event=testing\_view\&debug=1\&verbose=1
/en/testings?theme=dark

NOTAS:
— Page es Server Component por defecto; cualquier efecto de navegador (AdSense, dataLayer) debe ejecutarse en un child con "use client".
— Para AdSense, carga el script global una sola vez en el layout raíz con el client correcto.
— Evita duplicar pushes de dataLayer; controla con flags (debug, verbose) y registra una sola vez al montar.
— revalidate: si la página depende de parámetros de campaña y resultados inmediatos, usa revalidate 0 para evitar cache.

DEPENDENCIAS:
— Next.js App Router (params, searchParams).
— Componentes de prueba como AdSenseCard u otros wrappers cliente para integraciones.
────────────────────────────────────────────────────────── */
