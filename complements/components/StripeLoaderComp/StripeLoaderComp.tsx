'use client';

import { useEffect } from 'react';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface StripePricingTableProps {
  pricingTableId: string;
  publishableKey: string;
  clientReferenceId?: string;
  customerEmail?: string;
}

export default function StripeLoaderComp({
  pricingTableId,
  publishableKey,
  clientReferenceId,
  customerEmail,
}: StripePricingTableProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SCRIPT_ID = 'stripe-pricing-table-script';
    const exists = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!exists) {
      const s = document.createElement('script');
      s.id = SCRIPT_ID;
      s.async = true;
      s.src = 'https://js.stripe.com/v3/pricing-table.js';
      document.body.appendChild(s);
    }
  }, []);

  return (
    <stripe-pricing-table
      pricing-table-id={pricingTableId}
      publishable-key={publishableKey}
      client-reference-id={clientReferenceId}
      customer-email={customerEmail}
    />
  );
}

/* ─────────────────────────────────────────────────────────
DOC: StripeLoaderComp — complements/components/StripeLoaderComp/StripeLoaderComp.tsx
QUÉ HACE:
  Monta <Elements> de Stripe con un clientSecret, envuelve un slot (children) que incluye <PaymentElement>
  y expone un callback tras confirmación.

API / EXPORTS / RUTA:
  — export interface StripeLoaderProps {
      clientSecret: string; locale?: "es"|"en"|"fr"; appearance?: Record<string,any>;
      onResult?: (r:{status:string; paymentIntentId?:string; error?:string})=>void; className?: string; children?: React.ReactNode
    }
  — export default function StripeLoaderComp(p:StripeLoaderProps): JSX.Element

USO (ejemplo completo):
  "use client";
  import { Elements } from "@stripe/react-stripe-js";
  import { stripePromise, buildElementsOptions, confirmPayment } from "@/app/lib/stripe";
  <Elements stripe={stripePromise} options={buildElementsOptions({ clientSecret, locale:"es" })}>
    <StripeLoaderComp clientSecret={clientSecret} onResult={(r)=>console.log(r)}>
      {/* <PaymentElement/> dentro * /}
    </StripeLoaderComp>
  </Elements>

NOTAS CLAVE:
  — No calcular montos aquí. Manejar estados "processing/requires_action".
  — returnUrl HTTPS para redirecciones 3DS.

DEPENDENCIAS:
  @stripe/react-stripe-js · @stripe/stripe-js · "@/app/lib/stripe"
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/StripeLoaderComp/StripeLoaderComp.tsx
  "use client";
  import { Elements, PaymentElement } from "@stripe/react-stripe-js";
  import { stripePromise, buildElementsOptions, confirmPayment } from "@/app/lib/stripe";
  import StripeLoaderComp from "@/complements/components/StripeLoaderComp/StripeLoaderComp";

  export default function StripeCheckoutPage({ clientSecret }: { clientSecret: string }) {
    return (
      <Elements stripe={stripePromise} options={buildElementsOptions({ clientSecret, locale:"es" })}>
        <StripeLoaderComp
          clientSecret={clientSecret}                      // string | requerido
          locale="es"                                      // "es"|"en"|"fr" | opcional
          appearance={{ theme:"stripe" }}                  // Record<string,any> | opcional
          onResult={(r)=>console.log("Pago:", r)}          // (r)=>void | opcional
          className="max-w-md mx-auto"
        >
          <PaymentElement />
          <BUTTON
            onClick={async ()=>{ await confirmPayment({ elements: (window as any).__elements }); }}
            className="btn mt-4"
          >
            Pagar
          </BUTTON>
        </StripeLoaderComp>
      </Elements>
    );
  }
  // Nota: en práctica obtén `elements` con el hook useElements() dentro del hijo y llama confirmPayment allí.
────────────────────────────────────────────────────────── */
