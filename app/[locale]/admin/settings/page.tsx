'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FMsTab from '@/complements/admin/FMsTab';
import MetaTab from "@/complements/admin/MetaTab";
import SettingsTab from "@/complements/admin/SettingsTab";
import FM from '@/complements/i18n/FM';
import RDDInspectorTab from "@/complements/admin/RDDInspectorTab";
import AgreementTab from '@/complements/admin/AgreementTab';
import EnvWizard from '@/complements/admin/EnvWizard';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

const ALL_TABS = ['environments', 'agreements', 'settings', 'metadatos', 'Formatted Messages', 'RDD Inspector'] as const;
type TabKey = typeof ALL_TABS[number];

function useQueryTab() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = (sp.get('tab') ?? 'settings') as string;
  const tab: TabKey = (ALL_TABS as readonly string[]).includes(raw) ? (raw as TabKey) : 'settings';

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
                {t === 'environments' ? 'Environments' : t === 'agreements' ? 'Agreements' : t === 'settings' ? 'Settings' : t === 'metadatos' ? 'Metadatos' : t === 'Formatted Messages' ? 'Formatted Messages' : 'RDD Inspector'}
              </BUTTON>
            );
          })}
        </nav>
      </div>

      <section className="rounded-md border border-neutral-200 bg-black  p-4">

        <div className={tab === 'environments' ? '' : 'hidden'}>
          <H2 className="font-medium mb-2 text-white"><FM id="environments.section.title" defaultMessage="Sección de Variables de Entorno" /></H2>
          <P className="text-sm text-neutral-600"><FM id="environments.section.description" defaultMessage="Aquí vá la configuración de las variables de entorno de la compañia." /></P>
          <EnvWizard />
        </div>

        <div className={tab === 'agreements' ? '' : 'hidden'}>
          <H2 className="font-medium mb-2 text-white"><FM id="agreements.section.title" defaultMessage="Sección de Contratacion" /></H2>
          <P className="text-sm text-neutral-600"><FM id="agreements.section.description" defaultMessage="Aquí vá la configuración del arreglo contractual con compañia." /></P>
          <AgreementTab />
        </div>
        
        <div className={tab === 'settings' ? '' : 'hidden'}>
          <H2 className="font-medium mb-2 text-white"><FM id="settings.section.title" defaultMessage="Sección de Configuración" /></H2>
          <P className="text-sm text-neutral-600"><FM id="settings.section.description" defaultMessage="Aquí vá la configuración de la compañia." /></P>
          <SettingsTab />
        </div>

        <div className={tab === 'metadatos' ? '' : 'hidden'}>
          <H2 className="font-medium mb-2 text-neutral-900"><FM id="metadatos.section.title" defaultMessage="Sección de Metadatos" /></H2>
          <P className="text-sm text-neutral-600"><FM id="metadatos.section.description" defaultMessage="SEO por ruta (título, descripción, OG, etc.)." /></P>
          <MetaTab />
        </div>

        <div className={tab === 'Formatted Messages' ? '' : 'hidden'}>
          <FMsTab />
        </div>

        <div className={tab === 'RDD Inspector' ? '' : 'hidden'}>
          <RDDInspectorTab />
        </div>
      </section>
    </div>
  );
}
