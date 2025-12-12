// app/ui/NIXINX.tsx
"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";

import GTMProvider from "@/app/providers/GTMProvider";
import FdvProvider from "@/app/providers/FdvProvider";
import BootGate from "@/app/providers/BootGate";
import { SessionBehaviorProvider } from "@/app/providers/SessionBehaviorProvider";
import { ContextProvider } from "@/context/AppContext";
import ThemeProviders from "@/app/providers/ThemeProviders";
import { AuthProvider } from "@/complements/components/AuthenticationComp/AuthContext";
import { NotificationsProvider } from "@/app/lib/notifications/provider";

import AppHydrators from "@/app/providers/AppHydrators";
import InterComp from "@/complements/components/InterComp/InterComp";
import NotificationPopupHost from "@/complements/components/Notifications/NotificationPopupHost";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

type Props = {
  children: ReactNode;
};

function resolveLocale(params: unknown): string {
  const p = params as Record<string, unknown> | null;
  const fromParams = typeof p?.locale === "string" ? p.locale : null;
  const fallback = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en").slice(0, 2);
  return (fromParams || fallback).toLowerCase();
}

export default function NIXINX({ children }: Props) {
  const params = useParams();
  const locale = resolveLocale(params);

  return (
    <GTMProvider>
      <FdvProvider>
        <BootGate>
          <SessionBehaviorProvider locale={locale}>
            <ContextProvider initialLocale={locale}>
              <ThemeProviders>
                <AuthProvider>
                  <NotificationsProvider>
                    <InterComp
                      Langs={[
                        { language: "Español", locale: "es", icon: "/Icons/es.png", country: "MXN", alt: "Español", prioritario: true, width: 35, height: 35, fill: false },
                        { language: "English", locale: "en", icon: "/Icons/en.png", country: "USA", alt: "English", prioritario: true, width: 35, height: 35, fill: false },
                        { language: "French", locale: "fr", icon: "/Icons/fr.png", country: "FR",  alt: "French",  prioritario: true, width: 40, height: 40, fill: false },
                      ]}
                      Position="fixed"
                      BackgroundColor="black"
                      Bottom="1rem"
                      Left="7px"
                      ShowLangs="oneBYone"
                    />

                    <AppHydrators />

                    {children}

                    <SpeedInsights />
                    <Analytics />
                    <NotificationPopupHost />
                  </NotificationsProvider>
                </AuthProvider>
              </ThemeProviders>
            </ContextProvider>
          </SessionBehaviorProvider>
        </BootGate>
      </FdvProvider>
    </GTMProvider>
  );
}
