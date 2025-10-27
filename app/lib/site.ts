// app/lib/site.ts
export const IS_PROD = process.env.VERCEL_ENV === 'production';

function runtimeOrigin(): string | null {
  try {
    const { headers } = require('next/headers');
    const h = headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (!host) return null;
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`.replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function siteOrigin(): string {
  const fromReq = runtimeOrigin();
  if (fromReq) return fromReq;

  // ⇒ En build o lugares sin request cae a env
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_PROD_SITE_URL ||
    'http://localhost:3000';

  const normalized = /^https?:\/\//i.test(envUrl) ? envUrl : `https://${envUrl}`;
  return normalized.replace(/\/$/, '');
}

// (Opcional) si tu middleware setea headers x-tenant/x-locale, puedes exponer helpers aquí.
