import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/app/lib/site';

const LOCALES = ['es','en','fr'] as const;
type L = typeof LOCALES[number];
const DEFAULT: L = process.env.DEFAULT_LOCALE as L || 'en';
const SITE_URL = siteOrigin();

const I18N_PAGES = ['/', '/menus', '/reservas', '/galeria', '/sobrenosotros', '/land', '/testings', '/encuesta'];
const SINGLE: Partial<Record<L,string[]>> = {
  es: ['/landingesp'],
  en: ['/landingeng'],
  fr: ['/landingfra'],
};

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const i18n = I18N_PAGES.map((path) => {
    const normalized = path === '/' ? '' : path;
    const byLocale = Object.fromEntries(LOCALES.map(l => [l, `${SITE_URL}/${l}${normalized}`]));
    const canonical = byLocale[DEFAULT];
    return {
      url: canonical,
      lastModified: now,
      alternates: { languages: { ...byLocale, 'x-default': canonical } },
    };
  });

  const single = LOCALES.flatMap((l) =>
    (SINGLE[l] ?? []).map((path) => ({ url: `${SITE_URL}/${l}${path}`, lastModified: now }))
  );

  return [...i18n, ...single];
}