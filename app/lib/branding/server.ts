'use server';
import 'server-only';

import { getBrandingEffectivePWA } from '@/complements/data/brandingFS';
import { promises } from 'dns';
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

// Tipado flexible: tu branding puede ser dinámico
export type Branding = Record<string, any>;

/** Locale resolver sin hardcode: param → env → LC_* / LANG → Intl → en-US */
function resolveLocale(input?: string): string {
  return (
    input ??
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ??
    (process.env.LC_ALL ||
      process.env.LC_MESSAGES ||
      process.env.LANG ||
      process.env.LANGUAGE)?.replace('.UTF-8', '').replace('_', '-') ??
    Intl.DateTimeFormat().resolvedOptions().locale ??
    DEFAULT_LOCALE_SHORT
  );
}

/**
 * Branding Efectivo (SSR):
 * Regla: FS > TSX(FM) > TSX
 * - Resuelve <FM/> contra i18n efectivo del locale.
 * - No depende de firebase-admin ni de seeds JSON.
 */
export async function loadBrandingSSR(locale?: string): Promise<Branding> {
  const loc = resolveLocale(locale);
  return getBrandingEffectivePWA(loc);
}

/** Path informativo (por compat/logs) */
export async function getBrandingDocPath(): Promise<string> {
  return (
    process.env.NEXT_PUBLIC_BRANDING_DOC_PATH ||
    'branding/default'
  );
}
