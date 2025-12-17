// app/[locale]/layout.tsx  (Server Component)
import Script from "next/script";
import I18nRouteProvider from "../providers/I18nRouteProvider";

// SEO/Branding helpers (autocontenidos: leen seeds + Firestore)
import {
  loadBrandingSSR,
  buildVenueSchema,
  buildWebSiteSchema,
} from "@/app/lib/seo/schema";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

type Props = {
  children: React.ReactNode;
  // 👇 En Next 15, params es Promise<{...}>
  params: Promise<{ locale?: string }>;
};

// Helper server-safe (no depende de "use client")
function normalizeFromServer(input?: string | null): "es" | "en" | "fr" {
  return toShortLocale(input ?? DEFAULT_LOCALE_SHORT);
}

/** Convierte branding.theme → CSS vars SIN defaults (todo viene de seeds/branding.json) */
function cssVarsFromBranding(branding: any) {
  const theme = branding?.theme;
  if (!theme || typeof theme !== "object") return "";

  const toKebab = (s: string) =>
    s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[_\s]+/g, "-").toLowerCase();

  const asCssValue = (v: any) => (typeof v === "number" ? `${v}px` : String(v));

  const pairs: Array<[string, string]> = [];

  const walk = (obj: any, path: string[] = []) => {
    Object.entries(obj).forEach(([k, v]) => {
      if (v == null) return;
      const nextPath = [...path, toKebab(k)];
      if (typeof v === "object" && !Array.isArray(v)) {
        walk(v, nextPath);
      } else {
        const varName = `--brand-${nextPath.join("-")}`;
        pairs.push([varName, asCssValue(v)]);
      }
    });
  };

  walk(theme);

  if (!pairs.length) return "";

  const rules = pairs.map(([k, v]) => `${k}:${v}`).join(";");
  return `:root{${rules}} .brand{${rules}}`;
}


/** GTM (sólo si está configurado) */
function GTM({ gtmId }: { gtmId?: string }) {
  if (!gtmId) return null;
  const src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  const boot = `
  (function(w,d,s,l,i){w[l]=w[l]||[];
   w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
   var f=d.getElementsByTagName(s)[0], j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
   j.async=true; j.src='${src}'+dl; f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${gtmId}');
  `;
  return (
    <>
      <Script id="gtm" strategy="afterInteractive">{boot}</Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}

/** Expone el branding al cliente para que cualquier "use client" lo lea si lo necesita */
function BrandingBootstrap({ branding }: { branding: any }) {
  const json = JSON.stringify(branding ?? {});
  return (
    <Script id="branding-bootstrap" strategy="beforeInteractive">
      {`window.__BRANDING__=${json};`}
    </Script>
  );
}

export default async function LocaleLayout({ children, params }: Props) {
  // 👇 Evita el warning: “params should be awaited…”
  const p = await params;
  const initialLocale = normalizeFromServer(p?.locale);

  // 1) Branding efectivo (seeds + Firestore, prioridad FS)
  const branding = await loadBrandingSSR();

  // 2) JSON-LD (SSR). En nested layouts no tenemos <head>, así que lo inyectamos temprano.
  const [venueLD, websiteLD] = await Promise.all([
    buildVenueSchema({ locale: initialLocale }),
    buildWebSiteSchema({ locale: initialLocale }),
  ]);

  // 3) Variables CSS seguras desde branding.theme
  const cssVars = cssVarsFromBranding(branding);

  // 4) GTM (si existe)
  const gtmId =
    branding?.integrations?.gtmId ||
    branding?.integrations?.gtm ||
    branding?.integrations?.GTM ||
    undefined;

  return (
    <>
      {/* Persistimos el locale normalizado antes de hidratar */}
      <Script id="hydrate-locale" strategy="beforeInteractive">
        {`try{localStorage.setItem('locale','${initialLocale}')}catch(e){}`}
      </Script>

      {/* Variables CSS de branding (no altera tus estilos, sólo aporta --brand-*) */}
      <style id="brand-vars" dangerouslySetInnerHTML={{ __html: cssVars }} />

      {/* JSON-LD (en nested layout va en body pero igual es válido para crawlers modernos) */}
      <Script id="ld-venue" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(venueLD)}
      </Script>
      <Script id="ld-website" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(websiteLD)}
      </Script>

      {/* GTM si está configurado */}
      <GTM gtmId={gtmId} />

      {/* Branding en window para consumo en cliente (opcional si ya lo pasas por contexto propio) */}
      <BrandingBootstrap branding={branding} />

      {/* Proveedor con el locale inicial (SSR y cliente quedan alineados) */}
      <I18nRouteProvider>
        {children}
      </I18nRouteProvider>
    </>
  );
}
