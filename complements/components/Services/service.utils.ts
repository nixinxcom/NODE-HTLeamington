import type { Translatable } from './service.types';

/**
 * Toma el valor base para el locale.
 * - Si es string, regresa string.
 * - Si es map, intenta: exact locale, short locale, '*', 'default', 'es', primer valor.
 */
export function pickT(
  v: Translatable | undefined,
  locale: string,
  fallback: string = '',
): string {
  if (!v) return fallback;
  if (typeof v === 'string') return v;
  const short = locale.split('-')[0].toLowerCase();
  return (
    v[locale] ??
    v[short] ??
    v['*'] ??
    v['default'] ??
    v['es'] ??
    Object.values(v)[0] ??
    fallback
  );
}

export function formatMoney(
  amount: number,
  currency: string = 'CAD',
  locale: string = 'en-CA',
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
