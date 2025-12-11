// app/api/paypal/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FbDB } from '@/app/lib/services/firebase'; // ajusta ruta si la tuya es distinta

export const runtime = 'nodejs';

// Entorno PayPal
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

// ---------------------------------------------------------------------------
// Helper: obtener access_token de PayPal
// ---------------------------------------------------------------------------
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
// POST /api/paypal/create-order
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      amount,
      currency = 'CAD',
      intent = 'CAPTURE',
      metadata = {},
      locale,
      return_url,
      cancel_url,
    } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Missing amount' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    // Crear orden en PayPal
    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent,
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount,
            },
            custom_id: metadata?.orderRef ?? undefined,
          },
        ],
        application_context: {
          return_url,
          cancel_url,
          locale,
          brand_name: metadata?.tenantId ?? 'NIXINX',
        },
      }),
    });

    const order = await orderRes.json();

    if (!orderRes.ok || !order?.id) {
      console.error('PayPal create order error', order);
      return NextResponse.json(
        { error: order?.message || 'PayPal create order failed' },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------------------
    // Registrar en Firestore (status: created)
    // ---------------------------------------------------------------------
    try {
      const paymentRef = doc(FbDB, 'Payments', order.id);

    await setDoc(paymentRef, {
      orderId: order.id,
      source: 'paypal',
      tenantId: process.env.NIXINX_TENANT_ID ?? metadata?.tenantId ?? '',
      concept: metadata?.concept ?? null,
      amount: String(amount),
      currency,
      intent,
      status: 'created',
      metadata,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    } catch (err) {
      console.error('Error writing PayPal payment to Firestore', err);
      // no rompemos el flujo de pago si falla el log
    }

    return NextResponse.json({ id: order.id });
  } catch (err: any) {
    console.error('create-order error', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
