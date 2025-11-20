'use client';
import { useAppContext } from '@/context/AppContext';

export function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export function isExternalHref(href?: string) {
  if (!href) return false;
  return /^(https?:)?\/\//i.test(href) || /^(mailto:|tel:|sms:|whatsapp:|wa\.me)/i.test(href);
}

/** Obtiene el objeto de estilos RDD del Provider (tolerante a nombres) */
export function useStylesRDD(): any {
  const ctx: any = (typeof useAppContext === 'function' ? useAppContext() : {}) ?? {};
  return (
    ctx?.Styles ||
    ctx?.styles ||
    ctx?.BSS?.styles ||
    ctx?.StyleRDD ||
    ctx?.styleRDD ||
    null
  );
}

/** Detecta esquema visual si no viene en props (alias: 'light'|'dark') */
export function detectScheme(): 'light'|'dark' {
  if (typeof document === 'undefined') return 'light';
  if (document.documentElement.classList.contains('dark')) return 'dark';
  const dt = document.documentElement.getAttribute('data-theme');
  if (dt === 'dark') return 'dark';
  if (dt === 'light') return 'light';
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  return mq?.matches ? 'dark' : 'light';
}
