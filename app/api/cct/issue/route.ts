// app/api/cct/issue/route.ts
export const runtime = "nodejs";

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getCctTenantStateCached } from "@/app/lib/cct/state";
import { issueCctToken } from "@/app/lib/cct/token";

type Body = {
  clientId?: string;
  ttlSec?: number;

  // SOLO DEV: override (en prod se ignora)
  caps?: string[];
};

function clampTtlSec(v: any): number {
  const n = typeof v === "number" ? Math.trunc(v) : parseInt(String(v || ""), 10);
  if (!Number.isFinite(n)) return 3600;
  // mínimo 60s, máximo 12h (ajústalo si quieres)
  return Math.max(60, Math.min(12 * 3600, n));
}

function normalizeCaps(caps: unknown): string[] {
  if (!Array.isArray(caps)) return [];
  const cleaned = caps
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of cleaned) {
    const k = c.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  }
  return out;
}

function toUnixSec(d: any): number | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  const t = dt.getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor(t / 1000);
}

// Para tokens “estables” dentro del mismo minuto (mejor cache)
function bucketNowSec(nowSec: number, bucket = 60): number {
  return nowSec - (nowSec % bucket);
}

async function issueFor(clientIdRaw: string, ttlSecRaw: any, capsOverride?: string[]) {
  const clientId = (clientIdRaw || "").trim();
  if (!clientId) {
    return NextResponse.json({ ok: false, error: "missing_clientId" }, { status: 400 });
  }

  const ttlSec = clampTtlSec(ttlSecRaw);

  const state = await getCctTenantStateCached(clientId, { bypassCache: false });

  if (state.blocked) {
    return NextResponse.json({ ok: false, error: "blocked" }, { status: 403 });
  }

  const nowSecReal = Math.floor(Date.now() / 1000);

  // contrato vencido (usa activeUntil/billing.periodEnd)
  const contractEndSec = toUnixSec(state.billing?.periodEnd || state.activeUntil);
  if (contractEndSec !== null && nowSecReal >= contractEndSec) {
    return NextResponse.json({ ok: false, error: "contract_expired" }, { status: 403 });
  }

  const nowSec = bucketNowSec(nowSecReal, 60);

  // caps: prod = siempre del estado; dev = puede override
  const caps = capsOverride ? normalizeCaps(capsOverride) : normalizeCaps(state.caps);

  // Exp NO debe pasar de periodEnd (si existe)
  let effectiveTtl = ttlSec;
  if (contractEndSec !== null) {
    const maxExp = contractEndSec;
    const desiredExp = nowSec + ttlSec;
    const finalExp = Math.min(desiredExp, maxExp);
    effectiveTtl = Math.max(1, finalExp - nowSec);
  }

  const ps = toUnixSec(state.billing?.periodStart);
  const pe = contractEndSec;

  const token = issueCctToken({
    clientId,
    caps,
    ttlSec: effectiveTtl,
    rev: state.rev,
    periodStartSec: ps ?? undefined,
    periodEndSec: pe ?? undefined,
    nowSec,
  });

  // decora respuesta (útil para debug / nodo)
  const exp = nowSec + effectiveTtl;

  return NextResponse.json({
    ok: true,
    clientId,
    caps,
    rev: state.rev,
    iat: nowSec,
    exp,
    periodStart: ps ?? null,
    periodEnd: pe ?? null,
    token,
  });
}

// GET (pensado para nodo + caching)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || searchParams.get("tenantId") || "";
    const ttlSec = searchParams.get("ttlSec") || undefined;

    const res = await issueFor(clientId, ttlSec);

    // Headers cache-friendly (no te rompe local; en prod ayuda)
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (err) {
    console.error("[cct/issue][GET] error", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

// POST (tu flujo actual PowerShell)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const isDev = process.env.NODE_ENV === "development";
    const capsOverride = isDev && typeof body.caps !== "undefined" ? normalizeCaps(body.caps) : undefined;

    // En PROD: IGNORA caps del body sí o sí.
    return issueFor(body.clientId || "", body.ttlSec, capsOverride);
  } catch (err) {
    console.error("[cct/issue][POST] error", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
