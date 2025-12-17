// app/lib/cct/guard.ts
import "server-only";
import type { NextRequest } from "next/server";
import { verifyCctToken } from "@/app/lib/cct/token";
import { getCctTenantStateCached } from "@/app/lib/cct/state";

export type RequireCapResult =
  | { ok: true; cid: string; caps: string[] }
  | {
      ok: false;
      status: 401 | 403 | 500;
      error:
        | "missing_cct"
        | "invalid_cct"
        | "cct_expired"
        | "cct_missing_secret"
        | "cct_missing_cap"
        | "cct_tenant_mismatch"
        | "cct_revoked"
        | "cct_blocked"
        | "cct_contract_expired";
    };

export function extractCctFromRequest(req: NextRequest, body?: any): string {
  const cctHeader =
    req.headers.get("x-nixinx-cct")?.trim() ||
    (req.headers.get("authorization")?.startsWith("CCT ")
      ? req.headers.get("authorization")!.slice(4).trim()
      : "");

  const cctBody = typeof body?.cct === "string" ? body.cct.trim() : "";
  return cctHeader || cctBody || "";
}

export async function requireCctCapAsync(args: {
  req: NextRequest;
  tenantId: string;
  cap: string;
  body?: any;
  allowMissingInDev?: boolean;

  // Etapa 2: default = cached (baja costo). Si quieres “siempre fresh”, ponlo true.
  freshState?: boolean;
}): Promise<RequireCapResult> {
  const { req, tenantId, cap } = args;
  const allowMissingInDev = args.allowMissingInDev ?? true;

  const cct = extractCctFromRequest(req, args.body);

  if (!cct) {
    if (process.env.NODE_ENV === "development" && allowMissingInDev) {
      return { ok: true, cid: tenantId, caps: [cap] };
    }
    return { ok: false, status: 403, error: "missing_cct" };
  }

  const vr = verifyCctToken(cct);

  if (!vr.ok) {
    if (vr.error === "missing_secret") {
      return { ok: false, status: 500, error: "cct_missing_secret" };
    }
    if (vr.error === "expired") {
      return { ok: false, status: 401, error: "cct_expired" };
    }
    return { ok: false, status: 403, error: "invalid_cct" };
  }

  const capsLower = new Set(vr.payload.caps.map((x) => x.toLowerCase()));
  if (!capsLower.has(cap.toLowerCase())) {
    return { ok: false, status: 403, error: "cct_missing_cap" };
  }

  if (tenantId !== "__default__" && vr.payload.cid !== tenantId) {
    return { ok: false, status: 403, error: "cct_tenant_mismatch" };
  }

  // Etapa 2: por default usamos CACHE (menos lecturas).
  // Si un endpoint realmente requiere “fresh siempre”, pasa freshState:true.
  const state = await getCctTenantStateCached(tenantId, {
    bypassCache: !!args.freshState,
  });

  const now = Date.now();

  if (state.blocked) {
    if (!state.blockedUntil || now < state.blockedUntil.getTime()) {
      return { ok: false, status: 403, error: "cct_blocked" };
    }
  }

  if (state.activeUntil && now > state.activeUntil.getTime()) {
    return { ok: false, status: 403, error: "cct_contract_expired" };
  }

  const tokenRev =
    typeof (vr.payload as any).rev === "number" ? (vr.payload as any).rev : 0;

  if (tokenRev !== state.rev) {
    return { ok: false, status: 403, error: "cct_revoked" };
  }

  return { ok: true, cid: vr.payload.cid, caps: vr.payload.caps };
}
