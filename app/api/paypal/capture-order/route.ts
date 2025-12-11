// app/api/paypal/capture-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FbDB } from '@/app/lib/services/firebase'; // ajusta ruta si es distinto

export const runtime = 'nodejs';

// Misma config que en create-order
const PAYPAL_ENV = process.env.PAYPAL_ENV ?? 'sandbox';

const PAYPAL_CLIENT_ID =
  PAYPAL_ENV === 'live'
    ? process.env.PAYPAL_LIVE_APIKEY
    : process.env.PAYPAL_SANDBOX_APIKEY;

const PAYPAL_SECRET =
  PAYPAL_ENV === 'live'
    ? process.env.PAYPAL_LIVE_SECRET
    : process.env.PAYPAL_SANDBOX_SECRET;

const PAYPAL_API_BASE =
  PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error('Missing PayPal credentials');
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    console.error('PayPal auth error', data);
    throw new Error('PayPal auth failed');
  }

  return data.access_token as string;
}

// ---------------------------------------------------------------------------
// POST /api/paypal/capture-order
// body: { orderId: string, metadata?: Record<string,string> }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, metadata = {} } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    const resCapture = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const capture = await resCapture.json();

    if (!resCapture.ok) {
      console.error('PayPal capture error', capture);
      return NextResponse.json(
        { error: capture?.message || 'PayPal capture failed' },
        { status: 500 }
      );
    }

    const pu = capture?.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];

    // ---------------------------------------------------------------------
    // Actualizar doc en Firestore: status, captureId, correo del pagador…
    // ---------------------------------------------------------------------
    try {
      const paymentRef = doc(FbDB, 'Payments', orderId);
      await updateDoc(paymentRef, {
        status: cap?.status ?? 'captured',
        captureId: cap?.id ?? null,
        payerEmail:
          capture?.payer?.email_address ??
          cap?.payer_email ??
          null,
        grossAmount: cap?.amount?.value ?? null,
        currency: cap?.amount?.currency_code ?? null,
        metadata,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating payment in Firestore', err);
    }

    return NextResponse.json({
      id: orderId,
      capture,
    });
  } catch (err: any) {
    console.error('capture-order error', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
