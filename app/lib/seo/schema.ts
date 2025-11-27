/**
 * JSON-LD (schema.org) helpers para SSR:
 *  - buildVenueSchema / buildVenueSchemaFrom: LocalBusiness (con geo + openingHoursSpecification)
 *  - buildWebSiteSchema / buildWebSiteSchemaFrom: WebSite (con publisher + inLanguage + SearchAction)
 *
 * Fuente de datos:
 *  - Lee branding efectivo ya resuelto por locale: FS > TSX(FM) > TSX.
 *
 * Importante:
 *  - Metatags (title/description/OG/Twitter) NO se gestionan aquí (viven en seeds/meta.*).
 */

type Dict = Record<string, any>;

export type BuildOptions = {
  locale?: string;              // ej. "es-MX"
  baseUrlForRelatives?: string; // base para absolutizar rutas si difiere de website.url
};

// Branding efectivo (SSR-safe)
// import { getBrandingEffectivePWA } from '@/complements/data/brandingFS';

// -----------------------------------------------------------------------------
// Utils básicos
// -----------------------------------------------------------------------------
const isStr = (v: any): v is string => typeof v === 'string' && v.trim().length > 0;
const isArr = Array.isArray;
const isNum = (v: any): v is number => typeof v === 'number' && !Number.isNaN(v);

const toArray = <T = any>(v: any): T[] => {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((x) => x != null) as T[];
  return [v];
};

const prune = (obj: any): any => {
  if (obj == null) return obj;
  if (Array.isArray(obj)) {
    const arr = obj
      .map(prune)
      .filter(
        (v) =>
          !(
            v == null ||
            (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)
          ),
      );
    return arr.length ? arr : undefined;
  }
  if (typeof obj === 'object') {
    const out: Dict = {};
    for (const [k, v] of Object.entries(obj)) {
      const pv = prune(v);
      if (pv !== undefined && !(typeof pv === 'string' && pv.trim() === '')) out[k] = pv;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return obj;
};

const absolutizeUrl = (maybeUrl: any, base?: string): string | undefined => {
  if (!isStr(maybeUrl)) return undefined;
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  if (maybeUrl.startsWith('//')) return `https:${maybeUrl}`;
  if (base && isStr(base)) {
    try {
      return new URL(maybeUrl, base).toString();
    } catch {
      /* ignore */
    }
  }
  return maybeUrl;
};

// Resolve locale sin hardcode: param → env → LC_* / LANG → Intl → en-US
function resolveLocale(input?: string): string {
  // Toma input/env/heurística y normaliza a SHORT ("es" | "en" | "fr")
  const raw =
    input ??
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ??
    (process.env.LC_ALL ||
      process.env.LC_MESSAGES ||
      process.env.LANG ||
      process.env.LANGUAGE)?.replace(/\.UTF-8$/i, "").replace(/_/g, "-") ??
    Intl.DateTimeFormat().resolvedOptions().locale ??
    "en";

  const short = String(raw).toLowerCase().split(/[-_]/)[0]; // -> "es" | "en" | "fr" | otro

  // Fallback a "en" si no es uno de los soportados
  return short === "es" || short === "fr" ? short : "en";
}


// -----------------------------------------------------------------------------
// Día de la semana → schema.org URI
// -----------------------------------------------------------------------------
const DAY_MAP: Record<string, string> = {
  mon: 'https://schema.org/Monday',
  monday: 'https://schema.org/Monday',
  lunes: 'https://schema.org/Monday',
  tue: 'https://schema.org/Tuesday',
  tuesday: 'https://schema.org/Tuesday',
  martes: 'https://schema.org/Tuesday',
  wed: 'https://schema.org/Wednesday',
  wednesday: 'https://schema.org/Wednesday',
  miercoles: 'https://schema.org/Wednesday',
  miércoles: 'https://schema.org/Wednesday',
  thu: 'https://schema.org/Thursday',
  thursday: 'https://schema.org/Thursday',
  jueves: 'https://schema.org/Thursday',
  fri: 'https://schema.org/Friday',
  friday: 'https://schema.org/Friday',
  viernes: 'https://schema.org/Friday',
  sat: 'https://schema.org/Saturday',
  saturday: 'https://schema.org/Saturday',
  sabado: 'https://schema.org/Saturday',
  sábado: 'https://schema.org/Saturday',
  sun: 'https://schema.org/Sunday',
  sunday: 'https://schema.org/Sunday',
  domingo: 'https://schema.org/Sunday',
};

const toDayUri = (s: any): string | undefined => {
  if (!isStr(s)) return undefined;
  const key = s.trim().toLowerCase();
  return DAY_MAP[key] || undefined;
};

// -----------------------------------------------------------------------------
// Horarios → OpeningHoursSpecification[]
// -----------------------------------------------------------------------------
const toOpeningHoursSpec = (hours: any): any[] | undefined => {
  if (!hours) return undefined;
  const specs: any[] = [];

  // Array de objetos { dayOfWeek|days, open(s), close(s) }
  if (Array.isArray(hours)) {
    for (const entry of hours) {
      const days = toArray(entry?.dayOfWeek ?? entry?.days).map(toDayUri).filter(Boolean) as string[];
      const opens = entry?.opens ?? entry?.open;
      const closes = entry?.closes ?? entry?.close;
      if (days.length && isStr(opens) && isStr(closes)) {
        specs.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: days,
          opens,
          closes,
        });
      }
    }
    return specs.length ? specs : undefined;
  }

  // Mapa por día: { mon: "09:00-17:00" | ["09:00-13:00","15:00-18:00"], ... }
  if (typeof hours === 'object') {
    for (const [k, v] of Object.entries(hours)) {
      const day = toDayUri(k);
      if (!day) continue;
      const slots = toArray(v);
      for (const slot of slots) {
        if (!isStr(slot)) continue;
        const [opens, closes] = slot.split('-').map((s) => s?.trim());
        if (isStr(opens) && isStr(closes)) {
          specs.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [day],
            opens,
            closes,
          });
        }
      }
    }
    return specs.length ? specs : undefined;
  }

  return undefined;
};

// -----------------------------------------------------------------------------
// Address → PostalAddress
// -----------------------------------------------------------------------------
const toPostalAddress = (addr: any): any | undefined => {
  if (!addr) return undefined;

  if (isStr(addr)) {
    return prune({
      '@type': 'PostalAddress',
      streetAddress: addr,
    });
  }

  const streetAddress =
    addr?.streetAddress || addr?.addressLine1 || addr?.line1 || addr?.street || addr?.calle || undefined;

  const addressLocality = addr?.locality || addr?.city || addr?.ciudad || undefined;
  const addressRegion = addr?.region || addr?.state || addr?.provincia || addr?.province || undefined;
  const postalCode = addr?.postalCode || addr?.zip || addr?.cp || undefined;
  const addressCountry = addr?.country || addr?.pais || addr?.país || undefined;

  return prune({
    '@type': 'PostalAddress',
    streetAddress,
    addressLocality,
    addressRegion,
    postalCode,
    addressCountry,
  });
};

// -----------------------------------------------------------------------------
// Socials → sameAs[]
// -----------------------------------------------------------------------------
const toSameAs = (branding: any, baseUrl?: string): string[] | undefined => {
  const socials = branding?.socials || branding?.website?.socials || branding?.contact?.socials || {};
  const candidates = [
    socials?.facebook,
    socials?.instagram,
    socials?.twitter,
    socials?.x,
    socials?.tiktok,
    socials?.youtube,
    socials?.linkedin,
    socials?.pinterest,
    socials?.yelp,
    socials?.tripadvisor,
    socials?.whatsapp,
    socials?.telegram,
    socials?.threads,
    socials?.maps,
  ];
  const base = baseUrl || branding?.website?.url;
  const urls = candidates.map((u) => absolutizeUrl(u, base)).filter((u): u is string => isStr(u));
  return urls.length ? urls : undefined;
};

// -----------------------------------------------------------------------------
// Normalización brand-like (compat con branding.brand)
// -----------------------------------------------------------------------------
const normalizeBrand = (raw: any, opts?: BuildOptions): any => {
  if (!raw || typeof raw !== 'object') return {};

  const directBrand = raw?.brand && typeof raw.brand === 'object' ? { ...raw.brand } : null;

  const company = raw?.company || {};
  const contact = raw?.contact || {};
  const website = raw?.website || {};
  const maps = raw?.maps || raw?.location || {};
  const hours = raw?.hours || contact?.hours || raw?.schedule;

  const name = company?.brandName || company?.legalName || directBrand?.name;
  const alternateName =
    company?.legalName && company?.brandName && company?.legalName !== company?.brandName
      ? company?.legalName
      : directBrand?.alternateName || undefined;

  const baseUrl = opts?.baseUrlForRelatives || website?.url || directBrand?.url;
  const logo = absolutizeUrl(company?.logo || website?.logo || directBrand?.logo || directBrand?.image, baseUrl);
  const image = absolutizeUrl(directBrand?.image || company?.image || website?.ogImage, baseUrl);
  const url = absolutizeUrl(website?.url || directBrand?.url, baseUrl);
  const telephone = contact?.phone || contact?.telephone || directBrand?.telephone;

  const address = toPostalAddress(contact?.address || directBrand?.address);
  const sameAs = directBrand?.sameAs || toSameAs(raw, baseUrl);

  const geo = ((): any => {
    const lat = maps?.lat ?? maps?.latitude;
    const lng = maps?.lng ?? maps?.longitude;
    if (isNum(lat) && isNum(lng)) {
      return { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
    }
    return undefined;
  })();

  const servesCuisineArr = toArray(company?.cuisine || directBrand?.servesCuisine).filter(isStr);
  const priceRange = company?.priceRange || directBrand?.priceRange;
  const openingHoursSpecification = toOpeningHoursSpec(hours);

  const brandLike = prune({
    name,
    alternateName,
    url,
    image,
    logo,
    telephone,
    address,
    sameAs,
    servesCuisine: servesCuisineArr.length ? servesCuisineArr : undefined,
    priceRange,
    geo,
    openingHoursSpecification,
  });

  return directBrand ? prune({ ...brandLike, ...directBrand }) : brandLike;
};

// -----------------------------------------------------------------------------
// Carga de branding efectivo (FS > TSX(FM) > TSX) y builders
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Carga de branding efectivo (FS > FDV) – STUB sin dependencia a brandingFS
// -----------------------------------------------------------------------------
// OJO: por ahora devolvemos un objeto vacío para que los builders no rompan.
// Cuando quieras, aquí implementamos un fetch SSR directo a Firestore
// (Providers/Branding) alineado al FDV.
export const getEffectiveBrandingServer = async (locale?: string): Promise<any> => {
  const _loc = resolveLocale(locale);
  return {
    // estructura mínima para que los accesos opcionales no revienten
    company: {},
    contact: {},
    website: {},
    socials: [],
    platforms: [],
    schedule: [],
  };
};

// Compat SSR
export const loadBrandingSSR = getEffectiveBrandingServer;


// Builders (sync) a partir de un branding YA efectivo
export function buildVenueSchemaFrom(branding: Dict, options?: BuildOptions): Dict {
  const brand = normalizeBrand(branding, options);
  const out = prune({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: brand?.name,
    alternateName: brand?.alternateName,
    url: brand?.url,
    image: brand?.image || brand?.logo,
    telephone: brand?.telephone,
    address: brand?.address,
    geo: brand?.geo,
    priceRange: brand?.priceRange,
    servesCuisine: brand?.servesCuisine,
    sameAs: brand?.sameAs,
    hasMap: (() => {
      if (brand?.geo) {
        const lat = brand.geo.latitude;
        const lng = brand.geo.longitude;
        if (isNum(lat) && isNum(lng)) {
          return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        }
      }
      return undefined;
    })(),
    openingHoursSpecification: brand?.openingHoursSpecification,
  });
  return out || {};
}

export function buildWebSiteSchemaFrom(branding: Dict, options?: BuildOptions): Dict {
  const brand = normalizeBrand(branding, options);
  const baseUrl = options?.baseUrlForRelatives || branding?.website?.url || brand?.url;

  const publisherOrg = prune({
    '@type': 'Organization',
    name: branding?.company?.brandName || branding?.company?.legalName || brand?.name,
    logo: prune(
      ((): any => {
        const logoUrl = absolutizeUrl(
          branding?.company?.logo || branding?.website?.logo || brand?.logo || brand?.image,
          baseUrl,
        );
        return logoUrl ? { '@type': 'ImageObject', url: logoUrl } : undefined;
      })(),
    ),
  });

  const searchTarget = ((): string | undefined => {
    const site = branding?.website || {};
    const siteUrl = absolutizeUrl(site?.url || brand?.url, baseUrl);
    if (!siteUrl) return undefined;

    const path = site?.searchPath;
    if (isStr(path)) {
      try {
        const url = new URL(path, siteUrl);
        if (!url.toString().includes('{search_term_string}')) {
          const sep = url.search ? '&' : '?';
          return `${url.toString()}${sep}q={search_term_string}`;
        }
        return url.toString();
      } catch {
        /* ignore */
      }
    }
    return `${siteUrl}?q={search_term_string}`;
  })();

  const websiteSchema = prune({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand?.name,
    url: absolutizeUrl(brand?.url, baseUrl),
    image: absolutizeUrl(brand?.image || brand?.logo, baseUrl),
    inLanguage: options?.locale || resolveLocale(undefined),
    publisher: publisherOrg,
    potentialAction: searchTarget
      ? {
          '@type': 'SearchAction',
          target: searchTarget,
          'query-input': 'required name=search_term_string',
        }
      : undefined,
  });

  return websiteSchema || {};
}

// Builders (async) autoabastecidos
export async function buildVenueSchema(options?: BuildOptions): Promise<Dict> {
  const branding = await getEffectiveBrandingServer(options?.locale);
  return buildVenueSchemaFrom(branding, options);
}

export async function buildWebSiteSchema(options?: BuildOptions): Promise<Dict> {
  const branding = await getEffectiveBrandingServer(options?.locale);
  return buildWebSiteSchemaFrom(branding, options);
}
