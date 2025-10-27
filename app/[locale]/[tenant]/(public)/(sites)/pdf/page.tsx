import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import PDFsPage from "./PDFsPage";
import { Suspense } from "react";

// ⬇ Esto le da metadata a la home usando la config central
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(pageMeta.home);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // 👈 OBLIGATORIO en Next 15
  return (
    <Suspense fallback={null}>
      <PDFsPage locale={locale} />
    </Suspense>
  );
}