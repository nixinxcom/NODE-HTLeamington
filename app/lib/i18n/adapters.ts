// app/lib/i18n/adapters.ts
import type { Locale } from "./locale";
import { toShort } from "./locale";

export type PayPalRestLocale = "es-MX" | "en-CA" | "fr-CA";
export type PayPalSdkLocale  = "es_MX" | "en_CA" | "fr_CA";

/** Short por defecto desde env (NEXT_PUBLIC_DEFAULT_LOCALE), normalizado a 'es'|'en'|'fr' */
export function defaultShort(): Locale {
  const env = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";
  return toShort(env);
}

/** Para Intl.DateTimeFormat, formatters, etc. */
export function toLongForIntl(input?: string | null): "es-MX" | "en-US" | "fr-CA" {
  const s = toShort(input || defaultShort());
  if (s === "es") return "es-MX";
  if (s === "fr") return "fr-CA";
  return "en-US";
}

/** PayPal REST (application_context.locale) */
export function toPayPalLocale(input?: string | null): PayPalRestLocale {
  const s = toShort(input || defaultShort());
  if (s === "es") return "es-MX"; // usa 'es-ES' si tu principal es España
  if (s === "fr") return "fr-CA";
  return "en-CA";
}

/** PayPal JS SDK (data-locale con guion_bajo) */
export function toPayPalSdkLocale(input?: string | null): PayPalSdkLocale {
  return toPayPalLocale(input).replace("-", "_") as PayPalSdkLocale;
}

/** Stripe Elements acepta corto (‘auto’ opcional) */
export function toStripeLocale(input?: string | null): string {
  return toShort(input || defaultShort());
}
