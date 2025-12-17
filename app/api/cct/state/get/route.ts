// app/api/cct/state/get/route.ts
export const runtime = "nodejs";

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";
import { verifyBearerIdToken } from "@/app/lib/verifyFirebaseToken";
import { isSuperadminHard } from "@/app/lib/authz";

const ROOT_DOC_PATH =
  process.env.NIXINX_CCT_ROOT_DOC_PATH || "Providers/CoreCapsTkns";

type Body = {
  tenantId?: string;
  limitEvents?: number; // default 20
};

function toIso(v: any): string | null {
  if (!v) return null;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : null;
  }
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function cleanEntitlements(ent: any) {
  const src = ent && typeof ent === "object" ? ent : {};
  const out: any = {};
  for (const [cap, v] of Object.entries(src)) {
    const obj: any = v && typeof v === "object" ? v : {};
    out[cap] = {
      status: obj.status ?? "inactive",
      activatedAt: toIso(obj.activatedAt),
      cancelRequestedAt: toIso(obj.cancelRequestedAt),
      deactivatedAt: toIso(obj.deactivatedAt),
      updatedAt: toIso(obj.updatedAt),
    };
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    // Prod: solo superadmin
    if (process.env.NODE_ENV !== "development") {
      const authHeader = req.headers.get("authorization");
      const decoded = await verifyBearerIdToken(authHeader);
      if (!decoded || !isSuperadminHard(decoded.email || decoded.uid)) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const tenantId = (body.tenantId || "").trim();
    const limit = Math.max(1, Math.min(200, Number(body.limitEvents || 20)));

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "missing_tenantId" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.doc(ROOT_DOC_PATH).collection("tenants").doc(tenantId);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const data: any = snap.data() || {};
    const billing: any = data.billing || {};

    const evSnap = await ref
      .collection("entitlementEvents")
      .orderBy("at", "desc")
      .limit(limit)
      .get();

    const events = evSnap.docs.map((d) => {
      const x: any = d.data() || {};
      return {
        cap: x.cap ?? null,
        type: x.type ?? null,
        at: toIso(x.at),
        prevStatus: x.prevStatus ?? null,
        nextStatus: x.nextStatus ?? null,
        status: x.status ?? null,
        activatedAt: toIso(x.activatedAt),
        cancelRequestedAt: toIso(x.cancelRequestedAt),
        deactivatedAt: toIso(x.deactivatedAt),
        note: x.note ?? "",
        ref: x.ref ?? "",
      };
    });

    return NextResponse.json({
      ok: true,
      tenantId,
      rev: data.rev ?? 0,
      caps: data.caps ?? [],
      willNotRenew: !!data.willNotRenew,
      blocked: !!data.blocked,
      blockedUntil: toIso(data.blockedUntil),
      blockedReason: data.blockedReason ?? "",
      billing: {
        periodStart: toIso(billing.periodStart),
        periodEnd: toIso(billing.periodEnd) ?? toIso(data.activeUntil),
      },
      entitlements: cleanEntitlements(data.entitlements),
      events,
    });
  } catch (err) {
    console.error("[cct/state/get] error", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
