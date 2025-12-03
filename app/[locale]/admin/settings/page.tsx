'use client';
import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FMsTab from '@/complements/admin/FMsTab';
import MetaTab from "@/complements/admin/MetaTab";
import FM from '@/complements/i18n/FM';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

const ALL_TABS = ['metadatos', 'Formatted Messages'] as const;
type TabKey = typeof ALL_TABS[number];

function useQueryTab() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = (sp.get('tab') ?? 'metadatos') as string;
  const tab: TabKey = (ALL_TABS as readonly string[]).includes(raw) ? (raw as TabKey) : 'metadatos';

  function setTab(next: TabKey) {
    const qs = new URLSearchParams(sp.toString());
    qs.set('tab', next);
    router.replace(`${pathname}?${qs.toString()}`);
  }

  return { tab, setTab };
}

export default function SettingsPage() {
  const { tab, setTab } = useQueryTab();

  return (
    <div className="w-full">
      <header className="mb-4">
        <H1 className="text-xl font-semibold text-white"><FM id="settings.title" defaultMessage="Configuración" /></H1>
        <P className="text-sm text-neutral-600"><FM id="settings.description" defaultMessage="Administra Settings, metadatos e i18n (FMs) para el sitio." /></P>
      </header>

      <div className="border-b border-neutral-200 mb-3">
        <nav className="flex gap-2">
          {ALL_TABS.map((t) => {
            const active = tab === t;
            return (
              <BUTTON
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'px-3 py-2 rounded-t-md text-sm transition-colors',
                  active
                    ? 'bg-white border border-neutral-200 border-b-white -mb-px text-neutral-900'
                    : 'bg-transparent hover:bg-neutral-100 text-neutral-600 border border-transparent',
                ].join(' ')}
              >
                {t === 'metadatos' ? 'Metadatos' : 'Formatted Messages'}
              </BUTTON>
            );
          })}
        </nav>
      </div>

      <section className="rounded-md border border-neutral-200 bg-black  p-4">

        <div className={tab === 'metadatos' ? '' : 'hidden'}>
          <H2 className="font-medium mb-2 text-neutral-900"><FM id="metadatos.section.title" defaultMessage="Sección de Metadatos" /></H2>
          <P className="text-sm text-neutral-600"><FM id="metadatos.section.description" defaultMessage="SEO por ruta (título, descripción, OG, etc.)." /></P>
          <MetaTab />
        </div>

        <div className={tab === 'Formatted Messages' ? '' : 'hidden'}>
          <FMsTab />
        </div>
      </section>
    </div>
  );
}
