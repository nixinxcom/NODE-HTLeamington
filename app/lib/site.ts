// app/lib/site.ts
export const IS_PROD = process.env.VERCEL_ENV === 'production';

const requireEnv = (v: string | undefined, name: string) => {
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
};

export function siteOrigin(): string {
  const base = process.env.NEXT_PUBLIC_PROD_SITE_URL ?? "http://localhost:3000";

  const selected: string = IS_PROD
    ? requireEnv(process.env.NEXT_PUBLIC_PROD_SITE_URL, 'NEXT_PUBLIC_PROD_SITE_URL')
    : base;

  return selected.replace(/\/$/, '');
}