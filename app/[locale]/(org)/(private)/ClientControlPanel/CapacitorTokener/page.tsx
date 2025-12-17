"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

import AdminGuard, { useAuth } from "@/complements/admin/AdminGuard";
import SuperAdminOnly from "@/complements/admin/SuperAdminOnly";
import FM from "@/complements/i18n/FM";

import {
  BUTTON,
  H1,
  H2,
  P,
  LABEL,
  INPUT,
  SELECT,
  DIV,
  SPAN,
} from "@/complements/components/ui/wrappers";

import {
  CCT_CAPS_CATALOG,
  CCT_CAPS,
  DEFAULT_CAP_CHECKS,
  type CctCap,
} from "@/app/lib/cct/caps.catalog";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";

/** ====== Pricing v2 (extendible) ====== */
type Currency = "USD" | "CAD" | "MXN" | "EUR" | "GBP";

type MembershipCadence =
  | "monthly"
  | "quarterly"
  | "fourMonthly"
  | "semiannual"
  | "annual";

type PricingModel =
  | {
      kind: "membership";
      mode: "prepaid" | "promise";
      cadence: MembershipCadence;

      currency?: Currency;
      ptValue?: number; // 1 Pt = $x currency
      baseMonthly?: number; // precio mensual base (currency)
      packageId?: string | null;

      support?: {
        enabled?: boolean;
        hourRatePts?: number; // default 35
        includedHoursPerMonth?: number;
      };

      markups?: {
        ppuEnabled?: boolean;
        ppeEnabled?: boolean;
        ppuPct?: number; // 0.05 = 5%
        ppePct?: number;
      };
    }
  | {
      kind: "no_membership";
      mode: "event" | "usage";

      currency?: Currency;
      ptValue?: number;
      packageId?: string | null;

      support?: {
        enabled?: boolean;
        hourRatePts?: number;
        includedHoursPerMonth?: number;
      };

      markups?: {
        ppuEnabled?: boolean;
        ppeEnabled?: boolean;
        ppuPct?: number;
        ppePct?: number;
      };
    };

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PREPAID_CADENCES: Array<{ value: MembershipCadence; label: string }> = [
  { value: "monthly", label: "Mensual" },
  { value: "quarterly", label: "Trimestral" },
  { value: "fourMonthly", label: "Cuatrimestral" },
  { value: "semiannual", label: "Semestral" },
  { value: "annual", label: "Anual" },
];

const PROMISE_CADENCES: Array<{
  value: Exclude<MembershipCadence, "monthly">;
  label: string;
}> = [
  { value: "quarterly", label: "Trimestral" },
  { value: "fourMonthly", label: "Cuatrimestral" },
  { value: "semiannual", label: "Semestral" },
  { value: "annual", label: "Anual" },
];

function cadenceToMonths(c: MembershipCadence): 1 | 3 | 4 | 6 | 12 {
  switch (c) {
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "fourMonthly":
      return 4;
    case "semiannual":
      return 6;
    case "annual":
      return 12;
  }
}

function addMonthsMinusOneDay(startYYYYMMDD: string, months: number): string {
  const [y, m, d] = startYYYYMMDD.split("-").map((x) => Number(x));
  if (!y || !m || !d) return startYYYYMMDD;

  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const end = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth() + months,
      start.getUTCDate(),
      0,
      0,
      0
    )
  );
  end.setUTCDate(end.getUTCDate() - 1);

  const yy = end.getUTCFullYear();
  const mm = String(end.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(end.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** ====== Prefill helpers ====== */
function parseBool(v: string | null): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function parseNum(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseCurrency(v: string | null): Currency | null {
  const s = (v ?? "").trim().toUpperCase();
  if (s === "USD" || s === "CAD" || s === "MXN" || s === "EUR" || s === "GBP")
    return s as Currency;
  return null;
}

function parseCadence(v: string | null): MembershipCadence | null {
  const s = (v ?? "").trim();
  if (
    s === "monthly" ||
    s === "quarterly" ||
    s === "fourMonthly" ||
    s === "semiannual" ||
    s === "annual"
  )
    return s;
  return null;
}

function parseMembershipMode(v: string | null): "prepaid" | "promise" | null {
  const s = (v ?? "").trim();
  if (s === "prepaid" || s === "promise") return s;
  return null;
}

function parsePricingKind(v: string | null): PricingModel["kind"] | null {
  const s = (v ?? "").trim();
  if (s === "membership" || s === "no_membership") return s;
  return null;
}

function parseNoMembershipMode(v: string | null): "event" | "usage" | null {
  const s = (v ?? "").trim();
  if (s === "event" || s === "usage") return s;
  return null;
}

/**
 * caps:
 * - ?caps=a,b,c
 * - ?cap=a&cap=b
 */
function parseCaps(sp: ReadonlyURLSearchParams): CctCap[] | null {
  const direct = sp.get("caps");
  const repeated = sp.getAll("cap");

  const raw: string[] = [];
  if (direct)
    raw.push(...direct.split(",").map((x) => x.trim()).filter(Boolean));
  if (repeated?.length)
    raw.push(...repeated.map((x) => x.trim()).filter(Boolean));
  if (!raw.length) return null;

  const allowed = new Set<string>(CCT_CAPS as unknown as string[]);
  const cleaned = raw
    .filter((x) => allowed.has(x))
    .map((x) => x as CctCap);

  if (!cleaned.length) return null;
  return Array.from(new Set(cleaned));
}

export default function CapacitorTokenerPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const qs = sp.toString(); // ✅ dependency estable
  const { locale } = useParams<{ locale: string }>();
  const { role, idToken, user } = useAuth();

  /** ====== Prefill: contrato tolerante (prefill=1 o src=pricing) ====== */
  const prefill = useMemo(() => {
    const src = (sp.get("src") || "").toLowerCase();
    const fromPricing = src === "pricing" || src === "pricingemulator";
    const enabled = fromPricing || parseBool(sp.get("prefill"));

    const lockCaps = enabled && (parseBool(sp.get("lockCaps")) || fromPricing);
    const lockPricing = enabled && (parseBool(sp.get("lockPricing")) || fromPricing);

    const caps = parseCaps(sp);
    const packageId = sp.get("packageId") || null;

    const currency = parseCurrency(sp.get("currency")) ?? "USD";
    const ptValue = parseNum(sp.get("ptValue"), 1);
    const baseMonthly = parseNum(sp.get("baseMonthly"), 0);

    const pricingKind = parsePricingKind(sp.get("pricingKind")) ?? "membership";
    const membershipMode = parseMembershipMode(sp.get("membershipMode")) ?? "prepaid";
    const membershipCadence = parseCadence(sp.get("membershipCadence")) ??
      (membershipMode === "promise" ? "quarterly" : "monthly");
    const noMembershipMode = parseNoMembershipMode(sp.get("noMembershipMode")) ?? "event";

    const periodStart = sp.get("periodStart"); // YYYY-MM-DD (opcional)
    const autoEnd = parseBool(sp.get("autoEnd"));

    const ppuEnabled = parseBool(sp.get("ppuEnabled"));
    const ppeEnabled = parseBool(sp.get("ppeEnabled"));
    const ppuPct = parseNum(sp.get("ppuPct"), 0);
    const ppePct = parseNum(sp.get("ppePct"), 0);

    const supportEnabled = parseBool(sp.get("supportEnabled"));
    const hourRatePts = parseNum(sp.get("supportHourRatePts"), 35);
    const includedHoursPerMonth = parseNum(sp.get("supportIncludedHoursPerMonth"), 0);

    return {
      enabled,
      fromPricing,
      lockCaps,
      lockPricing,
      caps,
      packageId,
      currency,
      ptValue,
      baseMonthly,
      pricingKind,
      membershipMode,
      membershipCadence,
      noMembershipMode,
      periodStart,
      autoEnd,
      ppuEnabled,
      ppeEnabled,
      ppuPct,
      ppePct,
      supportEnabled,
      hourRatePts,
      includedHoursPerMonth,
    };
  }, [qs]); // ✅

  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");

  const [pricingKind, setPricingKind] = useState<PricingModel["kind"]>("membership");
  const [membershipMode, setMembershipMode] = useState<"prepaid" | "promise">("prepaid");
  const [membershipCadence, setMembershipCadence] = useState<MembershipCadence>("monthly");
  const [noMembershipMode, setNoMembershipMode] = useState<"event" | "usage">("event");

  const [periodStart, setPeriodStart] = useState<string>(todayIsoDate());
  const [periodEnd, setPeriodEnd] = useState<string>("2025-12-31");
  const [autoEnd, setAutoEnd] = useState<boolean>(true);

  // pricing extras
  const [currency, setCurrency] = useState<Currency>("USD");
  const [ptValue, setPtValue] = useState<number>(1);
  const [baseMonthly, setBaseMonthly] = useState<number>(0);
  const [packageId, setPackageId] = useState<string | null>(null);

  const [ppuEnabled, setPpuEnabled] = useState<boolean>(false);
  const [ppeEnabled, setPpeEnabled] = useState<boolean>(false);
  const [ppuPct, setPpuPct] = useState<number>(0);
  const [ppePct, setPpePct] = useState<number>(0);

  const [supportEnabled, setSupportEnabled] = useState<boolean>(false);
  const [supportHourRatePts, setSupportHourRatePts] = useState<number>(35);
  const [includedSupportHoursPerMonth, setIncludedSupportHoursPerMonth] = useState<number>(0);

  const [capsLocked, setCapsLocked] = useState<boolean>(false);
  const [pricingLocked, setPricingLocked] = useState<boolean>(false);

  // caps (si viene prefill, se aplica en effect)
  const [capChecks, setCapChecks] = useState<Record<CctCap, boolean>>(() => ({
    ...DEFAULT_CAP_CHECKS,
  }));

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  /** ✅ aplicar prefill 1 vez por qs */
  const lastAppliedQsRef = useRef<string>("");

  useEffect(() => {
    if (!prefill.enabled) return;
    if (lastAppliedQsRef.current === qs) return;
    lastAppliedQsRef.current = qs;

    setCapsLocked(!!prefill.lockCaps);
    setPricingLocked(!!prefill.lockPricing);

    setPricingKind(prefill.pricingKind);
    setMembershipMode(prefill.membershipMode);
    setMembershipCadence(prefill.membershipCadence);
    setNoMembershipMode(prefill.noMembershipMode);

    setCurrency(prefill.currency);
    setPtValue(prefill.ptValue);
    setBaseMonthly(prefill.baseMonthly);
    setPackageId(prefill.packageId);

    setPpuEnabled(prefill.ppuEnabled);
    setPpeEnabled(prefill.ppeEnabled);
    setPpuPct(prefill.ppuPct);
    setPpePct(prefill.ppePct);

    setSupportEnabled(prefill.supportEnabled);
    setSupportHourRatePts(prefill.hourRatePts);
    setIncludedSupportHoursPerMonth(prefill.includedHoursPerMonth);

    if (prefill.periodStart && /^\d{4}-\d{2}-\d{2}$/.test(prefill.periodStart)) {
      setPeriodStart(prefill.periodStart);
    }

    // si te mandan autoEnd explícito lo respeto; si no, queda el default (true)
    if (sp.get("autoEnd") !== null) setAutoEnd(!!prefill.autoEnd);

    // caps
    if (prefill.caps?.length) {
      setCapChecks(() => {
        const base = { ...DEFAULT_CAP_CHECKS };
        for (const c of CCT_CAPS) base[c] = false;
        for (const c of prefill.caps!) base[c] = true;
        return base;
      });
    }
  }, [prefill.enabled, qs]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Si cambias a promise y estabas en monthly -> corrige */
  useEffect(() => {
    if (membershipMode === "promise" && membershipCadence === "monthly") {
      setMembershipCadence("quarterly");
    }
  }, [membershipMode, membershipCadence]);

  /** auto periodEnd */
  useEffect(() => {
    if (!autoEnd) return;
    if (pricingKind !== "membership") return;

    const months = cadenceToMonths(membershipCadence);
    setPeriodEnd(addMonthsMinusOneDay(periodStart, months));
  }, [autoEnd, pricingKind, membershipCadence, periodStart]);

  /** refresh claims temprano */
  useEffect(() => {
    const anyUser = user as any;
    if (anyUser?.getIdToken) {
      anyUser.getIdToken(true).catch(() => null);
    }
  }, [user]);

  const pricingModel: PricingModel = useMemo(() => {
    const common = {
      currency,
      ptValue,
      packageId,
      support: {
        enabled: supportEnabled,
        hourRatePts: supportHourRatePts,
        includedHoursPerMonth: includedSupportHoursPerMonth,
      },
      markups: {
        ppuEnabled,
        ppeEnabled,
        ppuPct,
        ppePct,
      },
    };

    if (pricingKind === "membership") {
      return {
        kind: "membership",
        mode: membershipMode,
        cadence: membershipCadence,
        baseMonthly,
        ...common,
      };
    }

    return {
      kind: "no_membership",
      mode: noMembershipMode,
      ...common,
    };
  }, [
    pricingKind,
    membershipMode,
    membershipCadence,
    noMembershipMode,
    currency,
    ptValue,
    baseMonthly,
    packageId,
    supportEnabled,
    supportHourRatePts,
    includedSupportHoursPerMonth,
    ppuEnabled,
    ppeEnabled,
    ppuPct,
    ppePct,
  ]);

  const enabledCaps = useMemo(() => {
    return CCT_CAPS.filter((c) => !!capChecks[c]);
  }, [capChecks]);

  function goToPricingEmulator() {
    router.push(`/${locale}/ClientControlPanel/PricingEmulator`);
  }

  async function saveClient() {
    const cid = clientId.trim();
    const cname = clientName.trim();

    if (!cid) {
      setStatus("⛔ Falta clientId.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]{2,80}$/.test(cid)) {
      setStatus("⛔ clientId inválido. Usa solo letras/números/_/- (2..80).");
      return;
    }

    setBusy(true);
    setStatus("Guardando…");

    try {
      const anyUser = user as any;
      const fresh =
        typeof anyUser?.getIdToken === "function"
          ? await anyUser.getIdToken(true).catch(() => null)
          : null;

      const authzToken = fresh || idToken || null;

      const requestId = crypto.randomUUID();

      const entitlements: Record<string, any> = {};
      for (const cap of CCT_CAPS) {
        entitlements[cap] = {
          status: capChecks[cap] ? "active" : "inactive",
          note: "init",
          ref: "org/CapacitorTokener",
        };
      }

      const setResp = await fetch("/api/cct/state/set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authzToken ? { Authorization: `Bearer ${authzToken}` } : {}),
        },
        cache: "no-store",
        body: JSON.stringify({
          tenantId: cid,
          billing: {
            periodStart: periodStart ? `${periodStart}T00:00:00.000Z` : null,
            periodEnd: periodEnd ? `${periodEnd}T23:59:59.999Z` : null,
            autoEnd,
          },
          entitlements,
          syncCapsFromEntitlements: true,
          bumpRev: true,
          requestId,
          manualDates: false,
          pricing: pricingModel,
          capsLocked,
          pricingLocked,
          packageId: packageId ?? null,
        }),
      });

      const setJson = await setResp.json().catch(() => null);
      if (!setResp.ok || !setJson?.ok) {
        const err = setJson?.error || `http_${setResp.status}`;
        throw new Error(`state/set failed: ${err}`);
      }

      const issueResp = await fetch("/api/cct/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          clientId: cid,
          ttlSec: 12 * 3600,
        }),
      });

      const issueJson = await issueResp.json().catch(() => null);
      if (!issueResp.ok || !issueJson?.ok || typeof issueJson?.token !== "string") {
        const err = issueJson?.error || `http_${issueResp.status}`;
        throw new Error(`cct/issue failed: ${err}`);
      }

      await setDoc(
        doc(FbDB, "CoreCapsTokens", cid),
        {
          clientId: cid,
          clientName: cname || null,

          pricing: pricingModel,
          billing: {
            periodStart: periodStart ? `${periodStart}T00:00:00.000Z` : null,
            periodEnd: periodEnd ? `${periodEnd}T23:59:59.999Z` : null,
            autoEnd,
          },

          caps: enabledCaps,
          capsLocked,
          pricingLocked,
          packageId: packageId ?? null,

          entitlementsSnapshot: Object.fromEntries(
            CCT_CAPS.map((cap) => [
              cap,
              { status: capChecks[cap] ? "active" : "inactive" },
            ])
          ),

          token: issueJson.token,
          tokenMeta: {
            rev: issueJson.rev ?? null,
            iat: issueJson.iat ?? null,
            exp: issueJson.exp ?? null,
            periodStart: issueJson.periodStart ?? null,
            periodEnd: issueJson.periodEnd ?? null,
          },

          createdBy: user?.email ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setStatus("✅ Cliente creado + estado aplicado + token emitido y guardado.");
    } catch (e: any) {
      setStatus(`⛔ Error: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminGuard agentId="default" showUserChip>
      <SuperAdminOnly>
        <DIV className="p-6 max-w-3xl mx-auto">
          <H1 className="text-2xl font-semibold tracking-tight">
            <FM
              id="admin.clients.title"
              defaultMessage="Alta de Clientes (Capacitor / CCT)"
            />
          </H1>

          <P className="mt-2 text-xs text-white/50">
            role: <SPAN className="font-mono">{String(role)}</SPAN> | email:{" "}
            <SPAN className="font-mono">{String(user?.email)}</SPAN>
          </P>

          {(capsLocked || pricingLocked) && (
            <DIV className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <P className="text-sm text-emerald-200">
                ✅ Precargado desde PricingEmulator.{" "}
                {capsLocked ? "Caps bloqueadas. " : ""}
                {pricingLocked ? "Pricing bloqueado." : ""}
              </P>
              <DIV className="mt-3 flex gap-3 flex-wrap">
                <BUTTON variant="ghost" onClick={goToPricingEmulator}>
                  Editar en emulator
                </BUTTON>
                <BUTTON
                  variant="ghost"
                  onClick={() => {
                    setCapsLocked(false);
                    setPricingLocked(false);
                  }}
                >
                  Desbloquear (manual)
                </BUTTON>
              </DIV>
            </DIV>
          )}

          <DIV className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-5">
            <H2 className="text-lg font-semibold">
              <FM id="admin.clients.clientData" defaultMessage="Cliente" />
            </H2>

            <DIV className="grid gap-2">
              <LABEL>clientId</LABEL>
              <INPUT
                value={clientId}
                onChange={(e: any) => setClientId(e.target.value)}
                placeholder="Ej: HTWindsor"
                className="w-full"
              />
            </DIV>

            <DIV className="grid gap-2">
              <LABEL>clientName</LABEL>
              <INPUT
                value={clientName}
                onChange={(e: any) => setClientName(e.target.value)}
                placeholder="Ej: HT Windsor"
                className="w-full"
              />
            </DIV>

            <DIV className="grid gap-3 md:grid-cols-2">
              <DIV className="grid gap-2">
                <LABEL>Modelo</LABEL>
                <SELECT
                  value={pricingKind}
                  onChange={(e: any) => setPricingKind(e.target.value)}
                  className="w-full"
                  disabled={pricingLocked}
                >
                  <option value="membership">Con membresía</option>
                  <option value="no_membership">Sin membresía</option>
                </SELECT>
              </DIV>

              <DIV className="grid gap-2">
                <LABEL>Modalidad</LABEL>
                {pricingKind === "membership" ? (
                  <SELECT
                    value={membershipMode}
                    onChange={(e: any) => setMembershipMode(e.target.value)}
                    className="w-full"
                    disabled={pricingLocked}
                  >
                    <option value="prepaid">Prepago</option>
                    <option value="promise">Promesa de pago</option>
                  </SELECT>
                ) : (
                  <SELECT
                    value={noMembershipMode}
                    onChange={(e: any) => setNoMembershipMode(e.target.value)}
                    className="w-full"
                    disabled={pricingLocked}
                  >
                    <option value="event">Pago por evento</option>
                    <option value="usage">Pago por uso</option>
                  </SELECT>
                )}
              </DIV>
            </DIV>

            {pricingKind === "membership" && (
              <DIV className="grid gap-2">
                <LABEL>Periodicidad</LABEL>
                <SELECT
                  value={membershipCadence}
                  onChange={(e: any) => setMembershipCadence(e.target.value)}
                  className="w-full"
                  disabled={pricingLocked}
                >
                  {(membershipMode === "prepaid"
                    ? PREPAID_CADENCES
                    : PROMISE_CADENCES
                  ).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SELECT>
              </DIV>
            )}

            <DIV className="grid gap-3 md:grid-cols-2">
              <DIV className="grid gap-2">
                <LABEL>Periodo start</LABEL>
                <INPUT
                  type="date"
                  value={periodStart}
                  onChange={(e: any) => setPeriodStart(e.target.value)}
                  className="w-full"
                />
              </DIV>
              <DIV className="grid gap-2">
                <LABEL>Periodo end</LABEL>
                <INPUT
                  type="date"
                  value={periodEnd}
                  onChange={(e: any) => setPeriodEnd(e.target.value)}
                  className="w-full"
                  disabled={autoEnd}
                />
              </DIV>
            </DIV>

            <DIV className="grid gap-2">
              <LABEL>Auto-calcular end</LABEL>
              <SELECT
                value={autoEnd ? "on" : "off"}
                onChange={(e: any) => setAutoEnd(e.target.value === "on")}
                className="w-full"
              >
                <option value="on">ON</option>
                <option value="off">OFF</option>
              </SELECT>
            </DIV>

            <DIV className="mt-2 grid gap-3 md:grid-cols-2">
              <DIV className="grid gap-2">
                <LABEL>Moneda</LABEL>
                <SELECT
                  value={currency}
                  onChange={(e: any) => setCurrency(e.target.value)}
                  className="w-full"
                  disabled={pricingLocked}
                >
                  <option value="USD">USD</option>
                  <option value="CAD">CAD</option>
                  <option value="MXN">MXN</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </SELECT>
              </DIV>

              <DIV className="grid gap-2">
                <LABEL>1 Pt = $x</LABEL>
                <INPUT
                  type="number"
                  inputMode="decimal"
                  value={String(ptValue)}
                  onChange={(e: any) => setPtValue(Number(e.target.value || 0))}
                  className="w-full"
                  disabled={pricingLocked}
                />
              </DIV>
            </DIV>

            <DIV className="mt-2 grid gap-3 md:grid-cols-2">
              <DIV className="grid gap-2">
                <LABEL>packageId</LABEL>
                <INPUT
                  value={packageId ?? ""}
                  onChange={(e: any) => setPackageId(e.target.value || null)}
                  className="w-full"
                  disabled={pricingLocked}
                />
              </DIV>

              <DIV className="grid gap-2">
                <LABEL>baseMonthly</LABEL>
                <INPUT
                  type="number"
                  inputMode="decimal"
                  value={String(baseMonthly)}
                  onChange={(e: any) =>
                    setBaseMonthly(Number(e.target.value || 0))
                  }
                  className="w-full"
                  disabled={pricingLocked}
                />
              </DIV>
            </DIV>
          </DIV>

          <DIV className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-5">
            <H2 className="text-lg font-semibold">
              <FM
                id="admin.clients.caps"
                defaultMessage="Capacidades (por default)"
              />
            </H2>

            <P className="text-xs text-white/60">
              Seleccionadas:{" "}
              <SPAN className="font-mono">{enabledCaps.length}</SPAN> /{" "}
              <SPAN className="font-mono">{CCT_CAPS_CATALOG.length}</SPAN>
            </P>

            <DIV className="grid gap-2">
              {CCT_CAPS_CATALOG.map(({ key, labelKey }) => (
                <label
                  key={key}
                  className={`flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 ${
                    capsLocked ? "opacity-80" : ""
                  }`}
                >
                  <SPAN className="font-medium">{labelKey}</SPAN>
                  <input
                    type="checkbox"
                    checked={!!capChecks[key]}
                    disabled={capsLocked}
                    onChange={(e) =>
                      setCapChecks((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                  />
                </label>
              ))}
            </DIV>
          </DIV>

          <DIV className="mt-6 flex items-center gap-3 flex-wrap">
            <BUTTON onClick={saveClient} disabled={busy}>
              {busy ? "Guardando…" : "Crear cliente + emitir token"}
            </BUTTON>

            <BUTTON
              variant="ghost"
              onClick={() => {
                setClientId("");
                setClientName("");
                setStatus("");

                // reset sin pelearte con prefill (si vienes de emulator, vuelve a aplicar por qs)
                lastAppliedQsRef.current = "";
                router.refresh();
              }}
              disabled={busy}
            >
              Reset
            </BUTTON>
          </DIV>

          {!!status && (
            <DIV className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
              <P className="text-sm">{status}</P>
            </DIV>
          )}

          <P className="mt-6 text-xs text-white/50">
            Ruta: /{locale}/(org)/(private)/ClientControlPanel/CapacitorTokener
          </P>
        </DIV>
      </SuperAdminOnly>
    </AdminGuard>
  );
}
