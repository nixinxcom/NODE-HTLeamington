'use client';

import type { ReactNode } from 'react';

import GTMProvider from '@/app/providers/GTMProvider';
import { ContextProvider } from '@/context/AppContext';
import ThemeProviders from '@/app/providers/ThemeProviders';
import BrandingCacheHydrator from '@/app/providers/BrandingCacheHydrator';
import { AuthProvider } from '@/complements/components/AuthenticationComp/AuthContext';

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
          <BrandingCacheHydrator />
          <AuthProvider>{children}</AuthProvider>
        </ThemeProviders>
      </ContextProvider>
    </GTMProvider>
  );
}

export default CoreProviders;
