"use client";

import React, { useEffect, useMemo, useState } from "react";
import { IntlProvider } from "react-intl";
import { usePathname, useParams } from "next/navigation";
import { loadFMsGlobal, loadFMsPage } from "@/app/lib/i18n/store";
import { normalizeRouteKey } from "@/app/lib/i18n/utils";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

// Seeds TS (no JSON)
import seedDicts from "@/app/[locale]/[tenant]/i18n";
import { pickSeedDict } from "@/complements/data/ruleHelpers"; // elige exacto o base(lang)

// ===================== Normalizador a corto =====================
type Locale = "es" | "en" | "fr";

function toShort(input?: string | null): Locale {
  const s = String(input || "").toLowerCase();
  if (s.startsWith("es")) return "es";
  if (s.startsWith("fr")) return "fr";
  return "en";
}

// ===================== Cache por sesión =====================
const packCache = new Map<string, Record<string, string>>();

export default function I18nRouteProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale: routeParam } = useParams<{ locale?: string }>();

  // Default sin branding.json: NEXT_PUBLIC_DEFAULT_LOCALE -> heurística
  const brandDefaultShort: Locale = toShort(
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
      (Intl.DateTimeFormat().resolvedOptions().locale ?? "en")
  );

  // Locale efectivo por URL (si viene largo, se normaliza a corto)
  const short: Locale = toShort(routeParam);

  // Clave de página sin el primer segmento /{locale}
  const routeKey = useMemo(() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    const afterLocale = parts.slice(1).join("/");
    const raw = afterLocale ? `/${afterLocale}` : "/";
    return normalizeRouteKey(raw);
  }, [pathname]);

  // Seeds inmediatas por locale (TS) para evitar flash
  const seeds: Record<string, string> = useMemo(() => {
    // Preferimos corto
    const s = pickSeedDict(seedDicts as any, short) as Record<string, string> | undefined;
    if (s && Object.keys(s).length) return s;

    // Compat: si aún tienes seeds con claves largas, resolvemos aquí
    const compatMap = { es: "es", en: "en", fr: "fr" } as const;
    const legacy = pickSeedDict(seedDicts as any, compatMap[short]) as Record<string, string> | undefined;
    return legacy ?? {};
  }, [short]);

  // Estado con caché por (locale corto + routeKey)
  const cacheKey = `${short}|${routeKey}`;
  const [messages, setMessages] = useState<Record<string, string>>(
    () => packCache.get(cacheKey) || seeds
  );

  // Carga y merge: seeds + global + page (FS pisa seeds)
  useEffect(() => {
    let alive = true;
    (async () => {
      const [g, p] = await Promise.all([
        loadFMsGlobal(short),
        loadFMsPage(routeKey, short),
      ]);
      const merged = { ...seeds, ...g, ...p };
      packCache.set(cacheKey, merged);
      if (alive) setMessages(merged);
    })();
    return () => { alive = false; };
  }, [short, routeKey, seeds]);

  return (
    <IntlProvider
      key={`${brandDefaultShort}|${short}|${routeKey}`}
      locale={short}
      defaultLocale={brandDefaultShort}
      messages={messages}
      onError={() => { /* silenciar missing translation si quieres */ }}
    >
      {children}
    </IntlProvider>
  );
}
