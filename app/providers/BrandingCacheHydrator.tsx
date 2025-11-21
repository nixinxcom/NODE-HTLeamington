'use client';
import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { toShort } from '@/app/lib/i18n/locale';

const MAX_AGE_MS = (Number(process.env.CLIENT_RDD_CACHE_MIN) ?? 7) * 60 * 1000; // 7 min

export default function BrandingCacheHydrator() {
  const { Locale, setBranding, setSettings } = useAppContext();
  useEffect(() => {
    const short = toShort(Locale || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en'); // es|en|fr
    const key = `bss_effective:${short}`;

    // 1) Hidratar desde caché (instantáneo)
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.branding) setBranding(cached.branding);
        if (cached?.settings) setSettings(cached.settings);
      }
    } catch {}
    // 2) Refrescar si está viejo o no hay caché
    (async () => {
      try {
        let shouldFetch = true;
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const cached = JSON.parse(raw);
            if (cached?.updatedAt) {
              const age = Date.now() - new Date(cached.updatedAt).getTime();
              if (age < MAX_AGE_MS) shouldFetch = false;
            }
          }
        } catch {}
        if (!shouldFetch) return;
        const res = await fetch(`/api/bss-effective?locale=${encodeURIComponent(short)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.ok) {
          if (json.branding) setBranding(json.branding);
          if (json.settings) setSettings(json.settings);
          try {
            localStorage.setItem(key, JSON.stringify({
              branding: json.branding,
              settings: json.settings,
              styles: json.styles,
              updatedAt: json.updatedAt || new Date().toISOString(),
            }));
          } catch {}
        }
      } catch {}
    })();
  }, [Locale, setBranding, setSettings]);
  return null;
}