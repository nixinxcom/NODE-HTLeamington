'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { IntlProvider } from 'react-intl';
import Providers from '../../app/ui/providers';
import InterComp from '../components/InterComp/InterComp';

type Messages = Record<string, string>;
type LocaleDict = Record<string, Messages>;

/** Estructura compatible con InterComp (no exporta su tipo) */
type ILanguage = {
  language?: string;
  locale: string;          // 'es' | 'es-MX' | 'en-US' | 'fr-CA'...
  icon?: string;
  country?: string;
  alt?: string;
  width?: number;
  height?: number;
  prioritario?: boolean;
};

export type CoreShellProps = {
  children: React.ReactNode;
  /** Fallback temporal de mensajes para maquetadores */
  localMessages?: LocaleDict;
  /** Si no hay nada, usa este (default del core) */
  coreDefaultLocale?: string;
  /** Mostrar/ocultar conmutador de idioma */
  showLocaleSwitcher?: boolean;
};

/* ───────────────── helpers ───────────────── */

function fromUrl(pathname: string): string | undefined {
  const seg = pathname.split('/').filter(Boolean)[0] ?? '';
  if (!seg) return undefined;
  return seg.replace('_', '-'); // en_US -> en-US
}

function fromRDD(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage.getItem('nixinx.locale') || undefined;
  } catch { return undefined; }
}

function labelOf(code: string): string {
  const v = code.toLowerCase();
  if (v.startsWith('es')) return 'es';
  if (v.startsWith('fr')) return 'fr';
  return 'en';
}

function buildLangs(): ILanguage[] {
  const raw = process.env.NEXT_PUBLIC_LANGS; // p.ej. "es-MX,en-US,fr-CA"
  const list = raw?.split(',').map(s => s.trim()).filter(Boolean);
  const base = (list?.length ? list : ['es-MX', 'en-US', 'fr-CA']);
  return base.map(code => ({ locale: code, language: labelOf(code) }));
}

/* ───────────────── CoreShell ───────────────── */

export default function CoreShell({
  children,
  localMessages,
  coreDefaultLocale = 'en',
  showLocaleSwitcher = true,
}: CoreShellProps) {
  const pathname = usePathname() || '/';
  const [rddLocale, setRddLocale] = useState<string | undefined>(undefined);

  useEffect(() => { setRddLocale(fromRDD()); }, []);

  const envDefault = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || coreDefaultLocale;
  const urlLocale  = fromUrl(pathname);
  const effective  = (rddLocale ?? urlLocale ?? envDefault);

  const messages = useMemo<Messages>(() => {
    return (localMessages?.[effective]) ?? {};
  }, [effective, localMessages]);

  const langs: ILanguage[] = useMemo(buildLangs, []);

  return (
    <IntlProvider locale={effective} defaultLocale={coreDefaultLocale} messages={messages}
        onError={(e) => {
          if ((e as any).code === 'MISSING_TRANSLATION') return;
          console.error(e);
        }}
      >
      <Providers initialLocale={effective}>
        {showLocaleSwitcher && <InterComp Langs={langs} />}
        {children}
      </Providers>
    </IntlProvider>
  );
}
