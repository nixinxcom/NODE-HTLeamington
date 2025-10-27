export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/app/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: [`${base}/sitemap.xml`],
    host: base.replace(/^https?:\/\//, ''),
  };
}
