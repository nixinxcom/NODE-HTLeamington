// Server-only loader del agente con selección por sección + cache TTL.
// - Branding base: FS > TSX(FM) > TSX (via getBrandingEffectivePWA(locale))
// - Lee Firestore /ai_agents/{agentId}
// - deepMerge que reemplaza arrays
// - Selección de rutas específicas (p.ej. ['socials','contact','params.menuUrl'])
// - Cache en memoria (TTL configurable)

import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fsGetDoc } from "@/app/lib/firestoreRest";
import { getBrandingEffectivePWA } from "@/complements/data/brandingFS";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

export const AI_CACHE_MINUTES = Number(process.env.AI_CACHE_MINUTES ?? 5);
const ROOT = process.cwd();

/* ─────────────────────────── Utils base ─────────────────────────── */
function isPlainObject(x: any) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
// deepMerge: objetos = merge profundo; arrays = REEMPLAZO completo
function deepMerge<T>(base: T, extra: any): T {
  if (Array.isArray(base) && Array.isArray(extra)) {
    return extra as any;
  }
  if (isPlainObject(base) && isPlainObject(extra)) {
    const out: any = { ...(base as any) };
    for (const k of Object.keys(extra)) {
      const bv = (base as any)[k];
      const ev = (extra as any)[k];
      out[k] = deepMerge(bv, ev);
    }
    return out;
  }
  return extra !== undefined ? (extra as any) : (base as any);
}
function getByPath(obj: any, dotted: string) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    if (cur == null) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}
function assignPath(dst: any, dotted: string, value: any) {
  const parts = dotted.split(".");
  let cur = dst;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    cur[k] = cur[k] ?? {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
  return dst;
}
function pickPaths(src: any, paths: string[]): any {
  const out: any = {};
  for (const p of paths) {
    const v = getByPath(src, p);
    if (v !== undefined) assignPath(out, p, v);
  }
  return out;
}

// Sustituye {{branding.algo}} en strings
function interpolateTemplates(val: any, ctx: { branding: any }): any {
  if (typeof val === "string") {
    return val.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
      if (key.startsWith("branding.")) {
        const v = getByPath(ctx.branding, key.slice("branding.".length));
        return v == null ? "" : String(v);
      }
      return _m;
    });
  }
  if (Array.isArray(val)) return val.map((v) => interpolateTemplates(v, ctx));
  if (isPlainObject(val)) {
    const out: any = {};
    for (const k in val) out[k] = interpolateTemplates(val[k], ctx);
    return out;
  }
  return val;
}
// Reemplaza nodos {$ref:"branding.ruta"} por el subárbol del branding
function resolveRefs(val: any, ctx: { branding: any }): any {
  if (Array.isArray(val)) return val.map((v) => resolveRefs(v, ctx));
  if (!isPlainObject(val)) return val;
  const keys = Object.keys(val);
  if (keys.length === 1 && typeof (val as any).$ref === "string") {
    const ref = (val as any).$ref as string;
    if (ref.startsWith("branding.")) {
      const v = getByPath(ctx.branding, ref.slice("branding.".length));
      return v == null ? null : v;
    }
  }
  const out: any = {};
  for (const k in val) out[k] = resolveRefs(val[k], ctx);
  return out;
}
// Inyecta {locale} en strings
function injectLocale(val: any, locale: string): any {
  if (typeof val === "string") return val.replace(/\{locale\}/g, locale);
  if (Array.isArray(val)) return val.map((v) => injectLocale(v, locale));
  if (isPlainObject(val)) {
    const out: any = {};
    for (const k in val) out[k] = injectLocale(val[k], locale);
    return out;
  }
  return val;
}

/* ─────────────────────────── Locale resolver ─────────────────────────── */
function resolveLocale(input?: string): string {
  return (
    input ??
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ??
    (process.env.LC_ALL ||
      process.env.LC_MESSAGES ||
      process.env.LANG ||
      process.env.LANGUAGE)?.replace(".UTF-8", "").replace("_", "-") ??
    Intl.DateTimeFormat().resolvedOptions().locale ??
    DEFAULT_LOCALE_SHORT
  );
}

/* ─────────────────────────── Firestore access ─────────────────────────── */
export async function loadAgentConfigServer(agentId: string) {
  const data = await fsGetDoc({ col: "ai_agents", id: agentId });
  return data ?? null;
}

/* ───────────────────────── Seeds de agentes (opcional) ───────────────────────── */
// (Se mantiene lectura de seeds JSON por agente si los usas)
async function tryReadJSON(relPath: string) {
  try {
    const full = path.join(ROOT, relPath);
    const txt = await readFile(full, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
async function readAgentSeed(agentId: string): Promise<Record<string, any>> {
  return (
    (await tryReadJSON(`scripts/seeds/agents/${agentId}.json`)) ||
    (await tryReadJSON(`seeds/agents/${agentId}.json`)) ||
    {}
  );
}

/* ───────────────────────── Normalizador plano ───────────────────────── */
// Garantiza que el cfg exporte campos PLANO: model, temperature, max_tokens,
// top_p, frequency_penalty, presence_penalty, languages (array).
function normalizeAgentCfgFlat<T extends Record<string, any>>(cfg: T | undefined | null) {
  const out: Record<string, any> = { ...(cfg || {}) };

  // languages: tolera string "es,en,fr"
  const langs = Array.isArray(out.languages)
    ? out.languages
    : (typeof out.languages === "string"
        ? out.languages.split(",").map((s: string) => s.trim()).filter(Boolean)
        : undefined);

  // si hay openai.* y faltan planos, duplica como fallback
  const oo = out.openai || {};
  if (out.model == null && oo.model != null) out.model = oo.model;
  if (out.temperature == null && typeof oo.temperature === "number") out.temperature = oo.temperature;
  if (out.max_tokens == null && typeof oo.max_tokens === "number") out.max_tokens = oo.max_tokens;
  if (out.top_p == null && typeof oo.top_p === "number") out.top_p = oo.top_p;
  if (out.frequency_penalty == null && typeof oo.frequency_penalty === "number") out.frequency_penalty = oo.frequency_penalty;
  if (out.presence_penalty == null && typeof oo.presence_penalty === "number") out.presence_penalty = oo.presence_penalty;

  out.languages = (langs && langs.length > 0) ? langs : ["es","en","fr"];

  return out as T & {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    languages?: string[];
  };
}

/* ───────────────────────────── Cache ───────────────────────────── */
type CacheEntry = { ts: number; data: any };
const _memCache: Record<string, CacheEntry> = Object.create(null);
function getCache(key: string) {
  const e = _memCache[key];
  if (!e) return null;
  if (Date.now() - e.ts > AI_CACHE_MINUTES * 60 * 1000) return null;
  return e.data;
}
function setCache(key: string, data: any) {
  _memCache[key] = { ts: Date.now(), data };
}

/* ─────────────────────── APIs principales ─────────────────────── */

// Compat: config completa del agente (con __profile = brandingEffective)
export async function getEffectiveAgentConfigServer(
  agentId: string,
  locale = "es" // se normaliza abajo; mantener firma por compat
): Promise<Record<string, any>> {
  const loc = resolveLocale(locale);
  const cacheKey = `cfg:${agentId}:${loc}`;
  const hit = getCache(cacheKey);
  if (hit) return hit;

  const [seedAgent, brandingBase] = await Promise.all([
    readAgentSeed(agentId),
    getBrandingEffectivePWA(loc), // FS > TSX(FM) > TSX
  ]);

  const fsAgentRaw = (await loadAgentConfigServer(agentId)) || {};

  // Overrides de branding específicos del agente
  const rawOverrides =
    (fsAgentRaw as any).branding ??
    (fsAgentRaw as any).profile ??
    (fsAgentRaw as any).overrides ??
    {};
  const brandingOverrides = isPlainObject(rawOverrides) ? rawOverrides : {};
  const brandingEffective = deepMerge(brandingBase, brandingOverrides);

  // Mezcla del agente (FS pisa seed del agente)
  const mergedAgent = deepMerge(seedAgent, fsAgentRaw);

  // Sustituir refs y templates con branding efectivo
  const withRefs = resolveRefs(mergedAgent, { branding: brandingEffective });
  const withTpl = interpolateTemplates(withRefs, { branding: brandingEffective });
  const finalCfg = injectLocale(withTpl, loc);

  // Normalización PLANA + __profile
  const finalOut = normalizeAgentCfgFlat(finalCfg);
  (finalOut as any).__profile = brandingEffective;

  setCache(cacheKey, finalOut);
  return finalOut;
}

/**
 * Devuelve SOLO las rutas solicitadas del perfil (brandingEffective).
 * Útil para prompts minimalistas y respuestas sin LLM.
 * @param sectionPaths rutas tipo ['socials','contact','params.menuUrl']
 */
export async function getEffectiveAgentProfileSection(
  agentId: string,
  locale = "es", // se normaliza abajo
  sectionPaths: string[] = []
): Promise<Record<string, any>> {
  const loc = resolveLocale(locale);
  const cacheKey = `profile:${agentId}:${loc}:${sectionPaths.sort().join("|")}`;
  const hit = getCache(cacheKey);
  if (hit) return hit;

  const brandingBase = await getBrandingEffectivePWA(loc);
  const fsAgentRaw = (await loadAgentConfigServer(agentId)) || {};
  const rawOverrides =
    (fsAgentRaw as any).branding ??
    (fsAgentRaw as any).profile ??
    (fsAgentRaw as any).overrides ??
    {};
  const brandingOverrides = isPlainObject(rawOverrides) ? rawOverrides : {};
  const brandingEffective = deepMerge(brandingBase, brandingOverrides);

  const localized = injectLocale(brandingEffective, loc);
  const sliced =
    sectionPaths.length > 0 ? pickPaths(localized, sectionPaths) : localized;

  setCache(cacheKey, sliced);
  return sliced;
}
