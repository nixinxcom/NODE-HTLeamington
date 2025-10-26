// app/lib/paypal.ts
import { toPayPalLocale, type PayPalRestLocale } from "@/app/lib/i18n/adapters";

export type CreateOrderOptions = {
  customId?: string | null;
  referenceId?: string | null;
  brandName?: string;
  locale?: PayPalRestLocale; // "es-ES" | "es-419" | "en-CA" | "fr-CA"
};

const BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${client}:${secret}`).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("PayPal auth failed");
  const data = await res.json();
  return data.access_token as string;
}

export async function createOrder(
  amount: string,
  currency = "CAD",
  opts: CreateOrderOptions = {}
) {
  const token = await getAccessToken();

  const purchaseUnit: any = {
    amount: { currency_code: currency, value: amount },
  };
  if (opts.customId) purchaseUnit.custom_id = opts.customId;
  if (opts.referenceId) purchaseUnit.reference_id = opts.referenceId;

  // Locale final: options.locale → adapters.toPayPalLocale() (derivado de env/headers)
  const locale: PayPalRestLocale = opts.locale ?? toPayPalLocale();

  const body: any = {
    intent: "CAPTURE",
    purchase_units: [purchaseUnit],
    // application_context sigue siendo usado por el Checkout clásico
    application_context: {
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
      brand_name: opts.brandName ?? process.env.NEXT_PUBLIC_BRAND_NAME ?? undefined,
      locale, // <<—— aquí también
    },
    // payment_source.paypal.experience_context es el canal moderno
    payment_source: {
      paypal: {
        experience_context: {
          locale, // <<—— y aquí
        },
      },
    },
  };

  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) throw new Error("PayPal create order failed");
  return res.json();
}

export async function captureOrder(orderID: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderID}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("PayPal capture failed");
  return res.json();
}

// (opcional) para leer el custom_id desde el webhook o conciliación manual:
export async function getOrder(orderID: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderID}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("PayPal get order failed");
  return res.json();
}