// app/[locale]/(sites)/desuscritos/page.tsx
import type { Metadata, ResolvingMetadata } from "next";
import { Suspense } from "react";
import UnsubscribedPage from "./UnsubscribedPage";

// One-liner reutilizable (merge Global + Site + Página)
import { withPageMetadata } from "@/app/lib/seo/withPageMetadata";

// Firma correcta: (props, parent: ResolvingMetadata)
export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Reusamos el helper para routeKey "desuscritos"
  const fn = withPageMetadata({ routeKey: "desuscritos", pageMetaKey: "home" });
  const meta = await fn(props, parent);

  // Fallback utilitario: si nadie define robots → noindex,nofollow
  const anyMeta = meta as any;
  if (anyMeta.robots == null) anyMeta.robots = "noindex, nofollow";

  return meta;
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // Next 15: params es Promise
  return (
    <Suspense fallback={null}>
      <UnsubscribedPage locale={locale} />
    </Suspense>
  );
}