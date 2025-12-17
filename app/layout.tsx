// app/layout.tsx
import "./globals.css";

import type { Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import { withSitesLayoutMetadata } from "@/app/lib/seo/withPageMetadata";
import NIXINX from "./ui/NIXINXproviders";

export const generateMetadata = withSitesLayoutMetadata();

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
  display: "swap",
});

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

function toShort(v?: string) {
  const s = String(v || "").toLowerCase();
  if (s.startsWith("es")) return "es";
  if (s.startsWith("fr")) return "fr";
  return "en";
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = toShort(process.env.NEXT_PUBLIC_DEFAULT_LOCALE);
  const htmlLang = locale;

  const initialSlot: "light" | "dark" = "light";
  const themeColorLight = "#ffffff";
  const themeColorDark = "#0b0b0b";

  const cssVars = {} as React.CSSProperties;

  return (
    <html
      lang={htmlLang}
      data-theme={initialSlot}
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />

        {themeColorLight && (
          <meta
            name="theme-color"
            media="(prefers-color-scheme: light)"
            content={themeColorLight}
          />
        )}
        {themeColorDark && (
          <meta
            name="theme-color"
            media="(prefers-color-scheme: dark)"
            content={themeColorDark}
          />
        )}

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

        <Script id="pwa-register" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){
            window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})});
          }`}
        </Script>
      </head>

      <body className={inter.className} style={cssVars}>
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

        <Script id="theme-slot" strategy="beforeInteractive">
          {`
            (function(){
              var root = document.documentElement;
              try {
                var saved = localStorage.getItem("theme.slot");
                var slot  = (saved === "light" || saved === "dark") ? saved : "${initialSlot}";
                root.setAttribute("data-theme", slot);
                root.classList.toggle("dark", slot === "dark");
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
          <NIXINX locale={locale}>{children}</NIXINX>
        </Suspense>
      </body>
    </html>
  );
}
