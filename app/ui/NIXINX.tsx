// app/ui/NIXINX.tsx
"use client";

import type { ReactNode } from "react";

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

export type NIXINXProps = {
  children: ReactNode;
  locale?: string;
  showLangSwitch?: boolean;
};

function normalizeLocale(v?: string) {
  const s = String(v || "").toLowerCase();
  if (s.startsWith("es")) return "es";
  if (s.startsWith("fr")) return "fr";
  return "en";
}

export default function NIXINX({
  children,
  locale,
  showLangSwitch = true,
}: NIXINXProps) {
  const effectiveLocale = normalizeLocale(
    locale || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en",
  );

  return (
    <GTMProvider>
      <SpeedInsights />
      <FdvProvider>
        <BootGate>
          <SessionBehaviorProvider locale={effectiveLocale}>
            <ContextProvider initialLocale={effectiveLocale}>
              <ThemeProviders>
                <AuthProvider>
                  <NotificationsProvider>
                    {showLangSwitch ? (
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
                          {
                            language: "French",
                            locale: "fr",
                            icon: "/Icons/fr.png",
                            country: "FR",
                            alt: "French",
                            prioritario: true,
                            width: 40,
                            height: 40,
                            fill: false,
                          },
                        ]}
                        Position="fixed"
                        BackgroundColor="black"
                        Bottom="1rem"
                        Left="7px"
                        ShowLangs="oneBYone"
                      />
                    ) : null}

                    <AppHydrators />
                    {children}
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