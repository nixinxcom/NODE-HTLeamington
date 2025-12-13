'use client';

import { httpsCallable } from 'firebase/functions';
import { FbFunctions } from '../../app/lib/services/firebase';
import { loadStripe } from '@stripe/stripe-js';

// Nombres de las callables (verifica que coincidan con tu instancia de la Extension)
const createCheckoutSession = httpsCallable(
  FbFunctions,
  'ext-firestore-stripe-payments-createCheckoutSession'
);
const createSubscriptionCallable = httpsCallable(
  FbFunctions,
  'ext-firestore-stripe-subscriptions-createSubscription'
);
const createPortalLink = httpsCallable(
  FbFunctions,
  'ext-firestore-stripe-payments-createPortalLink'
);

type CheckoutParams = {
  price: string; // 'price_...'
  quantity?: number; // default 1
  mode?: 'payment' | 'subscription'; // default 'payment'
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, string>;
  allow_promotion_codes?: boolean;
  client_reference_id?: string;
  customer_email?: string;
};

export async function redirectToCheckout(params: CheckoutParams) {
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);
  if (!stripe) throw new Error('Stripe.js no pudo inicializarse');

  // Defaults de URLs (ajusta si quieres)
  const success_url =
    params.success_url ?? `${window.location.origin}/payments/success`;
  const cancel_url =
    params.cancel_url ?? `${window.location.origin}/payments/cancel`;

  const payload = {
    price: params.price,
    quantity: params.quantity ?? 1,
    mode: params.mode ?? 'payment',
    success_url,
    cancel_url,
    metadata: params.metadata ?? {},
    allow_promotion_codes: params.allow_promotion_codes ?? true,
    client_reference_id: params.client_reference_id,
    customer_email: params.customer_email,
  };

  const result = await createCheckoutSession(payload);
  const data = result.data as { id?: string; sessionId?: string; url?: string };

  // Extension suele devolver sessionId o id; a veces también url
  if (data?.url) {
    window.location.href = data.url;
    return;
  }

  const sessionId = data.sessionId ?? data.id;
  if (!sessionId) throw new Error('No se recibió sessionId/url de Stripe');

  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) throw error;
}

type SubscriptionParams = {
  price: string;
  payment_method?: string; // depende de tu callable
  metadata?: Record<string, string>;
};
export async function createStripeSubscription(params: SubscriptionParams) {
  const res = await createSubscriptionCallable(params);
  return res.data;
}

export async function openBillingPortal(returnUrl: string) {
  const res = await createPortalLink({ return_url: returnUrl });
  const { url } = (res.data as { url?: string }) ?? {};
  if (url) window.location.href = url;
}