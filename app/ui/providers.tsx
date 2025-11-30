// app\ui\providers.tsx
'use client';

import type { ReactNode } from 'react';

import GTMProvider from '@/app/providers/GTMProvider';
import { ContextProvider } from '@/context/AppContext';
import ThemeProviders from '@/app/providers/ThemeProviders';
import { AuthProvider } from '@/complements/components/AuthenticationComp/AuthContext';
import { NotificationsProvider } from '@/app/lib/notifications/provider';
import FdvProvider from "@/app/providers/FdvProvider";
import NotificationPopupHost from "@/complements/components/Notifications/NotificationPopupHost";
import GlobalPromoHost from '@/complements/components/Notifications/GlobalPromoHost';

// Tipamos por inferencia desde tu propio ContextProvider
type AppProviderProps = React.ComponentProps<typeof ContextProvider>;
type CoreProvidersProps = {
  children: ReactNode;
} & Pick<AppProviderProps, 'initialLocale' | 'initialBranding' | 'initialSettings'>;

export function CoreProviders({
  children,
  initialLocale,
  initialBranding,
  initialSettings,
}: CoreProvidersProps) {
  return (
    <GTMProvider>
      <ContextProvider
        initialLocale={initialLocale}
        initialBranding={initialBranding}
        initialSettings={initialSettings}
      >
        <ThemeProviders>
          <FdvProvider>
            <AuthProvider>
              <NotificationsProvider>
                <GlobalPromoHost />
                {children}
                <NotificationPopupHost />
              </NotificationsProvider>
            </AuthProvider>
          </FdvProvider>
        </ThemeProviders>
      </ContextProvider>
    </GTMProvider>
  );
}

export default CoreProviders;
