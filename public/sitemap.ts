export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/app/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  const now = new Date().toISOString();

  // Rutas públicas mínimas; ajusta/expande si tienes listado por tenant.
  const routes = ['/'];

  return routes.map((p) => ({
    url: new URL(p, base).toString(),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: p === '/' ? 1 : 0.7,
  }));
}
