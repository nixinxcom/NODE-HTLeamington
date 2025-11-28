// app/[locale]/(sites)/checkout/layout.tsx
// (server component – sin "use client")

import React from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { withPageMetadata } from "@/app/lib/seo/withPageMetadata";

// Export único con firma correcta (props, parent: ResolvingMetadata)
export async function generateMetadata(
  props: { params: Promise<{ locale?: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Reutilizamos el one-liner y luego añadimos el fallback de robots
  const fn = withPageMetadata({ routeKey: "checkout", pageMetaKey: "home" });
  const meta = await fn(props, parent);
  const anyMeta = meta as any;
  if (anyMeta.robots == null) anyMeta.robots = "noindex, nofollow"; // fallback utilitario
  return meta;
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
