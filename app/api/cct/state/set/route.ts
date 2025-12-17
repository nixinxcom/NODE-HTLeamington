// app/api/cct/state/set/route.ts
export const runtime = "nodejs";

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getAdminDb } from "@/app/lib/firebaseAdmin";
import { invalidateCctTenantStateCache } from "@/app/lib/cct/state";
import { verifyBearerIdToken } from "@/app/lib/verifyFirebaseToken";
import { isSuperadminHard } from "@/app/lib/authz";

type EntitlementStatus = "active" | "cancel_at_period_end" | "inactive";

type EntitlementPatch = {
  status?: EntitlementStatus;

  // fechas (solo si manualDates permitido)
  activatedAt?: string | number | null;
  cancelRequestedAt?: string | number | null;
  deactivatedAt?: string | number | null;

  note?: string;
  ref?: string;
};

type Body = {
  tenantId?: string;

  // existente
  caps?: string[];
  activeUntil?: string | number | null;
  willNotRenew?: boolean;

  blocked?: boolean;
  blockedUntil?: string | number | null;
  blockedReason?: string;

  // global billing (cliente)
  billing?: {
    periodStart?: string | number | null;
    periodEnd?: string | number | null;
  };

  // por-capacity (solo historia/estado)
  entitlements?: Record<string, EntitlementPatch | null>;

  // util
  syncCapsFromEntitlements?: boolean;

  bumpRev?: boolean;
  rev?: number;

  // NUEVO: idempotencia + control de fechas
  requestId?: string;
  manualDates?: boolean; // en prod: solo superadmin (ya lo eres); en dev: permitido por default
};

const ROOT_DOC_PATH =
  process.env.NIXINX_CCT_ROOT_DOC_PATH || "Providers/CoreCapsTkns";

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

function asDateOrNull(v: any): Date | null {
  if (v === null) return null;
  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function asDateFromDoc(v: any): Date | null {
  if (!v) return null;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  return null;
}

function normalizeStatus(v: any): EntitlementStatus {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (s === "active") return "active";
  if (s === "cancel_at_period_end") return "cancel_at_period_end";
  return "inactive";
}

function stableCapsFromEntitlements(ent: Record<string, any>): string[] {
  return Object.entries(ent)
    .filter(([, e]) => {
      const st = normalizeStatus(e?.status);
      return st === "active" || st === "cancel_at_period_end";
    })
    .map(([cap]) => cap);
}

function sanitizeId(s: string): string {
  return (s || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 200);
}

/**
 * Fingerprint estable: evita falsos "changed" por Timestamp vs Date.
 */
type EntFpRow = [
  cap: string,
  status: EntitlementStatus,
  activatedAtMs: number | null,
  cancelRequestedAtMs: number | null,
  deactivatedAtMs: number | null,
];

function entitlementsFingerprint(ent: Record<string, any>): string {
  const rows: EntFpRow[] = Object.entries(ent ?? {}).map(([cap, e]): EntFpRow => {
    const st = normalizeStatus(e?.status);

    const a = asDateFromDoc(e?.activatedAt) ?? asDateOrNull(e?.activatedAt);
    const c =
      asDateFromDoc(e?.cancelRequestedAt) ?? asDateOrNull(e?.cancelRequestedAt);
    const d =
      asDateFromDoc(e?.deactivatedAt) ?? asDateOrNull(e?.deactivatedAt);

    return [
      String(cap).toLowerCase(),
      st,
      a ? a.getTime() : null,
      c ? c.getTime() : null,
      d ? d.getTime() : null,
    ];
  });

  rows.sort((x, y) => x[0].localeCompare(y[0]));
  return JSON.stringify(rows);
}

export async function POST(req: NextRequest) {
  try {
    // Prod: solo superadmin
    if (process.env.NODE_ENV !== "development") {
      const authHeader = req.headers.get("authorization");
      const decoded = await verifyBearerIdToken(authHeader);
      if (!decoded || !isSuperadminHard(decoded.email || decoded.uid)) {
        return NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 },
        );
      }
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const tenantId = (body.tenantId || "").trim();

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "missing_tenantId" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const tenantRef = db
      .doc(ROOT_DOC_PATH)
      .collection("tenants")
      .doc(tenantId);

    // Idempotencia: o viene de NIXINX.org (ideal) o se genera (retro-compat)
    const requestId = (
      body.requestId ||
      req.headers.get("x-nixinx-request-id") ||
      randomUUID()
    ).trim();

    // En dev permitimos fechas manuales por defecto.
    // En prod, solo si explícitamente mandas manualDates:true (y ya eres superadmin).
    const allowManualDates =
      process.env.NODE_ENV === "development" ? true : !!body.manualDates;

    type TxResult = {
      ok: true;
      tenantId: string;
      requestId: string;
      rev: number;
      caps: string[];
      billing: { periodStart: string | null; periodEnd: string | null };
      activeUntil: string | null;
      willNotRenew: boolean;
      blocked: boolean;
      blockedUntil: string | null;
      blockedReason: string;
      idempotentHit: boolean;
    };

    const result = await db.runTransaction<TxResult>(async (tx) => {
      const reqRef = tenantRef.collection("_requests").doc(requestId);

      // si ya se procesó exactamente este requestId: NO-OP
      const reqSnap = await tx.get(reqRef);
      if (reqSnap.exists) {
        const snap = await tx.get(tenantRef);
        const cur = snap.exists ? (snap.data() as any) : {};

        const curRev = typeof cur?.rev === "number" ? cur.rev : 0;
        const curCaps = normalizeCaps(cur?.caps);

        const curBilling = cur?.billing && typeof cur.billing === "object" ? cur.billing : {};
        const curPeriodStart = asDateFromDoc(curBilling?.periodStart);
        const curPeriodEnd = asDateFromDoc(curBilling?.periodEnd) || asDateFromDoc(cur?.activeUntil);

        const curWillNotRenew = !!cur?.willNotRenew;
        const curBlocked = !!cur?.blocked;
        const curBlockedUntil = asDateFromDoc(cur?.blockedUntil);
        const curBlockedReason = typeof cur?.blockedReason === "string" ? cur.blockedReason : "";

        return {
          ok: true,
          tenantId,
          requestId,
          rev: curRev,
          caps: curCaps,
          billing: {
            periodStart: curPeriodStart ? curPeriodStart.toISOString() : null,
            periodEnd: curPeriodEnd ? curPeriodEnd.toISOString() : null,
          },
          activeUntil: curPeriodEnd ? curPeriodEnd.toISOString() : null,
          willNotRenew: curWillNotRenew,
          blocked: curBlocked,
          blockedUntil: curBlockedUntil ? curBlockedUntil.toISOString() : null,
          blockedReason: curBlockedReason,
          idempotentHit: true,
        };
      }

      const snap = await tx.get(tenantRef);
      const cur = snap.exists ? (snap.data() as any) : null;

      const curRev = typeof cur?.rev === "number" ? cur.rev : 0;
      const curCaps = normalizeCaps(cur?.caps);

      const curActiveUntil = asDateFromDoc(cur?.activeUntil);
      const curBilling = cur?.billing && typeof cur.billing === "object" ? cur.billing : {};
      const curPeriodStart = asDateFromDoc(curBilling?.periodStart);
      const curPeriodEnd = asDateFromDoc(curBilling?.periodEnd) || curActiveUntil;

      const curWillNotRenew = !!cur?.willNotRenew;

      const curBlocked = !!cur?.blocked;
      const curBlockedUntil = asDateFromDoc(cur?.blockedUntil);
      const curBlockedReason = typeof cur?.blockedReason === "string" ? cur.blockedReason : "";

      const curEntitlements =
        cur?.entitlements && typeof cur.entitlements === "object"
          ? (cur.entitlements as Record<string, any>)
          : {};

      // ---- next billing (alias activeUntil <-> billing.periodEnd)
      const nextPeriodStart =
        typeof body.billing?.periodStart === "undefined"
          ? curPeriodStart
          : asDateOrNull(body.billing?.periodStart);

      const periodEndFromBilling =
        typeof body.billing?.periodEnd === "undefined"
          ? undefined
          : asDateOrNull(body.billing?.periodEnd);

      const activeUntilFromBody =
        typeof body.activeUntil === "undefined"
          ? undefined
          : asDateOrNull(body.activeUntil);

      const nextPeriodEnd =
        periodEndFromBilling !== undefined
          ? periodEndFromBilling
          : activeUntilFromBody !== undefined
            ? activeUntilFromBody
            : curPeriodEnd;

      const nextWillNotRenew =
        typeof body.willNotRenew === "undefined"
          ? curWillNotRenew
          : !!body.willNotRenew;

      const nextBlocked =
        typeof body.blocked === "undefined" ? curBlocked : !!body.blocked;

      const nextBlockedUntil =
        typeof body.blockedUntil === "undefined"
          ? curBlockedUntil
          : asDateOrNull(body.blockedUntil);

      const nextBlockedReason =
        typeof body.blockedReason === "undefined"
          ? curBlockedReason
          : (body.blockedReason || "");

      // ---- next entitlements (patch merge + eventos)
      let nextEntitlements: Record<string, any> = { ...curEntitlements };
      const eventsToWrite: any[] = [];
      const now = new Date(); // server-side (no cliente)

      if (typeof body.entitlements !== "undefined") {
        for (const [capRaw, patch] of Object.entries(body.entitlements || {})) {
          const cap = (capRaw || "").trim();
          if (!cap) continue;

          // remove entry
          if (patch === null) {
            const prev = nextEntitlements[cap];
            delete nextEntitlements[cap];
            eventsToWrite.push({
              requestId,
              cap,
              type: "removed",
              at: now,
              prevStatus: prev?.status ?? null,
              note: "removed",
              ref: "",
            });
            continue;
          }

          const prev =
            nextEntitlements[cap] && typeof nextEntitlements[cap] === "object"
              ? nextEntitlements[cap]
              : {};

          const prevStatus = normalizeStatus(prev?.status);

          // estado base
          const merged: any = { ...prev };

          // status propuesto
          const requestedStatus =
            typeof patch.status !== "undefined"
              ? normalizeStatus(patch.status)
              : normalizeStatus(merged.status);

          // Regla de integridad: no permitir cancelar algo inactive
          // (registramos evento "ignored" pero NO tocamos estado ni rev)
          if (requestedStatus === "cancel_at_period_end" && prevStatus === "inactive") {
            eventsToWrite.push({
              requestId,
              cap,
              type: "cancel_request_ignored",
              at: now,
              prevStatus,
              note: patch.note ?? "",
              ref: patch.ref ?? "",
            });
            continue;
          }

          // aplica status
          merged.status = requestedStatus;

          // fechas manuales SOLO si permitido
          if (allowManualDates) {
            if (typeof patch.activatedAt !== "undefined") {
              merged.activatedAt = asDateOrNull(patch.activatedAt);
            }
            if (typeof patch.cancelRequestedAt !== "undefined") {
              merged.cancelRequestedAt = asDateOrNull(patch.cancelRequestedAt);
            }
            if (typeof patch.deactivatedAt !== "undefined") {
              merged.deactivatedAt = asDateOrNull(patch.deactivatedAt);
            }
          }

          // Canonicalización server-side por cambio de status
          // (evita estados contradictorios como active + deactivatedAt viejo)
          const nextStatus = normalizeStatus(merged.status);

          // Detecta cambio real de status (para evento)
          if (prevStatus !== nextStatus) {
            if (nextStatus === "active") {
              if (!merged.activatedAt) merged.activatedAt = now;
              merged.cancelRequestedAt = null;
              merged.deactivatedAt = null;
            }
            if (nextStatus === "cancel_at_period_end") {
              if (!merged.cancelRequestedAt) merged.cancelRequestedAt = now;
              // sigue activo hasta corte: no debe tener deactivatedAt
              merged.deactivatedAt = null;
            }
            if (nextStatus === "inactive") {
              if (!merged.deactivatedAt) merged.deactivatedAt = now;
              // ya no aplica cancel request si está inactivo
              merged.cancelRequestedAt = null;
            }

            eventsToWrite.push({
              requestId,
              cap,
              type:
                nextStatus === "active"
                  ? "activated"
                  : nextStatus === "cancel_at_period_end"
                    ? "cancel_requested"
                    : "deactivated",
              at: now,
              prevStatus,
              nextStatus,
              activatedAt: merged.activatedAt ?? null,
              cancelRequestedAt: merged.cancelRequestedAt ?? null,
              deactivatedAt: merged.deactivatedAt ?? null,
              note: patch.note ?? "",
              ref: patch.ref ?? "",
            });
          } else {
            // si no cambió status, pero tocaste fechas (solo si manualDates)
            const touched =
              allowManualDates &&
              (typeof patch.activatedAt !== "undefined" ||
                typeof patch.cancelRequestedAt !== "undefined" ||
                typeof patch.deactivatedAt !== "undefined");

            if (touched) {
              eventsToWrite.push({
                requestId,
                cap,
                type: "dates_updated",
                at: now,
                status: nextStatus,
                activatedAt: merged.activatedAt ?? null,
                cancelRequestedAt: merged.cancelRequestedAt ?? null,
                deactivatedAt: merged.deactivatedAt ?? null,
                note: patch.note ?? "",
                ref: patch.ref ?? "",
              });
            }
          }

          merged.updatedAt = now;
          nextEntitlements[cap] = merged;
        }
      }

      // ---- caps: manual o derivadas
      const wantsSyncCaps =
        typeof body.syncCapsFromEntitlements === "boolean"
          ? body.syncCapsFromEntitlements
          : typeof body.entitlements !== "undefined"; // default

      const nextCaps =
        typeof body.caps !== "undefined"
          ? normalizeCaps(body.caps)
          : wantsSyncCaps
            ? stableCapsFromEntitlements(nextEntitlements)
            : curCaps;

      // ---- changed detection (robusto)
      const curEntFp = entitlementsFingerprint(curEntitlements);
      const nextEntFp = entitlementsFingerprint(nextEntitlements);

      const curCapsFp = JSON.stringify(curCaps.map((c) => c.toLowerCase()).sort());
      const nextCapsFp = JSON.stringify(nextCaps.map((c) => c.toLowerCase()).sort());

      const changed =
        curCapsFp !== nextCapsFp ||
        (curPeriodStart?.getTime?.() ?? null) !== (nextPeriodStart?.getTime?.() ?? null) ||
        (curPeriodEnd?.getTime?.() ?? null) !== (nextPeriodEnd?.getTime?.() ?? null) ||
        curWillNotRenew !== nextWillNotRenew ||
        curBlocked !== nextBlocked ||
        (curBlockedUntil?.getTime?.() ?? null) !== (nextBlockedUntil?.getTime?.() ?? null) ||
        curBlockedReason !== nextBlockedReason ||
        curEntFp !== nextEntFp;

      const nextRev =
        typeof body.rev === "number"
          ? body.rev
          : body.bumpRev || changed
            ? curRev + 1
            : curRev;

      // ---- writes atómicos (estado + eventos + request marker)
      tx.set(
        tenantRef,
        {
          rev: nextRev,
          caps: nextCaps,

          // compat con guard/issue existentes
          activeUntil: nextPeriodEnd,
          willNotRenew: nextWillNotRenew,

          blocked: nextBlocked,
          blockedUntil: nextBlockedUntil,
          blockedReason: nextBlockedReason,

          billing: {
            periodStart: nextPeriodStart,
            periodEnd: nextPeriodEnd,
          },

          entitlements: nextEntitlements,
          updatedAt: now,
        },
        { merge: true },
      );

      if (eventsToWrite.length) {
        const evCol = tenantRef.collection("entitlementEvents");
        for (const ev of eventsToWrite) {
          const evId =
            sanitizeId(requestId) +
            "__" +
            sanitizeId(ev.cap || "unknown") +
            "__" +
            sanitizeId(ev.type || "event");
          tx.set(evCol.doc(evId), ev, { merge: false });
        }
      }

      // marcador idempotente (último write de la tx)
      tx.set(
        reqRef,
        {
          requestId,
          tenantId,
          at: now,
          rev: nextRev,
          changed,
          events: eventsToWrite.length,
        },
        { merge: false },
      );

      return {
        ok: true,
        tenantId,
        requestId,
        rev: nextRev,
        caps: nextCaps,
        billing: {
          periodStart: nextPeriodStart ? nextPeriodStart.toISOString() : null,
          periodEnd: nextPeriodEnd ? nextPeriodEnd.toISOString() : null,
        },
        activeUntil: nextPeriodEnd ? nextPeriodEnd.toISOString() : null,
        willNotRenew: nextWillNotRenew,
        blocked: nextBlocked,
        blockedUntil: nextBlockedUntil ? nextBlockedUntil.toISOString() : null,
        blockedReason: nextBlockedReason,
        idempotentHit: false,
      };
    });

    invalidateCctTenantStateCache(tenantId);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[cct/state/set] error", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
