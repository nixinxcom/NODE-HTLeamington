/** @type {import('next-sitemap').IConfig} */

// Permitir require de seeds *.ts en este archivo CJS
try { require('ts-node/register/transpile-only'); } catch {}

// Usa settings.ts como fuente (puedes cambiar a branding.ts si quieres)
const settings = (() => {
  try {
    return require('./seeds/settings.ts').default;
  } catch {
    try { return require('./seeds/settings').default; } catch { return null; }
  }
})();

// 1) Resolver siteUrl (ENV → settings.website.url → localhost)
function resolveSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    '';

  const normEnv = envUrl
    ? (/^https?:\/\//i.test(envUrl) ? envUrl : `https://${envUrl}`)
    : '';

  const seedUrl = settings?.website?.url && /^https?:\/\//i.test(settings.website.url)
    ? settings.website.url
    : '';

  return (normEnv || seedUrl || 'http://localhost:3000').replace(/\/+$/, '');
}

// 2) Alternate refs (i18n)
function resolveAlternateRefs(baseUrl) {
  const supported = Array.isArray(settings?.website?.i18n?.supported)
    ? settings.website.i18n.supported
    : [];

  const refs = supported.map((hrefLang) => ({
    hrefLang,
    href: `${baseUrl}/${hrefLang}`,
  }));

  return refs.length ? refs : undefined;
}

// 3) Excluir dinámicamente páginas con noindex desde meta.pages.json
function resolveNoindexExcludes() {
  try {
    const pagesMeta = require('./seeds/meta.pages.json'); // { routeKey: { noindex?: true, path?: "/x" } }
    const keys = Object.keys(pagesMeta || {});
    const toExclude = [];
    for (const k of keys) {
      const cfg = pagesMeta[k];
      if (cfg?.noindex) {
        if (cfg.path) toExclude.push(cfg.path);
        else toExclude.push(`/${k}`);
      }
    }
    return toExclude;
  } catch {
    return [];
  }
}

const SITE_URL = resolveSiteUrl();
const ALTERNATE_REFS = resolveAlternateRefs(SITE_URL);

// Base excludes que casi siempre quieres fuera del sitemap:
const BASE_EXCLUDES = [
  '/api/*',
  '/admin/*',
  '/auth/*',
  '/maintenance',
  '/_next/*',
  '/server-sitemap.xml',
];

// Dinámicos desde meta.pages.json
const META_EXCLUDES = resolveNoindexExcludes();

module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: [...BASE_EXCLUDES, ...META_EXCLUDES],
  alternateRefs: ALTERNATE_REFS,
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }],
    // additionalSitemaps: [`${SITE_URL}/server-sitemap.xml`],
  },
};
