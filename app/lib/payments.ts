import { db, FieldValue } from '@/app/lib/firebaseAdmin';

// Normaliza montos: Stripe reporta en minor units (p.ej. cents)
function centsToMajor(v?: number | null) {
  if (typeof v !== 'number') return null;
  return Math.round(v) / 100;
}

type SaveExtra = { userId?: string | null; orderId?: string | null };

export async function saveStripePaymentByPI(pi: any, extra: SaveExtra = {}) {
  const paymentIntentId = pi?.id ?? 'unknown';
  const ref = db.collection('payments').doc(paymentIntentId);

  const charge = pi?.charges?.data?.[0] ?? null;
  const amountMinor = pi?.amount_received ?? pi?.amount ?? null;
  const currency = (pi?.currency ?? charge?.currency ?? '').toUpperCase() || null;

  const data = {
    provider: 'stripe',
    type: 'payment_intent',
    paymentIntentId,
    chargeId: charge?.id ?? null,
    status: pi?.status ?? charge?.status ?? null,          // 'succeeded', etc.
    amount_minor: amountMinor,
    amount: centsToMajor(amountMinor),
    currency,
    customerId: (pi?.customer ?? charge?.customer) ?? null,
    email: pi?.receipt_email ?? charge?.billing_details?.email ?? null,
    orderId: extra.orderId ?? null,
    userId: extra.userId ?? null,
    raw: pi,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),               // idempotente: merge no lo sobreescribe con serverTimestamp previo
  };

  await ref.set(data, { merge: true });
  return paymentIntentId;
}

export async function saveStripePaymentFromSession(session: any, extra: SaveExtra = {}) {
  const piId = session?.payment_intent ?? null;
  if (!piId) {
    // Sin PI: guarda por sessionId para no perder el rastro
    const ref = db.collection('payments').doc(session?.id ?? `sess_${Date.now()}`);
    await ref.set({
      provider: 'stripe',
      type: 'checkout_session',
      checkoutSessionId: session?.id ?? null,
      status: session?.payment_status ?? session?.status ?? null, // 'paid', etc.
      amount_minor: session?.amount_total ?? null,
      amount: centsToMajor(session?.amount_total),
      currency: (session?.currency ?? '').toUpperCase() || null,
      customerId: session?.customer ?? null,
      email: session?.customer_details?.email ?? null,
      orderId: extra.orderId ?? null,
      userId: extra.userId ?? null,
      raw: session,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return session?.id ?? null;
  }
  // Si hay PI, mejor guardamos por PI (canónico)
  return saveStripePaymentByPI(
    {
      id: piId,
      status: session?.payment_status === 'paid' ? 'succeeded' : session?.payment_status,
      amount_received: session?.amount_total,
      currency: session?.currency,
      customer: session?.customer,
      receipt_email: session?.customer_details?.email,
      charges: { data: [] }, // opcional; evitamos llamar API si no hace falta
    },
    extra,
  );
}

export async function savePayPalCapture(capture: any, extra: SaveExtra = {}) {
  const captureId = capture?.id ?? 'unknown';
  const ref = db.collection('payments').doc(captureId);

  const data = {
    provider: 'paypal',
    captureId,
    orderId:
      extra.orderId ??
      capture?.supplementary_data?.related_ids?.order_id ??
      null,
    status: capture?.status ?? null,                      // e.g. COMPLETED
    amount: capture?.amount?.value ?? null,
    currency: capture?.amount?.currency_code ?? null,
    payer:
      capture?.payer ?? {
        payer_id: capture?.seller_receivable_breakdown?.net_amount?.payer_id ?? null,
      },
    receipt: capture?.links ?? null,                      // links útiles
    raw: capture,                                         // payload completo
    userId: extra.userId ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(data, { merge: true });
  return captureId;
}

export async function logPayPalWebhook(event: any) {
  const id = event?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ref = db.collection('paypal_webhooks').doc(id);
  await ref.set(
    {
      eventId: id,
      type: event?.event_type ?? null,
      resourceId: event?.resource?.id ?? null,
      summary: event?.summary ?? null,
      receivedAt: FieldValue.serverTimestamp(),
      raw: event,
    },
    { merge: true }
  );
}

export function extractFirstCapture(orderOrCapture: any) {
  // /v2/checkout/orders/{id}/capture devuelve un "Order" con captures anidadas
  const cap =
    orderOrCapture?.purchase_units?.[0]?.payments?.captures?.[0] ?? null;
  return cap || orderOrCapture;
}