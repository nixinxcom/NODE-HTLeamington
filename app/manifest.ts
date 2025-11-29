// app/manifest.ts
import type { MetadataRoute } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { FbDB, FbStorage } from '@/app/lib/services/firebase';

export const dynamic = 'force-dynamic';

/* ───────────────────────── Tipados básicos ───────────────────────── */

type DisplayMode = 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
type DisplayOverride = DisplayMode | 'window-controls-overlay';
type Orientation =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

const DISPLAY: readonly DisplayMode[] = [
  'fullscreen',
  'standalone',
  'minimal-ui',
  'browser',
] as const;

const DISPLAY_OVERRIDE: readonly DisplayOverride[] = [
  ...DISPLAY,
  'window-controls-overlay',
] as const;

const ORIENTATIONS: readonly Orientation[] = [
  'any',
  'natural',
  'landscape',
  'portrait',
  'portrait-primary',
  'portrait-secondary',
  'landscape-primary',
  'landscape-secondary',
] as const;

type ManifestIcon = {
  src: string;
  sizes?: string;
  type?: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
};

type ManifestScreenshot = {
  src: string;
  sizes?: string;
  type?: string;
  form_factor?: 'wide' | 'narrow';
  label?: string;
};

/* ───────────────────────── Helpers genéricos ───────────────────────── */

function isOneOf<A extends readonly string[]>(
  arr: A,
  v: unknown,
): v is A[number] {
  return typeof v === 'string' && (arr as readonly string[]).includes(v as string);
}

function asArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * Extrae WIDTHxHEIGHT a partir de un nombre tipo:
 *   Logo_192x192.webp
 *   home-screenshot_1280x720.png
 */
function parseSizeFromName(name: string): { width: number; height: number } | null {
  const m = name.match(/_(\d+)x(\d+)\.[a-zA-Z0-9]+$/);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height };
}

function inferMimeType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'image/*';
  }
}

/**
 * Campos “translatable” guardados como:
 *   string  -> usar tal cual
 *   { es: '...', en: '...' } -> usar baseLocale, o .default, o vacío
 */
function unwrapTranslatable(val: any, baseLocale: string): string | undefined {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    const direct = obj[baseLocale] ?? obj.default;
    if (typeof direct === 'string') return direct;
  }
  return undefined;
}

/* ───────────────────────── Icons desde Storage ───────────────────────── */

async function buildIcons(): Promise<ManifestIcon[]> {
  try {
    const baseRef = ref(FbStorage, 'manifest/icons');
    const res = await listAll(baseRef);

    const all = await Promise.all(
      res.items.map(async (item) => {
        const size = parseSizeFromName(item.name);
        if (!size) return null;

        const src = await getDownloadURL(item);
        return {
          src,
          sizes: `${size.width}x${size.height}`,
          type: inferMimeType(item.name),
          purpose: 'any',
        } satisfies ManifestIcon;
      }),
    );

    return all.filter(Boolean) as ManifestIcon[];
  } catch (err) {
    console.error('[manifest] Error building icons from Storage', err);
    return [];
  }
}

/* ───────────────────────── Screenshots desde Storage ───────────────────────── */

async function buildScreenshots(appName: string): Promise<ManifestScreenshot[]> {
  try {
    const result: ManifestScreenshot[] = [];

    const collect = async (
      folder: string,
      formFactor: 'narrow' | 'wide',
      labelSuffix: string,
    ) => {
      const baseRef = ref(FbStorage, folder);
      const res = await listAll(baseRef);

      const entries = await Promise.all(
        res.items.map(async (item) => {
          const size = parseSizeFromName(item.name);
          if (!size) return null;

          const src = await getDownloadURL(item);
          const sizes = `${size.width}x${size.height}`;

          return {
            src,
            sizes,
            type: inferMimeType(item.name),
            form_factor: formFactor,
            label: `${appName} – ${labelSuffix}`,
          } satisfies ManifestScreenshot;
        }),
      );

      result.push(...(entries.filter(Boolean) as ManifestScreenshot[]));
    };

    // móvil (vertical)
    await collect(
      'manifest/screenshots/narrow',
      'narrow',
      'Pantalla principal (móvil)',
    );

    // escritorio (horizontal)
    await collect(
      'manifest/screenshots/wide',
      'wide',
      'Pantalla principal (escritorio)',
    );

    return result;
  } catch (err) {
    console.error('[manifest] Error building screenshots from Storage', err);
    return [];
  }
}

/* ───────────────────────── Categorías ───────────────────────── */

function buildCategories(raw: any, baseLocale: string): string[] | undefined {
  const arr = asArray<any>(raw?.categories);
  if (!arr.length) return undefined;

  const out: string[] = [];

  for (const item of arr) {
    if (typeof item === 'string') {
      out.push(item);
      continue;
    }
    if (item && typeof item === 'object') {
      const cat = unwrapTranslatable((item as any).category, baseLocale);
      if (cat) out.push(cat);
    }
  }

  return out.length ? out : undefined;
}

/* ───────────────────────── MANIFEST PRINCIPAL ───────────────────────── */

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // 1) Leer configuración PWA del tenant actual: FS = FDV
  const snap = await getDoc(doc(FbDB, 'Providers', 'pwa'));
  const pwa = (snap.exists() ? snap.data() : {}) as any;

  // defaultLocale (2 letras, ej: "es", "en", "fr")
  const defaultLocaleRaw =
    typeof pwa.defaultLocale === 'string' ? pwa.defaultLocale.trim() : '';
  const defaultLocale = (defaultLocaleRaw || 'en').toLowerCase();

  // Nombre público de la app
  const appName =
    (typeof pwa.appName === 'string' && pwa.appName.trim()) ||
    process.env.NEXT_PUBLIC_APP_NAME ||
    'App';

  const shortName =
    (typeof pwa.shortName === 'string' && pwa.shortName.trim()) || appName;

  // Descripción (usa campo translatable si lo llenas así)
  const description =
    unwrapTranslatable(pwa.description, defaultLocale) ||
    (typeof pwa.description === 'string' ? pwa.description : '') ||
    '';

  // Rutas base
  const startUrl =
    (typeof pwa.startUrl === 'string' && pwa.startUrl.trim()) ||
    `/${defaultLocale}`;

  const scope =
    (typeof pwa.scope === 'string' && pwa.scope.trim()) || '/';

  // Display / orientación
  const display: DisplayMode = isOneOf(DISPLAY, pwa.display)
    ? (pwa.display as DisplayMode)
    : 'standalone';

  const orientation: Orientation | undefined = isOneOf(
    ORIENTATIONS,
    pwa.orientation,
  )
    ? (pwa.orientation as Orientation)
    : undefined;

  // Colores:
  const themeColorFromBg =
    typeof pwa.backgroundColor === 'string' && pwa.backgroundColor.trim()
      ? pwa.backgroundColor.trim()
      : undefined;

  const themeColorFallback =
    pwa.themeColor === 'dark' ? '#000000' : '#ffffff';

  const theme_color = themeColorFromBg || themeColorFallback;
  const background_color = themeColorFromBg || theme_color;

  // 2) Cargar icons + screenshots desde Storage en runtime
  const [icons, screenshots] = await Promise.all([
    buildIcons(),
    buildScreenshots(appName),
  ]);

  // 3) Categorías (si las usas)
  const categories = buildCategories(pwa, defaultLocale);

  // 4) Manifest final para este tenant
  const manifest: MetadataRoute.Manifest = {
    name: appName,
    short_name: shortName,
    description,
    start_url: startUrl,
    scope,
    display,
    orientation,
    theme_color,
    background_color,
    icons,
    screenshots,
    ...(categories ? { categories } : {}),
  };

  return manifest;
}
