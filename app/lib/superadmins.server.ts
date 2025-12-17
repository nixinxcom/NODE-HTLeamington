// app/lib/superadmins.server.ts
import 'server-only';

/** Correos hardcodeados (única fuente de verdad) */
const HARDCODED_SUPERADMINS: string[] = [
  'admin@nixinx.com',
  'admin@nixinx.org',
  'juzzyssi@gmail.com',
];

const HARDCODED_ADMINS: string[] = [
  // 'admin@patronbarandgrill.com',
  // agrega correos admin (no superadmin) si los necesitas
];

/* ───────── helpers ───────── */
function parseEmailList(
  input: string | ReadonlyArray<string> | null | undefined
): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    const arr = input as ReadonlyArray<string>;
    return arr
      .map((s) => String(s || '').trim().toLowerCase())
      .filter((s) => s && s.includes('@'));
  }
  return String(input)
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s.includes('@'));
}

function normEmail(e?: string | null): string | undefined {
  const s = String(e || '').trim().toLowerCase();
  return s.includes('@') ? s : undefined;
}

/* ───────── listas exportadas (EMAIL) ───────── */
export const SUPERADMIN_EMAILS = new Set<string>(parseEmailList(HARDCODED_SUPERADMINS));
export const HARDADMIN_EMAILS  = new Set<string>(parseEmailList(HARDCODED_ADMINS));

/* ───────── compat de UID (vacías a propósito) ───────── */
export const SUPERADMINS = new Set<string>(); // legacy: ya no otorga permisos
export const HARD_ADMINS  = new Set<string>(); // legacy: ya no otorga permisos

/* ───────── helpers por email ───────── */
export function hasHardPower(emailOrUid?: string | null): boolean {
  const e = normEmail(emailOrUid);
  return !!e && (SUPERADMIN_EMAILS.has(e) || HARDADMIN_EMAILS.has(e));
}
export function isSuperadminEmail(emailOrUid?: string | null): boolean {
  const e = normEmail(emailOrUid);
  return !!e && SUPERADMIN_EMAILS.has(e);
}
