'use client';

import StripeLoaderComp from './StripeLoaderComp';

function Points() {
  return (
    <StripeLoaderComp
      pricingTableId={process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID_POINTS!}
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    />
  );
}

function PrepaidMemberships() {
  return (
    <StripeLoaderComp
      pricingTableId={process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID_PREPAID!}
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    />
  );
}

function PromiseMemberships() {
  return (
    <StripeLoaderComp
      pricingTableId={process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID_PROMISE!}
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    />
  );
}

export { Points, PrepaidMemberships, PromiseMemberships };