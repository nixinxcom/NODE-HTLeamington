'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import BrandingTab from "@/complements/admin/BrandingTab";  // ADITIVO
import FM from '@/complements/i18n/FM';

const ALL_TABS = ['branding'] as const;
type TabKey = typeof ALL_TABS[number];

function useQueryTab() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = (sp.get('tab') ?? 'branding') as string;
  const tab: TabKey = (ALL_TABS as readonly string[]).includes(raw) ? (raw as TabKey) : 'branding';

  function setTab(next: TabKey) {
    const qs = new URLSearchParams(sp.toString());
    qs.set('tab', next);
    router.replace(`${pathname}?${qs.toString()}`);
  }

  return { tab, setTab };
}

export default function BrandingPage() {
  const { tab, setTab } = useQueryTab();

  return (
    <div className="w-full">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-white"><FM id="branding.title" defaultMessage="Marca" /></h1>
        <p className="text-sm text-neutral-600"><FM id="branding.description" defaultMessage="Administra branding, metadatos e i18n (FMs) para el sitio." /></p>
      </header>

      <div className="border-b border-neutral-200 mb-3">
        <nav className="flex gap-2">
          {ALL_TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'px-3 py-2 rounded-t-md text-sm transition-colors',
                  active
                    ? 'bg-white border border-neutral-200 border-b-white -mb-px text-neutral-900'
                    : 'bg-transparent hover:bg-neutral-100 text-neutral-600 border border-transparent',
                ].join(' ')}
              >
                <FM id="fms.tab.title" defaultMessage="Formatted Messages" />
              </button>
            );
          })}
        </nav>
      </div>

      <section className="rounded-md border border-neutral-200 bg-black  p-4">
        <div className={tab === 'branding' ? '' : 'hidden'}>
          <h2 className="font-medium mb-2 text-white"><FM id="branding.section.title" defaultMessage="Sección de Branding" /></h2>
          <p className="text-sm text-neutral-600"><FM id="branding.section.description" defaultMessage="Aquí irá la configuración de identidad visual." /></p>
          <BrandingTab />
        </div>
      </section>
    </div>
  );
}
