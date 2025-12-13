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