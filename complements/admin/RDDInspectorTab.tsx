"use client";

import React from "react";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type ShortLocale = "es" | "en" | "fr";

const LOCALES: ShortLocale[] = ["es", "en", "fr"];

export default function RDDInspectorTab() {
  const [locale, setLocale] = React.useState<ShortLocale>("es");
  const [branding, setBranding] = React.useState<any>(null);
  const [settings, setSettings] = React.useState<any>(null);
  const [dict, setDict] = React.useState<Record<string, string>>({});
  const [q, setQ] = React.useState("");

  const fetchAll = React.useCallback(async (loc: ShortLocale) => {
    const [b, s, i] = await Promise.all([
      fetch(`/api/out/rdd/branding/${loc}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/out/rdd/settings`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/out/rdd/i18n/${loc}`, { cache: "no-store" }).then((r) => r.json()),
    ]);

    setBranding(b?.branding ?? b);
    setSettings(s?.settings ?? s);
    setDict(i?.dict ?? i ?? {});
  }, []);

  React.useEffect(() => {
    fetchAll(locale).catch(console.error);
  }, [locale, fetchAll]);

  const filteredEntries = React.useMemo(() => {
    const entries = Object.entries(dict || {});
    if (!q.trim()) return entries;
    const needle = q.toLowerCase();
    return entries.filter(([k, v]) => k.toLowerCase().includes(needle) || String(v).toLowerCase().includes(needle));
  }, [dict, q]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <H2 className="text-xl font-semibold">RDD Inspector</H2>
        <SELECT
          className="border rounded px-2 py-1"
          value={locale}
          onChange={(e) => setLocale(e.target.value as ShortLocale)}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </SELECT>
        <BUTTON
          className="ml-auto border rounded px-3 py-1"
          onClick={() => fetchAll(locale)}
          title="Refrescar"
        >
          Refresh
        </BUTTON>
      </div>

      {/* Branding */}
      <details className="rounded-lg border p-4" open>
        <summary className="cursor-pointer text-base font-medium">Branding ({locale})</summary>
        <pre className="mt-3 overflow-auto text-xs bg-black/5 p-3 rounded">{JSON.stringify(branding, null, 2)}</pre>
      </details>

      {/* Settings */}
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-base font-medium">Settings (global)</summary>
        <pre className="mt-3 overflow-auto text-xs bg-black/5 p-3 rounded">{JSON.stringify(settings, null, 2)}</pre>
      </details>

      {/* I18n */}
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-base font-medium">i18n ({locale})</summary>

        <div className="mt-3 flex items-center gap-2">
          <INPUT
            className="w-full border rounded px-2 py-1"
            placeholder="Filtrar por id o valor (contiene)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <SPAN className="text-xs opacity-70">{filteredEntries.length} / {Object.keys(dict || {}).length}</SPAN>
        </div>

        <div className="mt-3 max-h-[60vh] overflow-auto border rounded">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-black/5">
              <tr>
                <th className="text-left p-2 w-[40%]">id</th>
                <th className="text-left p-2">valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(([k, v]) => (
                <tr key={k} className="odd:bg-black/0 even:bg-black/5 align-top">
                  <td className="p-2 font-mono">{k}</td>
                  <td className="p-2 whitespace-pre-wrap">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
