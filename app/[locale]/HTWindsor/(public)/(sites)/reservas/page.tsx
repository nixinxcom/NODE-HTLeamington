import type { Metadata, ResolvingMetadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import ReservationsPage from "./ReservationsPage";
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
  const rec = await getEffectiveMetaServer("reservas", locale ?? "es", defaults);
  const override = metaRecordToNext(rec);
  return deepMerge(base, override as Metadata);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense fallback={null}>
      <ReservationsPage locale={locale} />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Reservations Page (app/\[locale]/(sites)/reservas/page.tsx)
QUÉ HACE:
Página de reservas por idioma. Normalmente:

* Lee parámetros de URL (fecha, hora, personas, mesa, cerca del escenario).
* Muestra el flujo de reserva (selección → detalles → pago/opcional → confirmación).
* Opcionalmente verifica y refleja el retorno del PSP (p. ej., Stripe) y el estado final.

RUTAS RESULTANTES:
/es/reservas   /en/reservas   /fr/reservas   — bajo el segmento (sites)

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'es'|'en'|'fr' }            // opcional — locale activo
searchParams?: Record\<string, string | string\[] | undefined> // opcional
}
export default function Page(props: Props): JSX.Element

SEARCH PARAMS TÍPICOS (ajusta a tu implementación real):
date=YYYY-MM-DD            // opcional — fecha deseada (ej. 2025-09-12)
time=HH\:mm                 // opcional — hora local (ej. 20:30)
party=2..12                // opcional — tamaño del grupo (número)
tableId=string             // opcional — id de mesa específica
nearStage=1|0              // opcional — preferencia cerca del escenario
name=string                // opcional — nombre del cliente
phone=string               // opcional — teléfono (E.164 recomendado)
email=string               // opcional — correo (para confirmación)
note=string                // opcional — petición especial
step=select|details|pay|confirm // opcional — etapa de UI
deposit=1|0                // opcional — si se requiere depósito
session\_id=string          // opcional — id de sesión de pago (retorno PSP)
status=success|canceled|error // opcional — estado post-pago
bookingId=string           // opcional — id de reserva (confirmada o en proceso)
ref=string                 // opcional — fuente (ej. homepage, gads)
utm\_\*                      // opcional — UTMs de campaña que puedes propagar

USO (patrón recomendado con un presentacional):
// Dentro del componente, mapea searchParams a variables de control
// const date = searchParams?.date ?? ''          — opcional
// const time = searchParams?.time ?? ''          — opcional
// const party = Number(searchParams?.party ?? '2')
// const step  = (searchParams?.step ?? 'select')
// Si usas un componente \<ReservationsPage ...>, pásale estos valores y manejadores.

FLUJO SUGERIDO:

1. select: mostrar disponibilidad por date/time/party (y filtros: nearStage).
2. details: recoger datos de contacto, términos y notas; validar formato e idioma.
3. pay (opcional): crear sesión de pago/deposito en el servidor; redirigir a PSP.
4. confirm: tras retorno (session\_id,status), verificar en servidor e imprimir confirmación con bookingId.

NOTAS:

* Page es Server Component por defecto; evita usar Web APIs del navegador aquí.
* Para interacciones (pickers, listeners, Stripe.js) usa un wrapper cliente con "use client".
* Valida siempre fecha/hora con zona horaria local (America/Toronto) y evita reservas pasadas.
* Idempotencia: al crear reservas/pagos, usa claves idempotentes para evitar duplicados.
* Propaga UTMs/gclid en enlaces/confirmaciones si necesitas atribución.
* Accesibilidad: formularios con labels claros; feedback de error semántico.
* SEO: página transaccional; enfoca en UX, no en indexación.
* Emails: confirma con número de reserva, fecha, hora y política de no-show/deposito si aplica.

DEPENDENCIAS (posibles):

* Next.js App Router (params, searchParams).
* Proveedor de pago (p. ej., Stripe) vía server actions o API routes.
* Fuente de disponibilidad (DB/Firestore/API) y lógica de asignación de mesas.
  ────────────────────────────────────────────────────────── */
