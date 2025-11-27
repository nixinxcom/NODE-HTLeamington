// app/lib/settings/settings.ts
import "server-only";

/** Config de settings (no FS, solo TS/env) */
export type SettingsConfig = {
  displayName?: string;
  domain?: string | string[];
  languages?: string[] | string;
  openai?: { model?: string; temperature?: number; max_tokens?: number };
  params?: Record<string, any>;
};

export type SettingsMap = Record<string, SettingsConfig>;

/**
 * Config default para single-tenant.
 * Si mañana quieres multi-tenant, extiendes MAP con más claves.
 */
const DEFAULT_CONFIG: SettingsConfig = {
  displayName:
    process.env.NEXT_PUBLIC_APP_DISPLAY_NAME ??
    process.env.NEXT_PUBLIC_SITE_NAME ??
    "NIXINX",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN, // opcional
  languages:
    process.env.NEXT_PUBLIC_SUPPORTED_LOCALES
      ?.split(",")
      .map((v) => v.trim())
      .filter(Boolean) || ["es", "en", "fr"],
  openai: {
    model: process.env.NEXT_PUBLIC_OPENAI_MODEL ?? "gpt-4.1-mini",
    temperature: 0.5,
    max_tokens: 1024,
  },
  params: {},
};

/** Mapa directo de settings (ya sin seeds). Extiéndelo si necesitas más IDs. */
export const MAP: SettingsMap = {
  default: DEFAULT_CONFIG,
};

/* ---------------- utils ---------------- */
function normHost(input?: string | null): string | undefined {
  if (!input) return undefined;
  let h = input.split(",")[0].trim().toLowerCase();
  h = h
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/^www\./, "");
  return h.replace(/\/$/, "");
}

function domainsOf(cfg?: SettingsConfig): string[] {
  if (!cfg || !cfg.domain) return [];
  const arr = Array.isArray(cfg.domain) ? cfg.domain : [cfg.domain];
  return arr
    .map((v) => normHost(String(v)))
    .filter((v): v is string => Boolean(v));
}

/* ---------------- API ---------------- */
export function getSettingsById(id: string): SettingsConfig | undefined {
  return MAP[id];
}

export function getSettingsByHost(
  host?: string | null,
): SettingsConfig | undefined {
  const h = normHost(host);
  if (!h) return undefined;
  for (const cfg of Object.values(MAP)) {
    if (domainsOf(cfg).includes(h)) return cfg;
  }
  return undefined;
}

/** Prioridad: id → host → "default" */
export function resolveSettings(opts: {
  id?: string;
  host?: string | null;
}): SettingsConfig | undefined {
  const byId = opts.id && getSettingsById(opts.id);
  if (byId) return byId;

  const byHost = getSettingsByHost(opts.host);
  if (byHost) return byHost;

  const def = getSettingsById("default");
  if (!def) {
    console.warn(
      '[settings] Falta clave "default" en MAP de settings (app/lib/settings/settings.ts)',
    );
  }
  return def;
}
