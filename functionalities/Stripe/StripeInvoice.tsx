'use client';

import { httpsCallable } from 'firebase/functions';
import { FbFunctions } from '../../app/lib/services/firebase';

// Verifica el nombre exacto en tu extensión instalada:
const sendStripeInvoice = httpsCallable(
  FbFunctions,
  'ext-firestore-stripe-invoices-sendInvoice'
);

type SendInvoiceParams = {
  customer: string; // 'cus_...'
  invoice?: string; // opcional
};

export async function sendInvoice(params: SendInvoiceParams) {
  try {
    const result = await sendStripeInvoice(params);
    return result.data;
  } catch (error) {
    console.error('Error al enviar factura:', error);
    throw error;
  }
}

/* ─────────────────────────────────────────────────────────
DOC: Stripe Invoice UI — functionalities/Stripe/StripeInvoice.tsx
QUÉ HACE:
  Muestra información de una factura/recibo y enlaza al Hosted Invoice Page (o Payment Link)
  generado en servidor. Útil para pagos diferidos o enviar recibos.

API / EXPORTS / RUTA:
  — export interface StripeInvoiceProps {
      invoiceId?: string                       // opcional | id de factura (si se consume desde API)
      hostedInvoiceUrl?: string                // opcional | URL absoluta ya lista
      amount?: number                          // opcional | centavos (solo display)
      currency?: "CAD"|"USD"                   // opcional | default: "CAD"
      status?: string                          // opcional | "draft"|"open"|"paid"|...
      onRefresh?: () => Promise<void>          // opcional
      className?: string
    }
  — export default function StripeInvoice(props: StripeInvoiceProps): JSX.Element

USO (ejemplo completo):
  "use client";
  <StripeInvoice hostedInvoiceUrl="https://pay.stripe.com/invoice/acct_..." amount={4500} currency="CAD" status="open" />

NOTAS CLAVE:
  — Seguridad: nunca exponer claves; invoiceUrl proviene del backend.
  — Estado: refrescar periódicamente si la factura puede cambiar de "open" a "paid".
  — Accesibilidad: mostrar monto/moneda legibles; botón “Pagar” con target seguro.

DEPENDENCIAS:
  Backend propio para crear facturas · Stripe Dashboard/Invoices
────────────────────────────────────────────────────────── */
