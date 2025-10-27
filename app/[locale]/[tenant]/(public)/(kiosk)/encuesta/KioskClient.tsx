// app/[locale]/(kiosk)/encuesta/KioskClient.tsx
'use client';

import { useEffect } from 'react';

export default function KioskClient() {
  useEffect(() => {
    // Bloquear botón "Atrás"
    const lock = () => {
      try { history.pushState(null, '', location.href); } catch {}
    };
    lock();
    const onPop = () => lock();
    window.addEventListener('popstate', onPop);

    // Bloquear menú contextual
    const onCtx = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', onCtx);

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('contextmenu', onCtx);
    };
  }, []);

  return null;
}


/* ─────────────────────────────────────────────────────────
DOC: KioskClient
QUÉ HACE:
Habilita modo "kiosko" en cliente:

Bloquea el botón/navegación Atrás del navegador (history.pushState + evento popstate).

Desactiva el menú contextual del navegador (contextmenu).

Limpia listeners al desmontar. No renderiza UI (return null).

API / PROPS (TypeScript):
export default function KioskClient(): null
// No recibe props.

USO (ejemplo):
// Importa y monta dentro de la página o layout del kiosko.
import KioskClient from './KioskClient' // ajusta la ruta

export default function EncuestaPage() {
return (
<>
<KioskClient /> // sin props (no configurable)
// Resto de la UI de encuesta
</>
)
}

// Alternativa: colocarlo en app/[locale]/(kiosk)/layout.tsx
// para aplicarlo a todas las rutas del grupo (kiosk).

NOTAS:

Solo funciona en cliente ("use client"); no usar en Server Components.

No impide gestos del sistema operativo ni navegación externa.

En móviles, algunos long-press del SO pueden seguir activos.

UX: considera una salida para staff (hotkey oculta o ruta protegida).

Seguridad: bloquear el menú contextual es disuasivo, no una barrera real.

SEO/SSR: no afecta el HTML (return null), solo efectos en runtime.

DEPENDENCIAS:

Sin librerías externas. Usa Web APIs: window, history.

DETALLES TÉCNICOS:

history.pushState(null, '', location.href) inserta una entrada inerte en el stack.

El listener de popstate vuelve a ejecutar pushState para neutralizar el retroceso.

El listener de contextmenu llama e.preventDefault() para evitar el menú.
────────────────────────────────────────────────────────── */