// app/[locale]/(public)/plantilla/template.tsx
import "server-only";
import type { ReactNode } from "react";
import { toShort } from "@/app/lib/i18n/locale";
import { toLongForIntl as toLong } from "@/app/lib/i18n/adapters";
import { loadBrandingSSR } from "@/app/lib/branding/server";

type Props = { children: ReactNode; params: Record<string, string | undefined> };

export default async function Template({ children, params }: Props) {
  const long = toLong(params?.locale);
  const short = toShort(params?.locale);
  const branding = await loadBrandingSSR();
  const theme = (branding?.theme?.mode as "light" | "dark" | undefined) ?? "light";
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? null;

  const payload = { locale: { short, long }, branding, theme, gtmId };

  const script = `try{window.__BOOTSTRAP__=${JSON.stringify(payload)}}catch(_){};`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: script }} />
      {children}
    </>
  );
}
