// app/api/agent-config/[agentId]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getEffectiveAgentConfigServer } from "@/app/lib/agents/loadAgent.server";
import { SEO_DEFAULTS } from "@/app/lib/seo/defaults";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

// ---- Normalizador a la forma que tu widget espera ----
function toArrayLanguages(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string") {
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return ["es", "en", "fr"];
}

function normalizeForWidget(cfg: any) {
  const branding = cfg?.branding || {};
  const colors = branding?.colors || {};
  const themeIn = cfg?.theme || {};

  const theme = {
    bg: themeIn.bg ?? colors.background ?? "#0B0F14",
    surface: themeIn.surface ?? "#121820",
    text: themeIn.text ?? colors.foreground ?? "#EAF2F8",
    primary: themeIn.primary ?? colors.primary ?? "#18A0FB",
    accent: themeIn.accent ?? colors.accent ?? "#FFB703",
    border: themeIn.border ?? "#1F2937",
    fontFamily: themeIn.fontFamily ?? branding?.fonts?.body ?? "Inter, system-ui, sans-serif",
    radius: typeof themeIn.radius === "number" ? themeIn.radius : 16,
  };

  const assetsIn = cfg?.assets || {};
  const logo = branding?.logo || {};

  const assets = {
    avatarPath:
      assetsIn.avatarPath ??
      cfg?.avatarUrl ??
      logo.square ??
      "Agents/default/assets/avatar_700x700.webp",
    fabIconPath:
      assetsIn.fabIconPath ??
      cfg?.fabIconUrl ??
      logo.square ??
      "Agents/default/assets/fab_700x700.webp",
  };

  const baseUrl =
    cfg?.domain && /^https?:\/\//.test(cfg.domain) ? cfg.domain : SEO_DEFAULTS.baseUrl;

  let domainHost = "example.com";
  try {
    domainHost = new URL(baseUrl).hostname;
  } catch {}

  return {
    displayName: cfg?.displayName ?? cfg?.name ?? "Agente",
    welcome: cfg?.welcome ?? cfg?.notifications?.Saludo ?? "¡Hola! ¿En qué puedo ayudarte hoy?",
    domain: cfg?.domain ?? domainHost,
    languages: toArrayLanguages(cfg?.languages),
    showLeadForm:
      typeof cfg?.showLeadForm === "boolean"
        ? cfg.showLeadForm
        : typeof cfg?.requireLeadAtStart === "boolean"
        ? cfg.requireLeadAtStart
        : false,
    openai: {
      model: cfg?.openai?.model ?? process.env.OPENAI_MODEL ?? "gpt-5-nano",
      temperature:
        typeof cfg?.openai?.temperature === "number" ? cfg.openai.temperature : 0.7,
      max_tokens: typeof cfg?.openai?.max_tokens === "number" ? cfg.openai.max_tokens : 500,
    },
    theme,
    assets,
    params: { ...(cfg?.params || {}) },
  };
}

type AgentParams = { agentId?: string };

// ---- ÚNICO handler GET (compatible Next 13/14/15) ----
export async function GET(
  req: Request,
  ctx: { params: Promise<AgentParams> }
) {
  const { agentId } = await ctx.params; // 👈 en Next 15 params puede ser Promise
  const effectiveId = agentId ?? process.env.NEXT_PUBLIC_AGENT_ID ?? "default";

  const url = new URL(req.url);
  const locale = toShortLocale(url.searchParams.get("locale") || DEFAULT_LOCALE_SHORT);

  try {
    const cfg = await getEffectiveAgentConfigServer(effectiveId, locale);
    const normalized = normalizeForWidget(cfg);
    return NextResponse.json({ ok: true, data: normalized }, { status: 200 });
  } catch (e) {
    console.error("[agent-config] error:", e);
    const normalized = normalizeForWidget({});
    return NextResponse.json({ ok: true, data: normalized, notFound: true }, { status: 200 });
  }
}
