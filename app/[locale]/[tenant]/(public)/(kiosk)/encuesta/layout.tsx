// app/[locale]/(kiosk)/encuesta/layout.tsx
import React from "react";
import KioskClient from "./KioskClient";
import s from "./Encuesta.module.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${s.kioskRoot} min-h-dvh w-dvw overflow-hidden select-none`}>
      <KioskClient />
      {children}
    </div>
  );
}


/* ─────────────────────────────────────────────────────────
DOC: Layout de encuesta (app/\[locale]/(kiosk)/encuesta/layout.tsx)
QUÉ HACE:
Layout envolvente exclusivo para las rutas del segmento "encuesta" dentro de (kiosk).
Define la estructura visual y provee el "slot" de contenido (children). Puede exportar
metadata/viewport específicos de la sección. No contiene lógica de UI por sí mismo.

API / PROPS (TypeScript):
type Props = {
children: React.ReactNode;                   // requerido
params?: { locale: 'es' | 'en' | 'fr' };     // opcional | locales soportados
};
export default function Layout(props: Props): JSX.Element

EXPORTS OPCIONALES:

* export const metadata: Metadata              // opcional | título, descripción, etc.
* export const viewport: Viewport              // opcional | themeColor, width, etc.

USO (ejemplo completo):
Estructura:
app/\[locale]/(kiosk)/encuesta/
layout.tsx   ← este archivo
page.tsx     ← quedará envuelto por el layout

Firma "conceptual" (Next lo invoca internamente):
Layout({
children: <EncuestaPage />,                  // requerido | React.ReactNode
params: { locale: 'es' }                     // opcional | 'es'|'en'|'fr'
})

Ejemplo de page.tsx mínimo (para visualizar el wrap del layout):
export default function Page() {
return <div>Encuesta</div>
}

Dónde poner KioskClient:

* Si quieres modo kiosko en TODAS las rutas de (kiosk), úsalo en app/\[locale]/(kiosk)/layout.tsx.
* Si solo aplica a "encuesta", crea un pequeño ClientWrapper con "use client" y colócalo dentro de este layout.

NOTAS:

* Los layouts en App Router son Server Components por defecto; no uses APIs del navegador aquí directamente.
* Para efectos de cliente (event listeners, etc.), usa un child con "use client".
* El orden de anidación es: root layout → \[locale] layout → (kiosk) layout → encuesta/layout → page.
* Puedes definir metadata/viewport específicos de la sección sin afectar otras rutas.

DEPENDENCIAS:

* Next.js App Router. Tipos Metadata/Viewport de "next".
  ────────────────────────────────────────────────────────── */
