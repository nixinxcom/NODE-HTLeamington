"use client";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import AdSense from "@/complements/components/AdsenseComp/AdsenseComp";
import { EnsureAdsense } from '@/app/lib/adsense';
import { FormattedMessage } from "react-intl";
import FM from "@/complements/i18n/FM";
import s from './AdSenseCard.module.css';
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Props = { locale: string };

export default function AdSenseCard({ locale }: Props) {
  return (
    <div>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />

      <EnsureAdsense />

      {/* Ejemplos de formatos — los estilos inline fueron movidos a clases del módulo */}
      <AdSense
        Type={{
            kind: 'multiplex'
        }}
        adSlot='9911951289'
        className={s.block}
      />
      <AdSense
        Type={{
            kind: 'multiplex'
        }}
        adSlot='2788656655'
        className={s.inlineBox360x800}
      />
      <AdSense
        Type={{
            kind: 'in-article',
            align: 'center'
        }}
        adSlot='2962834906'
        className={s.block}
      />
      <AdSense
        Type={{
            kind: 'in-feed',
            layoutKey: '-ef+6k-30-ac+ty'
        }}
        adSlot='1947499652'
        className={s.block}
      />
      <AdSense
        Type={{
            kind: 'in-feed',
            layoutKey: '-gw-3+1f-3d+2z'
        }}
        adSlot='4035958019'
        className={s.block}
      />
      <AdSense
        Type={{
            kind: 'display',
            format: 'auto',
            fullWidthResponsive: true
        }}
        adSlot='6216248859'
        className={s.inlineBanner728x90}
      />

      {/* usa `locale` si necesitas condicionar algo */}
      <P className={s.meta}><FM id="ads.locale" defaultMessage="Locale" />: {locale}</P>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: AdSenseCard (app/[locale]/(sites)/testings/AdSenseCard.tsx)
QUÉ HACE:
Renderiza bloques de Google AdSense para pruebas (multiplex, in-article, in-feed, display).

NOTAS:
- Estilos inline movidos a Testings.module.css
- Sin cambios de i18n, JSX, lógica, rutas ni exports.
────────────────────────────────────────────────────────── */


/* ─────────────────────────────────────────────────────────
DOC: AdSenseCard (app/\[locale]/(sites)/testings/AdSenseCard.tsx)
QUÉ HACE:
Renderiza un bloque de Google AdSense dentro de una “card” y dispara (adsbygoogle).push()
en cliente. Soporta formatos auto, fluid y autorelaxed (Multiplex). Útil para pruebas A/B
o verificación de inventario en páginas de testing.

PROPS (TypeScript sugerido; ajusta a tu implementación real):
export interface AdSenseCardProps {
client?: string                                 // opcional  id del publisher, ej. "ca-pub-1464924959291015"  default: de env (NEXT\_PUBLIC\_ADSENSE\_ID)
slot: string                                    // requerido id del ad slot, ej. "1234567890"
format?: 'auto' | 'fluid' | 'autorelaxed'       // opcional  default: 'auto'
layoutKey?: string                               // opcional  requerido por ciertos 'fluid' (clave de layout)
fullWidthResponsive?: boolean                    // opcional  default: true  (data-full-width-responsive)
adTest?: boolean                                 // opcional  default: true en dev, false en prod  (data-adtest='on')
style?: React.CSSProperties                      // opcional  estilos inline del <ins>
className?: string                               // opcional  clases de la card/contenedor
onRendered?: () => void                          // opcional  callback tras intentar render
}

USO (ejemplo completo):
// import AdSenseCard from './AdSenseCard'
//
// \<AdSenseCard
//   client="ca-pub-1464924959291015"  // opcional  string  default desde env si existe
//   slot="1234567890"                 // requerido string  id del bloque AdSense
//   format="auto"                     // opcional 'auto'|'fluid'|'autorelaxed'  default 'auto'
//   layoutKey=""                      // opcional string  requerido solo si tu unidad 'fluid' lo exige
//   fullWidthResponsive={true}        // opcional boolean  default true
//   adTest={true}                     // opcional boolean  default true en dev, false en prod
//   style={{ minHeight: 250 }}        // opcional React.CSSProperties  altura mínima sugerida
//   className="my-6"                  // opcional string  utilidad de margen
//   onRendered={() => { / tracking simple sin cerrar el comentario externo / }} // opcional función
// />

REQUISITOS DE INTEGRACIÓN:

1. Cargar el script UNA sola vez (ideal en el layout raíz):

   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1464924959291015" crossOrigin="anonymous"></script>
2. Este componente debe ser “use client” y llamar (adsbygoogle = window\.adsbygoogle || \[]).push({}) al montar.
3. En desarrollo, usa adTest=true para evitar impresiones reales (data-adtest='on').

NOTAS:

* Políticas: respeta las normas de AdSense (ubicación, densidad, contenido apto).
* Vacíos: a veces el bloque puede quedar en blanco si no hay inventario o no cumple criterios.
* Performance: evita cargar múltiples scripts; mantén un tamaño mínimo visible para el contenedor.
* Formatos:
  auto         → display adaptable
  fluid        → layouts responsivos; algunos requieren layoutKey
  autorelaxed  → Multiplex (reemplazo de matched content)
* SSR: no intentes render ni push en servidor; todo el efecto es client-side.

DEPENDENCIAS:

* Web API window y el script oficial de AdSense (pagead2.googlesyndication.com).
  ────────────────────────────────────────────────────────── */
