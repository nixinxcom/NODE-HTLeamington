// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // fija versión si quieres estabilidad de tipos
  // apiVersion: '2024-06-20',
});