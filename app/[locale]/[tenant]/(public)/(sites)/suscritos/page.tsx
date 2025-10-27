import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import SubscribedPage from "./SubscribedPage";
import { Suspense } from "react";

// ⬇ Esto le da metadata a la home usando la config central
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(pageMeta.home);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // 👈 OBLIGATORIO en Next 15
  return (
    <Suspense fallback={null}>
      <SubscribedPage locale={locale} />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Suscritos Page (app/\[locale]/(sites)/suscritos/page.tsx)
QUÉ HACE:
Página para gestionar el estado de suscripción y confirmación de alta. Lee searchParams
como email, token, lista y estado; muestra mensajes de "confirmado", "pendiente de confirmación"
(double opt-in), "ya suscrito" o "error". Puede ofrecer gestión de preferencias.

RUTAS RESULTANTES:
/es/suscritos   /en/suscritos   /fr/suscritos   — segmento (sites)

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'es' | 'en' | 'fr' }   // opcional — locale activo
searchParams?: {
email?: string                            // opcional — correo normalizado para UI
token?: string                            // opcional — firma o nonce de verificación
list?: 'news' | 'events' | 'all'          // opcional — lista afectada
status?: 'confirmed' | 'pending' | 'already' | 'error' // opcional — estado a reflejar
reason?: 'optin' | 'import' | 'resub'     // opcional — motivo de alta
ref?: string                               // opcional — fuente (footer, popup, gads)
utm\_source?: string                        // opcional — tracking
utm\_medium?: string                        // opcional — tracking
utm\_campaign?: string                      // opcional — tracking
lang?: 'es' | 'en' | 'fr'                  // opcional — forzar idioma de UI
}
}
export default function Page(props: Props): JSX.Element

USO (conceptual):
// Acceso típico desde email de confirmación o redirecciones del ESP:
/es/suscritos?status=confirmed\&email=user%40mail.com\&list=news
/es/suscritos?status=pending\&email=user%40mail.com\&list=all
/es/suscritos?status=already\&email=user%40mail.com
// Invocación conceptual:
Page({
params: { locale: 'es' },            // opcional — 'es'|'en'|'fr'
searchParams: {
email: '[user@mail.com](mailto:user@mail.com)',            // opcional — string
token: 'abc123',                   // opcional — string
list: 'news',                      // opcional — 'news'|'events'|'all'
status: 'confirmed',               // opcional — 'confirmed'|'pending'|'already'|'error'
ref: 'footer'                      // opcional — string
}
})

FLUJO RECOMENDADO:
1  Verificar en servidor el token y aplicar alta en la lista elegida con idempotencia.
2  Determinar el estado resultante: confirmed, pending (double opt-in), already o error.
3  Renderizar el mensaje correspondiente y, si aplica, enlaces a gestionar preferencias.
4  Registrar auditoría mínima: hash del email, lista, timestamp e IP aproximada.

NOTAS:
— Page es Server Component por defecto; evita usar Web APIs del navegador aquí.
— La verificación y escritura en el ESP/DB debe ocurrir en el servidor (server action o route handler).
— Privacidad: no confirmes de forma explícita la existencia de correos no válidos; en UI puedes enmascarar email.
— CASL (Canadá): requiere consentimiento claro, identificación del remitente y mecanismo sencillo de baja.
— Atribución: si llegan UTMs o ref, propágalos en enlaces posteriores cuando sea útil.

DEPENDENCIAS (posibles):
— Next.js App Router para params y searchParams.
— Integración con el ESP (p. ej., Brevo) mediante server actions o API routes.
────────────────────────────────────────────────────────── */
