import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe'; // si moviste lib/ a raíz: '@/lib/stripe'
import { saveStripePaymentByPI, saveStripePaymentFromSession } from '@/app/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'missing webhook secret' }, { status: 500 });

  // 1) Leer RAW body (obligatorio para verificar la firma)
  const raw = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    console.error('Stripe signature verify failed:', err?.message);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId =
          session?.client_reference_id ??
          session?.metadata?.uid ??
          null;

        // Guarda por session y, si trae payment_intent, lo normaliza a PI
        await saveStripePaymentFromSession(session, {
          orderId: session?.id ?? null,
          userId,
        });
        break;
      }

      case 'payment_intent.succeeded':
      case 'payment_intent.processing':
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const userId = pi?.metadata?.uid ?? null;

        await saveStripePaymentByPI(pi, {
          orderId: pi?.metadata?.orderId ?? null,
          userId,
        });
        break;
      }

      case 'charge.succeeded':
      case 'charge.refunded':
      case 'charge.failed': {
        // Si prefieres consolidar por PaymentIntent:
        const charge = event.data.object;
        if (charge?.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(charge.payment_intent as string, {
            expand: ['charges'],
          });
          const userId = pi?.metadata?.uid ?? null;

          await saveStripePaymentByPI(pi, {
            orderId: pi?.metadata?.orderId ?? null,
            userId,
          });
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        // Suscripciones: también normalizamos por PI
        const invoice = event.data.object;
        if (invoice?.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent as string, {
            expand: ['charges'],
          });
          const userId = pi?.metadata?.uid ?? invoice?.customer_email ?? null;

          await saveStripePaymentByPI(pi, {
            orderId: invoice?.id ?? null,
            userId,
          });
        }
        break;
      }

      default:
        // otros eventos: no-op
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Stripe webhook handler error:', e);
    // Si quieres reintentos, deja 500. Si no, devuelve 200 y loguea.
    return NextResponse.json({ error: e.message ?? 'webhook error' }, { status: 500 });
  }
}