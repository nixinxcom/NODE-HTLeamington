// app/lib/cct/state.ts
import "server-only";
import { getAdminDb } from "@/app/lib/firebaseAdmin";

export type EntitlementStatus = "active" | "cancel_at_period_end" | "inactive";

export type EntitlementState = {
  status: EntitlementStatus;
  activatedAt: Date | null;
  cancelRequestedAt: Date | null;
  deactivatedAt: Date | null;
  updatedAt: Date | null;
};

export type BillingState = {
  periodStart: Date | null;
  periodEnd: Date | null; // “renovación actual”
};

export type CctTenantState = {
  rev: number;
  caps: string[];

  activeUntil: Date | null; // alias billing.periodEnd
  willNotRenew: boolean;

  blocked: boolean;
  blockedUntil: Date | null;
  blockedReason: string;

  billing: BillingState;
  entitlements: Record<string, EntitlementState>;
};

const ROOT_DOC_PATH =
  process.env.NIXINX_CCT_ROOT_DOC_PATH || "Providers/CoreCapsTkns";
const TENANTS_SUBCOL = "tenants";

// TTL configurable (default 15s)
function readTtlMs(): number {
  const raw = Number(process.env.NIXINX_CCT_STATE_CACHE_TTL_MS ?? 15000);
  if (!Number.isFinite(raw)) return 15_000;
  return Math.max(1_000, Math.min(raw, 5 * 60_000)); // clamp 1s..5min
}

const DEBUG = (process.env.NIXINX_CCT_DEBUG_STATE_CACHE || "") === "1";
let TTL_MS = readTtlMs();

const cache = new Map<string, { value: CctTenantState; expiresAt: number }>();

// evita “stampede”: 1000 requests simultáneos -> 1 lectura
const inflight = new Map<string, Promise<CctTenantState>>();

const stats = {
  hits: 0,
  misses: 0,
  inflightHits: 0,
  reads: 0,
};

export function getCctTenantStateCacheStats() {
  return { ...stats, ttlMs: TTL_MS, size: cache.size, inflight: inflight.size };
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

function asDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
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

function normalizeStatus(v: any): EntitlementStatus {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (s === "active") return "active";
  if (s === "cancel_at_period_end") return "cancel_at_period_end";
  return "inactive";
}

function normalizeEntitlements(raw: any): Record<string, EntitlementState> {
  const src = raw && typeof raw === "object" ? raw : {};
  const out: Record<string, EntitlementState> = {};

  for (const [cap, v] of Object.entries(src)) {
    if (!cap || typeof cap !== "string") continue;
    const obj: any = v && typeof v === "object" ? v : {};

    out[cap] = {
      status: normalizeStatus(obj.status),
      activatedAt: asDate(obj.activatedAt),
      cancelRequestedAt: asDate(obj.cancelRequestedAt),
      deactivatedAt: asDate(obj.deactivatedAt),
      updatedAt: asDate(obj.updatedAt),
    };
  }
  return out;
}

export function invalidateCctTenantStateCache(tenantId?: string) {
  if (!tenantId) {
    cache.clear();
    inflight.clear();
    return;
  }
  cache.delete(tenantId);
  inflight.delete(tenantId);
}

async function loadTenantState(tenantId: string): Promise<CctTenantState> {
  stats.reads++;

  if (DEBUG) console.log(`[cct/state] READ tenant=${tenantId}`);

  const db = getAdminDb();
  const snap = await db
    .doc(ROOT_DOC_PATH)
    .collection(TENANTS_SUBCOL)
    .doc(tenantId)
    .get();

  const data = snap.exists ? (snap.data() as any) : null;

  const billingRaw =
    data?.billing && typeof data.billing === "object" ? data.billing : {};

  const periodStart = asDate(billingRaw?.periodStart);
  const periodEnd = asDate(billingRaw?.periodEnd) || asDate(data?.activeUntil);

  return {
    rev: typeof data?.rev === "number" ? data.rev : 0,
    caps: normalizeCaps(data?.caps),

    activeUntil: periodEnd,
    willNotRenew: !!data?.willNotRenew,

    blocked: !!data?.blocked,
    blockedUntil: asDate(data?.blockedUntil),
    blockedReason: typeof data?.blockedReason === "string" ? data.blockedReason : "",

    billing: { periodStart, periodEnd },
    entitlements: normalizeEntitlements(data?.entitlements),
  };
}

export async function getCctTenantStateCached(
  tenantId: string,
  opts?: { bypassCache?: boolean },
): Promise<CctTenantState> {
  TTL_MS = readTtlMs();

  const bypass = !!opts?.bypassCache;
  const now = Date.now();

  if (!bypass) {
    const hit = cache.get(tenantId);
    if (hit && hit.expiresAt > now) {
      stats.hits++;
      if (DEBUG) console.log(`[cct/state] HIT tenant=${tenantId}`);
      return hit.value;
    }

    const inF = inflight.get(tenantId);
    if (inF) {
      stats.inflightHits++;
      if (DEBUG) console.log(`[cct/state] INFLIGHT tenant=${tenantId}`);
      return await inF;
    }

    stats.misses++;
    if (DEBUG) console.log(`[cct/state] MISS tenant=${tenantId}`);

    const p = (async () => {
      const value = await loadTenantState(tenantId);
      cache.set(tenantId, { value, expiresAt: Date.now() + TTL_MS });
      return value;
    })();

    inflight.set(tenantId, p);

    try {
      return await p;
    } finally {
      inflight.delete(tenantId);
    }
  }

  // bypass: fuerza lectura, pero igual refresca cache (para que lo siguiente pegue HIT)
  const value = await loadTenantState(tenantId);
  cache.set(tenantId, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}
