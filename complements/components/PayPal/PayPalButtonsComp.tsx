// complements/components/PayPal/PayPalButtonsComp.tsx
"use client";

import React from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  type ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Props = {
  amount: string | number;                // "2800.00" (unidades mayores)
  currency?: "CAD" | "MXN" | "USD";
  intent?: "CAPTURE" | "AUTHORIZE";
  locale?: string;                         // "es", "es_CA", "es-ES" (se normaliza)
  className?: string;

  /** Compatibilidad con tu page.tsx */
  createOrderUrl?: string;                 // default: /api/paypal/create-order
  captureOrderUrl?: string;                // default: /api/paypal/capture-order
  onApproved?: (d: any) => void;          // alias de onResult
  onError?: (e: any) => void;

  /** Opcionales “nuevos” */
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  onResult?: (r: any) => void;
};

function normalizeSdkLocale(input?: string): string | undefined {
  if (!input) return undefined;
  const cleaned = input.replace("-", "_");
  const [l, r] = cleaned.split("_");
  const loc = `${(l || "").toLowerCase()}${r ? "_" + r.toUpperCase() : ""}`;
  const supported = new Set([
    "en_CA","fr_CA","es_MX",
  ]);
  if (supported.has(loc)) return loc;
  const fb: Record<string, string> = {
    es: "es_MX", en: "en_CA", fr: "fr_CA",
  };
  return fb[(l || "").toLowerCase()] || "en_CA";
}

export default function PayPalButtonsComp(p: Props) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    console.error("Falta NEXT_PUBLIC_PAYPAL_CLIENT_ID");
    return null;
  }

  const currency = p.currency ?? "CAD";
  const intentLower = (p.intent ?? "CAPTURE").toLowerCase() as "capture" | "authorize";
  const amountStr = typeof p.amount === "number" ? p.amount.toFixed(2) : p.amount;
  const sdkLocale = normalizeSdkLocale(p.locale);

  const createOrderUrl = p.createOrderUrl || "/api/paypal/create-order";
  const captureOrderUrl = p.captureOrderUrl || "/api/paypal/capture-order";

  const options: ReactPayPalScriptOptions = {
    clientId,
    currency,
    intent: intentLower,
    components: "buttons",
    locale: sdkLocale,
  };

  const handleApproved = (d: any) => {
    p.onResult?.(d);
    p.onApproved?.(d);
  };

  return (
    <PayPalScriptProvider options={options}>
      <div className={p.className}>
        <PayPalButtons
          style={{ layout: "vertical", label: "paypal" }}
          forceReRender={[amountStr, currency, intentLower, sdkLocale]}
          createOrder={async () => {
            try {
              const res = await fetch(createOrderUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount: amountStr,
                  currency,
                  intent: intentLower.toUpperCase(), // "CAPTURE" | "AUTHORIZE"
                  locale: p.locale,
                  metadata: p.metadata,
                  return_url: p.returnUrl,
                  cancel_url: p.cancelUrl,
                }),
              });
              const data = await res.json();
              if (!res.ok || !data?.id) {
                throw new Error(data?.error || "create-order failed");
              }
              return data.id as string; // PayPal Order ID
            } catch (e) {
              p.onError?.(e);
              throw e;
            }
          }}
          onApprove={async (data) => {
            try {
              const res = await fetch(captureOrderUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderID, metadata: p.metadata }),
              });
              const out = await res.json();
              handleApproved(out);
            } catch (e) {
              p.onError?.(e);
            }
          }}
          onError={(err) => {
            console.error(err);
            p.onError?.(err);
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
