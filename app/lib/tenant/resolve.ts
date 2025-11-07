// app/lib/tenant/resolve.ts
export const DEFAULT_TENANT = process.env.NEXT_PUBLIC_FIREBASE_DEFAULT_TENANT || 'nixinx';

const TENANT_BY_HOST: Record<string, string> = {
  'localhost:3000': 'nixinx',
  'localhost:3001': 'nixinx',
  'localhost:3002': 'elpatronbarandgrill',
  'patronbarandgrill.com': 'elpatronbarandgrill',
  'www.patronbarandgrill.com': 'elpatronbarandgrill',
  // agrega los que necesites
};

export function resolveTenantFromHost(host?: string | null) {
  const h = (host || '').toLowerCase();
  return TENANT_BY_HOST[h] || DEFAULT_TENANT;
}
