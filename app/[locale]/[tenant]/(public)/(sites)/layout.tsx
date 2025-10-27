'use client'
import NavBar from "@/complements/components/NavBar/NavBar";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Script from 'next/script';
import { useAppContext, normalizeToSupported } from '@/context/AppContext';
import { initNavAutoHide } from './pageFunctions';
import styles from "./page.module.css";
import AiComp from '@/complements/components/AiComp/AiComp';

export default function SitesLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ locale: string }>();
  const { setLocale, Branding, Settings } = useAppContext();
  const [navHidden, setNavHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Locale normalizado (usar siempre este para montar el agente)
  const initialLocale = useMemo(
    () => normalizeToSupported(params?.locale ?? 'es'),
    [params?.locale]
  );

  useEffect(() => {
    if (params?.locale) setLocale(normalizeToSupported(params.locale));
  }, [params?.locale, setLocale]);

  useEffect(() => {
    const stop = initNavAutoHide({
      selector: '#site-navbar',
      // container: 'main',
      downThreshold: 8,
      upThreshold: 4,
      topSafeZone: 56,
      lock: () => mobileMenuOpen,
      onChange: setNavHidden,
      debug: true,
    });
    return stop;
  }, [mobileMenuOpen, setNavHidden]);

  return (
    <>
      <header id="site-navbar" className={`${styles.header} ${navHidden ? styles.hidden : ''}`}>
        <NavBar
          onMenuToggle={(open: boolean) => setMobileMenuOpen(open)}
          Logo="/Icons/manifest_icons/icon-192x192-maskable.png"
          Botons={[
            { FormattedMessage: "nav.home", linkURL: "/", defaultMessage: "Inicio", openTarget: "local" },
            { FormattedMessage: "nav.reservacion", linkURL: "/reservas", defaultMessage: "Reservacion", openTarget: "local" },
            { FormattedMessage: "nav.menu", linkURL: "/menus", defaultMessage: "Menu", openTarget: "local" },
            { FormattedMessage: "home.cta.orderonline", linkURL: "https://order.tbdine.com/pickup/28824/menu", defaultMessage: "Ordena en Línea", openTarget: "external" },
            { FormattedMessage: "nav.gallery", linkURL: "/galeria", defaultMessage: "Gallería", openTarget: "local" },
            { FormattedMessage: "nav.AboutUs", linkURL: "/sobrenosotros", defaultMessage: "Acerca de Nosotros", openTarget: "local" },
            { FormattedMessage: "nav.callUs", linkURL: "tel:15193292838", defaultMessage: "Call Us", openTarget: "external" },
            { FormattedMessage: "nav.blog", linkURL: "/blog", defaultMessage: "Blog", openTarget: "local" },
          ]}
        />
      </header>

      <main>
        <Script id="hydrate-locale" strategy="beforeInteractive">
          {`try{localStorage.setItem('locale','${initialLocale}')}catch(e){}`}
        </Script>
        {children}
        {Settings?.faculties?.agentAI && <AiComp locale={initialLocale} />}
      </main>
    </>
  );
}
