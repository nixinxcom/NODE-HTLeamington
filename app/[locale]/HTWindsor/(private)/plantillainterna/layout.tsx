"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";
import { useAppContext, normalizeToSupported } from "@/context/AppContext";
import styles from "./page.module.css";
import AiComp from "@/complements/components/AiComp/AiComp";
import ThemeToggle from "@/complements/components/ThemeToggle/ThemeToggle";

type Boot = { theme?: "light" | "dark" };
declare global { interface Window { __BOOTSTRAP__?: Boot } }

export default function PlantillaLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<Record<string, string>>();
  const { Branding } = useAppContext();
  const { Settings } = useAppContext();
  const [boot, setBoot] = useState<Boot | null>(null);

  useEffect(() => { setBoot(window.__BOOTSTRAP__ ?? null); }, []);
  const theme =
    (boot?.theme ?? Settings?.website?.theme?.meta?.themeColor) === "dark" ? "dark" : "light";
  const themeClass = theme === "dark" ? styles.themeDark : styles.themeLight;

  // Locale normalizado (usar siempre este para montar el agente)
  const initialLocale = useMemo(
    () => normalizeToSupported(params?.locale ?? "es"),
    [params?.locale]
  );

  return (
    <main className={[styles.main, themeClass].join(" ")}>
      <Script id="hydrate-locale" strategy="beforeInteractive">
        {`try{localStorage.setItem('locale','${initialLocale}')}catch(e){}`}
      </Script>

      <ThemeToggle />
      {children}
      <div className={styles.aiBlock}>
        <AiComp
          agentId="elpatron-branding"
          title="El Patrón AI"
          avatarUrl="/Agents/elpatron/avatar.webp"
          fabIconUrl="/Agents/elpatron/fab.webp"
          sources={["branding"]}   // FDV: solo Providers/Branding con isAgentFDV:true
        />
      </div>
    </main>
  );
}
