'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { IntlProvider } from 'react-intl';

import NIXINX from '../../app/ui/NIXINXproviders';
import InterComp from '../components/InterComp/InterComp';

type Messages = Record<string, string>;
type LocaleDict = Record<string, Messages>;

type ILanguage = {
  language?: string;
  locale: string;
  icon?: string;
  country?: string;
  alt?: string;
  width?: number;
  height?: number;
  prioritario?: boolean;
  fill?: boolean;
};

export type CoreShellProps = {
  children: React.ReactNode;
  localMessages?: LocaleDict;
  coreDefaultLocale?: string;
  showLocaleSwitcher?: boolean;
};

function fromUrl(pathname: string): string | undefined {
  const seg = pathname.split('/').filter(Boolean)[0] ?? '';
  if (!seg) return undefined;
  return seg.replace('_', '-');
}

function fromRDD(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage.getItem('nixinx.locale') || undefined;
  } catch {
    return undefined;
  }
}

function labelOf(code: string): string {
  const v = code.toLowerCase();
  if (v.startsWith('es')) return 'es';
  if (v.startsWith('fr')) return 'fr';
  return 'en';
}

function buildLangs(): ILanguage[] {
  const raw = process.env.NEXT_PUBLIC_LANGS; // "es-MX,en-US,fr-CA"
  const list = raw?.split(',').map(s => s.trim()).filter(Boolean);
  const base = (list?.length ? list : ['es-MX', 'en-US', 'fr-CA']);
  return base.map(code => ({ locale: code, language: labelOf(code) }));
}

function pickMessages(localMessages: LocaleDict | undefined, locale: string, coreDefault: string): Messages {
  if (!localMessages) return {};
  const short = labelOf(locale);
  const coreShort = labelOf(coreDefault);

  return (
    localMessages[locale] ??
    localMessages[short] ??
    localMessages[coreDefault] ??
    localMessages[coreShort] ??
    {}
  );
}

// ✅ puedes renombrar el componente a NIXINXShell si quieres
export default function NIXIN({
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

  const messages = useMemo(() => {
    return pickMessages(localMessages, effective, coreDefaultLocale);
  }, [effective, localMessages, coreDefaultLocale]);

  const langs: ILanguage[] = useMemo(buildLangs, []);

  return (
    <IntlProvider
      locale={effective}
      defaultLocale={coreDefaultLocale}
      messages={messages}
      onError={(e) => {
        if ((e as any).code === 'MISSING_TRANSLATION') return;
        console.error(e);
      }}
    >
      {/* ✅ NIXINX trae SessionBehaviorProvider y todo lo demás */}
      <NIXINX locale={effective} showLangSwitch={false}>
        {showLocaleSwitcher && <InterComp Langs={langs} />}
        {children}
      </NIXINX>
    </IntlProvider>
  );
}
