// app/layout.tsx  ← SERVER COMPONENT (no "use client")
import GTMProvider from "@/app/providers/GTMProvider";
import type { Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/complements/components/AuthenticationComp/AuthContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ContextProvider } from "@/context/AppContext";
import InterComp from "@/complements/components/InterComp/InterComp";
import AppHydrators from "@/app/providers/AppHydrators";
import { withSitesLayoutMetadata } from "@/app/lib/seo/withPageMetadata";
import ThemeProviders from "./providers/ThemeProviders";
import BrandingCacheHydrator from "@/app/providers/BrandingCacheHydrator";
import { getBssEffectiveCached } from '@/app/lib/bss/server';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import { NotificationsProvider } from "@/app/lib/notifications/provider";
import './globals.css';

// 1) Metadata global para toda la app (usa tus defaults y, si tienes, FS/meta_*).
export const generateMetadata = withSitesLayoutMetadata();

// 2) Fuente
const inter = Inter({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-inter", display: "swap" });

// 3) Viewport (fallback estático; la regla de datos se inyecta dinámicamente en <head>)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/** overlay(a,b): merge no mutante donde gana b; arrays se reemplazan */
function overlay(a: any, b: any): any {
  if (b === undefined) return a;
  if (a === undefined) return b;
  if (Array.isArray(a) && Array.isArray(b)) return b.slice();
  if (a && typeof a === "object" && !Array.isArray(a) && b && typeof b === "object" && !Array.isArray(b)) {
    const out: any = { ...a };
    for (const k of Object.keys(b)) out[k] = overlay(a[k], b[k]);
    return out;
  }
  return b;
}

function cssVarsFromBranding(branding: any, settings?: any): React.CSSProperties {
  const mergedBranding =
  branding?.fonts || settings?.website?.fonts
    ? { ...branding, fonts: overlay(settings?.website?.fonts, branding?.fonts) }
    : branding;
  const out: Record<string, string> = {};
  const toKebab = (s: string) =>
    s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[_\s]+/g, "-").toLowerCase();
  const asCss = (v: any) => (typeof v === "number" ? `${v}px` : String(v));
  const walk = (obj: any, path: string[] = []) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
    for (const [k, v] of Object.entries(obj)) {
      const next = [...path, toKebab(k)];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        walk(v, next);
      } else if (v !== undefined && v !== null && String(v) !== "") {
        out[`--brand-${next.join("-")}`] = asCss(v);
      }
    }
  };
  if (mergedBranding?.theme) walk(mergedBranding.theme);
  if (mergedBranding?.colors) walk(mergedBranding.colors, ["colors"]); // compat (no defaults)
  if (mergedBranding?.fonts)  walk(mergedBranding.fonts,  ["fonts"]);  // compat (no defaults)
  return out as React.CSSProperties;
}

function toShort(v?: string) {
  const s = String(v || '').toLowerCase();
  if (s.startsWith('es')) return 'es';
  if (s.startsWith('fr')) return 'fr';
  return 'en';
}

export default async function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
  const DefaultLocale = toShort(process.env.NEXT_PUBLIC_DEFAULT_LOCALE);
  const { branding, settings } = await getBssEffectiveCached(DefaultLocale);
  const initialSlot = settings!.website!.theme!.initialSlot as "light"|"dark";
  const cssVars = cssVarsFromBranding(branding, settings);
  // Idioma del documento
  const locale = String(settings?.website?.i18n?.defaultLocale);
  const htmlLang = locale;

  // Theme color dinámico (desde settings) — integra regla de datos
  const themeColorLight = settings?.website?.theme?.meta?.themeColor?.light;
  const themeColorDark  = settings?.website?.theme?.meta?.themeColor?.dark;
  const suportedLanguages = settings?.agentAI?.languages;

  return (
    <html
      lang={htmlLang}
      data-theme={initialSlot}
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Manifest dinámico (app/manifest.ts → /manifest.webmanifest) */}
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Theme color dinámico (única fuente: settings) */}
        {themeColorLight && (
          <meta name="theme-color" media="(prefers-color-scheme: light)" content={themeColorLight} />
        )}
        {themeColorDark && (
          <meta name="theme-color" media="(prefers-color-scheme: dark)" content={themeColorDark} />
        )}

        {/* Google Tag Manager conteniendo a Google Analytics, Brevo Analytics, Facebook, X y TikTok Pixels */}
        {GTM_ID ? (
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
        ) : null}

        {/* Registro del Service Worker (SW en /public/sw.js) */}
        <Script id="pwa-register" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){
            window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})});
          }`}
        </Script>
      </head>

      {/* Aplicamos las variables del branding a TODO el sitio */}
      <body className={inter.className} style={cssVars}>
        {/* GTM – noscript iframe (correcto en <body>) */}
        {GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}

        {/* Pequeño script opcional para respetar preferencia previa del usuario */}
        <Script id="theme-slot" strategy="beforeInteractive">
          {`
            (function(){
              var root = document.documentElement;
              try {
                var saved = localStorage.getItem("theme.slot");
                var slot  = (saved === "light" || saved === "dark") ? saved : "${initialSlot}";
                root.setAttribute("data-theme", slot);
                root.classList.toggle("dark", slot === "dark");   // ← compat Tailwind/módulos
                try { root.style.colorScheme = slot; } catch(e){}
              } catch (_) {
                root.setAttribute("data-theme", "${initialSlot}");
                root.classList.toggle("dark", "${initialSlot}" === "dark");
                try { root.style.colorScheme = "${initialSlot}"; } catch(e){}
              }
            })();
          `}
        </Script>

        <Suspense fallback={null}>
          {/* Disparo de page_view SPA y Providers (se mantienen tal cual) */}
          <GTMProvider>
            <SpeedInsights/>
            <ContextProvider
              initialLocale={locale}
              initialBranding={branding}
              initialSettings={settings}
            >
              <ThemeProviders>
                <BrandingCacheHydrator/> 
                <AuthProvider>
                  <NotificationsProvider>
                    <InterComp
                      Langs={[
                        {
                          language: "Español",
                          locale: "es",
                          icon: "/Icons/es.png",
                          country: "MXN",
                          alt: "Español",
                          prioritario: true,
                          width: 35,
                          height: 35,
                          fill: false,
                        },
                        {
                          language: "English",
                          locale: "en",
                          icon: "/Icons/en.png",
                          country: "USA",
                          alt: "English",
                          prioritario: true,
                          width: 35,
                          height: 35,
                          fill: false,
                        },
                        // {
                        //   language: "French",
                        //   locale: "fr",
                        //   icon: "/Icons/fr.png",
                        //   country: "FR",
                        //   alt: "French",
                        //   prioritario: true,
                        //   width: 40,
                        //   height: 40,
                        //   fill: false,
                        // },
                      ]}
                      Position="fixed"
                      BackgroundColor="black"
                      Bottom="1rem"
                      Left="7px"
                      ShowLangs="oneBYone"
                    />
                    <AppHydrators />
                    {children}
                    <Analytics />
                  </NotificationsProvider>
                </AuthProvider>
              </ThemeProviders>
            </ContextProvider>
          </GTMProvider>
        </Suspense>
      </body>
    </html>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Root Layout global — app/layout.tsx
- Regla de datos aplicada: settings (alias/slot/locale/themeColor) + branding efectivo por locale.
- cssVarsFromBranding usa branding y, si falta, fonts desde settings.website.fonts (overlay).
- InterComp respetado tal cual.
- Viewport export es fallback; la versión dinámica viene de settings vía <meta name="theme-color">.
────────────────────────────────────────────────────────── */
