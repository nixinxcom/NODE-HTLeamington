// app/api/admin/ai-agents/[agentId]/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerIdToken } from '@/app/lib/verifyFirebaseToken';
import {
  roleFromDecoded,
  type DecodedIdToken,
  isAllowedAdminHard,
  // isAllowedSuperadminHard,
} from '@/app/lib/authz';
import { fsGetDoc, fsSetDoc } from '@/app/lib/firestoreRest';
import { isAllowedAdminHardPlus } from '@/app/lib/authz';
import { isAllowedSuperadminHard } from '@/app/lib/authz';

// Si no pasas agentId en la URL, usamos este:
const ENV_AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || "default";

/* --------------------------------- shape utils -------------------------------- */
function normalizeOnRead(input: any) {
  const languages =
    Array.isArray(input?.languages)
      ? input.languages
      : typeof input?.languages === 'string'
        ? input.languages.split(',').map((x: string) => x.trim()).filter(Boolean)
        : ['es', 'en', 'fr'];

  const theme = {
    bg: input?.theme?.bg ?? '#0B0F14',
    surface: input?.theme?.surface ?? '#121820',
    text: input?.theme?.text ?? '#EAF2F8',
    primary: input?.theme?.primary ?? '#18A0FB',
    accent: input?.theme?.accent ?? '#FFB703',
    border: input?.theme?.border ?? '#1F2937',
    fontFamily: input?.theme?.fontFamily ?? 'Inter, system-ui, sans-serif',
    radius: typeof input?.theme?.radius === 'number' ? input.theme.radius : 16,
  };

  const assets = {
    avatarPath:
      input?.assets?.avatarPath ??
      (typeof input?.avatarUrl === 'string' ? input.avatarUrl : 'Agents/default/assets/avatar_700x700.webp'),
    fabIconPath:
      input?.assets?.fabIconPath ??
      (typeof input?.fabIconUrl === 'string' ? input.fabIconUrl : 'Agents/default/assets/fab_700x700.webp'),
  };

  return {
    displayName: input?.displayName ?? 'Agente',
    welcome: input?.welcome ?? input?.notifications?.Saludo ?? '¡Hola! ¿En qué puedo ayudarte hoy?',
    domain: input?.domain ?? 'example.com',
    languages,
    showLeadForm:
      typeof input?.showLeadForm === 'boolean'
        ? input.showLeadForm
        : (typeof input?.requireLeadAtStart === 'boolean' ? input.requireLeadAtStart : false),
    openai: {
      model: input?.openai?.model ?? process.env.OPENAI_MODEL ?? 'gpt-5-nano',
      temperature: typeof input?.openai?.temperature === 'number' ? input.openai.temperature : 0.7,
      max_tokens: typeof input?.openai?.max_tokens === 'number' ? input.openai.max_tokens : 500,
    },
    theme,
    assets,
    params: { ...(input?.params || {}) },
  };
}

function sanitizeOnWrite(input: any) {
  const n = normalizeOnRead(input);
  return {
    displayName: n.displayName,
    welcome: n.welcome,
    domain: n.domain,
    languages: n.languages,
    showLeadForm: !!n.showLeadForm,
    openai: n.openai,
    theme: n.theme,
    assets: n.assets,
    params: n.params || {},
  };
}

/* --------------------------- auth helper (server) --------------------------- */
async function decodeFromAuthHeader(req: NextRequest): Promise<{
  decoded: DecodedIdToken | null;
  role: 'anon' | 'user' | 'admin' | 'superadmin';
  idToken?: string;
}> {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const idToken = m?.[1]?.trim();
  const decoded = await verifyBearerIdToken(auth);
  const role = roleFromDecoded(decoded);
  return { decoded, role, idToken };
}

/* =============================================================================
   Núcleo reutilizable: handlers que reciben el agentId RESUELTO
============================================================================= */
async function handleGETCore(req: NextRequest, resolvedAgentId: string) {
  const { decoded, role } = await decodeFromAuthHeader(req);
  if (!decoded) {
    return NextResponse.json({ ok: false, error: 'missing_bearer', role }, { status: 401 });
  }
  if (!isAllowedAdminHard(decoded)) {
    return NextResponse.json({ ok: false, error: 'forbidden', role }, { status: 403 });
  }
  if (!isAllowedAdminHardPlus(decoded)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  try {
    const raw = await fsGetDoc({ col: 'ai_agents', id: resolvedAgentId });
    return NextResponse.json({ ok: true, data: normalizeOnRead(raw) }, { status: 200 });
  } catch {
    // Si no existe, devolvemos defaults para que el panel los muestre
    return NextResponse.json(
      { ok: true, data: normalizeOnRead({}), notFound: true },
      { status: 200 },
    );
  }
}

async function handlePUTCore(req: NextRequest, resolvedAgentId: string) {
  const { decoded, role, idToken } = await decodeFromAuthHeader(req);
  if (!decoded) {
    return NextResponse.json({ ok: false, error: 'missing_bearer', role }, { status: 401 });
  }
  if (!isAllowedAdminHard(decoded)) {
    return NextResponse.json({ ok: false, error: 'forbidden', role }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const clean = sanitizeOnWrite(body);

  if (Object.prototype.hasOwnProperty.call(body, 'enabled')) {
    if (!isAllowedSuperadminHard(decoded)) {
      return NextResponse.json({ ok:false, error:'superadmin_only' }, { status:403 });
    }
  }

  // Guardado vía REST con idToken (respeta rules)
  if (idToken) {
    try {
      const saved = await fsSetDoc({ idToken, col: 'ai_agents', id: resolvedAgentId, data: clean });
      return NextResponse.json({ ok: true, data: normalizeOnRead(saved) }, { status: 200 });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e?.message || 'save_failed' }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 401 });
}

/* =============================================================================
   Exports de la RUTA DINÁMICA (compat Next 15: params async; agentId opcional)
============================================================================= */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ agentId?: string }> }
) {
  const { agentId } = await ctx.params;
  const resolvedAgentId = agentId || ENV_AGENT_ID;
  return handleGETCore(req, resolvedAgentId);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ agentId?: string }> }
) {
  const { agentId } = await ctx.params;
  const resolvedAgentId = agentId || ENV_AGENT_ID;
  return handlePUTCore(req, resolvedAgentId);
}

/* =============================================================================
   Reexports para que un handler NO DINÁMICO pueda reutilizar el núcleo
============================================================================= */
export { handleGETCore, handlePUTCore, ENV_AGENT_ID };
