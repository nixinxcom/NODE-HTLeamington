"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  type CctCap,
} from "@/app/lib/cct/caps.catalog";

type Model = "prepago" | "promesa";
type View = "total" | "avg" | "recurrent";
type Unit = "currency" | "pts";
type Currency = "USD" | "CAD" | "MXN" | "EUR" | "GBP";

type Period = {
  key: string;
  label: string;
  months: number;
  discount: number; // 0..1
};

type PackageRow = {
  id: string;
  name: string;
  baseMonthly: number; // en moneda
  includedCaps: CctCap[];
  includedSupportHoursPerMonth: number; // horas incluidas por mes
};

const PREPAGO_PERIODS: Period[] = [
  { key: "m1", label: "Mensual (1m)", months: 1, discount: 0 },
  { key: "m3", label: "Trimestral (3m)", months: 3, discount: 0.0375 },
  { key: "m4", label: "Cuatrimestral (4m)", months: 4, discount: 0.05 },
  { key: "m6", label: "Semestral (6m)", months: 6, discount: 0.075 },
  { key: "m12", label: "Anual (12m)", months: 12, discount: 0.15 },
];

const PROMESA_PERIODS: Period[] = [
  { key: "m3", label: "Trimestral (3m)", months: 3, discount: 0.025 },
  { key: "m4", label: "Cuatrimestral (4m)", months: 4, discount: 0.0333333333333 },
  { key: "m6", label: "Semestral (6m)", months: 6, discount: 0.05 },
  { key: "m12", label: "Anual (12m)", months: 12, discount: 0.10 },
];

const COMMON_PERIOD_KEYS = ["m3", "m4", "m6", "m12"] as const;

// ===== Defaults de paquetes por CAPACIDADES =====
// Pack 1: 7 (autogestión base)
// Nota: dejé fuera "sellsplatforms" para que sí sean 7 exactas.
// Si la quieres dentro, actívala en el editor de caps del UI.
const PACK1_BASE_7: CctCap[] = [
  "website",
  "styledesigner",
  "socialmedia",
  "products",
  "services",
  "contact",
  "branding",
];

// Pack 2: 14 = pack1 + 7 adicionales razonables
const PACK2_14: CctCap[] = [
  ...PACK1_BASE_7,
  "settings",
  "maps",
  "seo",
  "pwa",
  "storage",
  "notifications",
  "gtm",
];

// Pack 3: ALL
const ALL_CAPS: CctCap[] = CCT_CAPS_CATALOG.map((c) => c.key) as CctCap[];

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function pct(n: number): string {
  return `${round2((Number.isFinite(n) ? n : 0) * 100)}%`;
}
function fmtMoney(n: number, currency: Currency): string {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(v);
}
function fmtPts(n: number): string {
  return `${round2(Number.isFinite(n) ? n : 0)} Pts`;
}
function calcTotal(baseMonthly: number, months: number, discount: number): number {
  return round2(baseMonthly * months * (1 - discount));
}
function calcAvgMonthly(total: number, months: number): number {
  return months ? round2(total / months) : 0;
}
function toPts(amountCurrency: number, ptValueCurrency: number): number {
  const v = clamp(ptValueCurrency || 0, 0.000001, 1e12);
  return round2(amountCurrency / v);
}
function fromPts(pts: number, ptValueCurrency: number): number {
  const v = clamp(ptValueCurrency || 0, 0.000001, 1e12);
  return round2(pts * v);
}

/**
 * Promesa:
 * pagan "mensualidad equivalente a prepago mensual" (sin descuento) hasta liquidar el total con descuento.
 * (último pago puede ser parcial)
 */
function calcPromiseSchedule(baseMonthlyWithFees: number, months: number, totalDueWithFees: number) {
  const base = baseMonthlyWithFees <= 0 ? 0 : baseMonthlyWithFees;
  const total = totalDueWithFees <= 0 ? 0 : totalDueWithFees;

  if (base <= 0 || total <= 0 || months <= 0) {
    return { fullMonthsPaying: 0, finalPayment: 0, monthsZero: months };
  }

  let fullMonths = Math.floor(total / base);
  if (fullMonths > months) fullMonths = months;

  const remaining = round2(total - fullMonths * base);

  let finalPayment = 0;
  let monthsZero = 0;

  if (remaining > 0.0001 && fullMonths < months) {
    finalPayment = remaining;
    monthsZero = Math.max(0, months - (fullMonths + 1));
  } else {
    finalPayment = 0;
    monthsZero = Math.max(0, months - fullMonths);
  }

  return {
    fullMonthsPaying: fullMonths,
    finalPayment: round2(finalPayment),
    monthsZero,
  };
}

function uniqueCaps(arr: CctCap[]): CctCap[] {
  return Array.from(new Set(arr));
}

type MembershipCadence = "monthly" | "quarterly" | "fourMonthly" | "semiannual" | "annual";

const CADENCE_BY_KEY: Record<string, MembershipCadence> = {
  m1: "monthly",
  m3: "quarterly",
  m4: "fourMonthly",
  m6: "semiannual",
  m12: "annual",
};

function buildTokenerHref(
  locale: string,
  pkgCaps: CctCap[],
  model: Model,
  periodKey: string
) {
  const sp = new URLSearchParams();
  sp.set("prefill", "1");
  sp.set("lockCaps", "1");
  sp.set("lockPricing", "1");

  sp.set("pricingKind", "membership");
  sp.set("membershipMode", model === "prepago" ? "prepaid" : "promise");
  sp.set(
    "membershipCadence",
    CADENCE_BY_KEY[periodKey] ?? (model === "prepago" ? "monthly" : "quarterly")
  );

  sp.set("caps", uniqueCaps(pkgCaps).join(","));
  return `/${locale}/(org)/(private)/ClientControlPanel/CapacitorTokener?${sp.toString()}`;
}

export default function PricingEmulatorPage() {
  const { locale } = useParams<{ locale: string }>();
  const [model, setModel] = useState<Model>("prepago");
    const router = useRouter();

    // qué periodo vas a mandar al Tokener (no cambia tus tablas)
    const [handoffPeriodKey, setHandoffPeriodKey] = useState<string>(
        model === "prepago" ? "m1" : "m3"
    );

    React.useEffect(() => {
        setHandoffPeriodKey(model === "prepago" ? "m1" : "m3");
    }, [model]);

  const [view, setView] = useState<View>("total");

  // Moneda / Pts
  const [currency, setCurrency] = useState<Currency>("USD");
  const [unit, setUnit] = useState<Unit>("currency");
  const [ptValue, setPtValue] = useState<number>(1); // 1 Pt = $X currency

  // Paquetes: ahora con caps + horas incluidas
  const [packages, setPackages] = useState<PackageRow[]>([
    { id: "p1", name: "Pack 1 (7 caps)", baseMonthly: 99, includedCaps: PACK1_BASE_7, includedSupportHoursPerMonth: 0 },
    { id: "p2", name: "Pack 2 (14 caps)", baseMonthly: 179, includedCaps: PACK2_14, includedSupportHoursPerMonth: 2 },
    { id: "p3", name: "Pack 3 (All caps)", baseMonthly: 299, includedCaps: ALL_CAPS, includedSupportHoursPerMonth: 6 },
  ]);

  // Soporte (add-on)
  const [supportEnabled, setSupportEnabled] = useState<boolean>(false);
  const [supportHourRatePts, setSupportHourRatePts] = useState<number>(35); // default pedido
  const [supportExtraHoursPerMonth, setSupportExtraHoursPerMonth] = useState<number>(0); // para simular

  // PPU / PPE markups (% extra)
  const [ppuEnabled, setPpuEnabled] = useState<boolean>(false);
  const [ppuMarkup, setPpuMarkup] = useState<number>(0.05); // editable
  const [ppeEnabled, setPpeEnabled] = useState<boolean>(false);
  const [ppeMarkup, setPpeMarkup] = useState<number>(0.08); // editable

  const periods = model === "prepago" ? PREPAGO_PERIODS : PROMESA_PERIODS;

  const capLabelByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of CCT_CAPS_CATALOG) m.set(c.key, c.labelKey);
    return m;
  }, []);

  const formatValue = (amountCurrency: number) => {
    if (unit === "currency") return fmtMoney(amountCurrency, currency);
    return fmtPts(toPts(amountCurrency, ptValue));
  };

  const supportRateCurrency = useMemo(() => {
    // 35 Pts/h => $ (según 1Pt=$x)
    return fromPts(supportHourRatePts, ptValue);
  }, [supportHourRatePts, ptValue]);

  const effectiveMarkup = useMemo(() => {
    const a = ppuEnabled ? clamp(ppuMarkup, 0, 5) : 0;
    const b = ppeEnabled ? clamp(ppeMarkup, 0, 5) : 0;
    return a + b;
  }, [ppuEnabled, ppuMarkup, ppeEnabled, ppeMarkup]);

  function updatePkg(id: string, patch: Partial<PackageRow>) {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  // Editor de caps por paquete (si quieres afinar el 7/14/all sin tocar código)
  const [editCaps, setEditCaps] = useState<boolean>(false);

  const rows = useMemo(() => {
    return packages.map((pkg) => {
      const per = periods.map((p) => {
        const baseTotal = calcTotal(pkg.baseMonthly, p.months, p.discount);
        const markupFee = round2(baseTotal * effectiveMarkup);

        const supportExtraHoursTotal = supportEnabled ? round2(supportExtraHoursPerMonth * p.months) : 0;
        const includedHoursTotal = supportEnabled ? round2(pkg.includedSupportHoursPerMonth * p.months) : 0;
        const billableExtraHours = supportEnabled ? Math.max(0, supportExtraHoursTotal - includedHoursTotal) : 0;

        const supportFeeCurrency = supportEnabled ? round2(billableExtraHours * supportRateCurrency) : 0;

        const total = round2(baseTotal + markupFee + supportFeeCurrency);
        const avg = calcAvgMonthly(total, p.months);

        const recurrent =
          model === "prepago"
            ? formatValue(total)
            : (() => {
                // en promesa: mensualidad equivalente a prepago mensual (sin descuento),
                // pero con el mismo % extra si PPU/PPE está activado.
                const monthlyPayBase = round2(pkg.baseMonthly * (1 + effectiveMarkup));
                const totalDue = round2(baseTotal * (1 + effectiveMarkup));

                const sch = calcPromiseSchedule(monthlyPayBase, p.months, totalDue);

                const basePayStr =
                  unit === "currency"
                    ? fmtMoney(monthlyPayBase, currency)
                    : fmtPts(toPts(monthlyPayBase, ptValue));

                const finalPayStr =
                  sch.finalPayment > 0
                    ? unit === "currency"
                      ? fmtMoney(sch.finalPayment, currency)
                      : fmtPts(toPts(sch.finalPayment, ptValue))
                    : null;

                // soporte (si está enabled) lo muestro como “+ soporte extra estimado”
                const supportMonthlyExtraCurrency = supportEnabled
                  ? round2(Math.max(0, supportExtraHoursPerMonth - pkg.includedSupportHoursPerMonth) * supportRateCurrency)
                  : 0;

                const supportMonthlyStr =
                  supportEnabled && supportMonthlyExtraCurrency > 0
                    ? unit === "currency"
                      ? ` + ${fmtMoney(supportMonthlyExtraCurrency, currency)}/mes (soporte)`
                      : ` + ${fmtPts(toPts(supportMonthlyExtraCurrency, ptValue))}/mes (soporte)`
                    : "";

                return finalPayStr
                  ? `${basePayStr} x ${sch.fullMonthsPaying} + ${finalPayStr}${supportMonthlyStr} (meses ${unit === "currency" ? "$0" : "0 Pts"}: ${sch.monthsZero})`
                  : `${basePayStr} x ${sch.fullMonthsPaying}${supportMonthlyStr} (meses ${unit === "currency" ? "$0" : "0 Pts"}: ${sch.monthsZero})`;
              })();

        return {
          period: p,
          baseTotal,
          markupFee,
          supportFeeCurrency,
          total,
          avg,
          recurrent,
          billableExtraHours,
          includedHoursTotal,
        };
      });

      return { pkg, per };
    });
  }, [
    packages,
    periods,
    model,
    unit,
    currency,
    ptValue,
    supportEnabled,
    supportExtraHoursPerMonth,
    supportRateCurrency,
    effectiveMarkup,
  ]);

  const comparison = useMemo(() => {
    const byKey = (arr: Period[], key: string) => arr.find((p) => p.key === key);

    return packages.map((pkg) => {
      const cells = COMMON_PERIOD_KEYS.map((k) => {
        const pPre = byKey(PREPAGO_PERIODS, k);
        const pPro = byKey(PROMESA_PERIODS, k);
        if (!pPre || !pPro) return null;

        const basePre = calcTotal(pkg.baseMonthly, pPre.months, pPre.discount);
        const basePro = calcTotal(pkg.baseMonthly, pPro.months, pPro.discount);

        const totalPre = round2(basePre * (1 + effectiveMarkup));
        const totalPro = round2(basePro * (1 + effectiveMarkup));

        const avgPre = calcAvgMonthly(totalPre, pPre.months);
        const avgPro = calcAvgMonthly(totalPro, pPro.months);

        return {
          key: k,
          label: pPre.label,
          totalPre,
          avgPre,
          totalPro,
          avgPro,
          deltaTotal: round2(totalPro - totalPre),
          deltaAvg: round2(avgPro - avgPre),
        };
      }).filter(Boolean) as any[];

      return { pkg, cells };
    });
  }, [packages, effectiveMarkup]);

  return (
    <DIV className="p-6 max-w-6xl mx-auto">
      <H1 className="text-2xl font-semibold tracking-tight">
        <FM id="pricing.emu.title" defaultMessage="Pricing Emulator (NIXINX)" />
      </H1>

      <P className="mt-2 text-sm text-white/60">
        Paquetes por <SPAN className="font-mono">capacidades</SPAN> + add-ons (soporte, PPU/PPE).
      </P>

      {/* Controles */}
      <DIV className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-5 md:grid-cols-4">
        <DIV className="grid gap-2">
          <LABEL>Modelo</LABEL>
          <SELECT value={model} onChange={(e: any) => setModel(e.target.value)} className="w-full">
            <option value="prepago">Prepago</option>
            <option value="promesa">Promesa de pago</option>
          </SELECT>
        </DIV>

        <DIV className="grid gap-2">
          <LABEL>Vista</LABEL>
          <SELECT value={view} onChange={(e: any) => setView(e.target.value)} className="w-full">
            <option value="total">Total del periodo</option>
            <option value="avg">Promedio mensual</option>
            <option value="recurrent">Pago recurrente</option>
          </SELECT>
        </DIV>

        <DIV className="grid gap-2">
          <LABEL>Moneda</LABEL>
          <SELECT value={currency} onChange={(e: any) => setCurrency(e.target.value)} className="w-full">
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
            <option value="MXN">MXN</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </SELECT>
        </DIV>

        <DIV className="grid gap-2">
          <LABEL>Unidad</LABEL>
          <SELECT value={unit} onChange={(e: any) => setUnit(e.target.value)} className="w-full">
            <option value="currency">Currency</option>
            <option value="pts">Pts</option>
          </SELECT>
        </DIV>
      </DIV>

      {/* Pts conversion */}
      <DIV className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-5">
        <H2 className="text-lg font-semibold">Conversión Pts</H2>
        <DIV className="mt-3 grid gap-3 md:grid-cols-3 items-end">
          <DIV className="grid gap-2">
            <LABEL>1 Pt =</LABEL>
            <INPUT
              type="number"
              inputMode="decimal"
              value={String(ptValue)}
              onChange={(e: any) => setPtValue(Number(e.target.value || 0))}
              className="w-full"
            />
            <P className="text-xs text-white/60">en {currency}. (Ej: 1 Pt = 1.00 {currency})</P>
          </DIV>

          <DIV className="rounded-xl border border-white/10 bg-black/20 p-4">
            <P className="text-sm text-white/70">
              {unit === "currency"
                ? `Mostrando en ${currency}`
                : `Mostrando en Pts (1 Pt = ${fmtMoney(ptValue, currency)})`}
            </P>
            <P className="mt-2 text-xs text-white/50">
              Ejemplo: {fmtMoney(99, currency)} = {fmtPts(toPts(99, ptValue))}
            </P>
          </DIV>

          <DIV className="rounded-xl border border-white/10 bg-black/20 p-4">
            <P className="text-xs text-white/60">
              Sí: puedes llamar “Pts” a lo que quieras. Es básicamente una unidad de cuenta.
            </P>
          </DIV>
        </DIV>
      </DIV>

      {/* Add-ons */}
      <DIV className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-5 md:grid-cols-2">
        <DIV className="rounded-2xl border border-white/10 bg-black/20 p-4 grid gap-3">
          <H2 className="text-lg font-semibold">Soporte (opcional)</H2>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <SPAN className="font-medium">Habilitar soporte gestionado</SPAN>
            <input type="checkbox" checked={supportEnabled} onChange={(e) => setSupportEnabled(e.target.checked)} />
          </label>

          <DIV className="grid gap-2">
            <LABEL>Costo hora-hombre (Pts/h)</LABEL>
            <INPUT
              type="number"
              inputMode="decimal"
              value={String(supportHourRatePts)}
              onChange={(e: any) => setSupportHourRatePts(Number(e.target.value || 0))}
              className="w-full"
              disabled={!supportEnabled}
            />
            <P className="text-xs text-white/60">
              Leyenda: default <SPAN className="font-mono">35 Pts/h</SPAN> ≈{" "}
              <SPAN className="font-mono">{fmtMoney(supportRateCurrency, currency)}/h</SPAN>
            </P>
          </DIV>

          <DIV className="grid gap-2">
            <LABEL>Horas extra/mes (para simular excedentes)</LABEL>
            <INPUT
              type="number"
              inputMode="decimal"
              value={String(supportExtraHoursPerMonth)}
              onChange={(e: any) => setSupportExtraHoursPerMonth(Number(e.target.value || 0))}
              className="w-full"
              disabled={!supportEnabled}
            />
            <P className="text-xs text-white/60">
              Se compara contra “horas incluidas/mes” del paquete.
            </P>
          </DIV>
        </DIV>

        <DIV className="rounded-2xl border border-white/10 bg-black/20 p-4 grid gap-3">
          <H2 className="text-lg font-semibold">PPU / PPE (markup %)</H2>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <SPAN className="font-medium">Activar PPU (% extra)</SPAN>
            <input type="checkbox" checked={ppuEnabled} onChange={(e) => setPpuEnabled(e.target.checked)} />
          </label>

          <DIV className="grid gap-2">
            <LABEL>PPU markup</LABEL>
            <INPUT
              type="number"
              inputMode="decimal"
              value={String(round2(ppuMarkup * 100))}
              onChange={(e: any) => setPpuMarkup(clamp(Number(e.target.value || 0) / 100, 0, 5))}
              className="w-full"
              disabled={!ppuEnabled}
            />
            <P className="text-xs text-white/60">Ej: 5 = 5%</P>
          </DIV>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <SPAN className="font-medium">Activar PPE (% extra)</SPAN>
            <input type="checkbox" checked={ppeEnabled} onChange={(e) => setPpeEnabled(e.target.checked)} />
          </label>

          <DIV className="grid gap-2">
            <LABEL>PPE markup</LABEL>
            <INPUT
              type="number"
              inputMode="decimal"
              value={String(round2(ppeMarkup * 100))}
              onChange={(e: any) => setPpeMarkup(clamp(Number(e.target.value || 0) / 100, 0, 5))}
              className="w-full"
              disabled={!ppeEnabled}
            />
            <P className="text-xs text-white/60">Markup total aplicado: <SPAN className="font-mono">{pct(effectiveMarkup)}</SPAN></P>
          </DIV>
        </DIV>
      </DIV>

      {/* Paquetes */}
      <DIV className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-5">
        <DIV className="flex items-center justify-between gap-3 flex-wrap">
            <DIV className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-5">
            <LABEL>Cadencia a enviar al CCT Tokener</LABEL>
            <SELECT
                value={handoffPeriodKey}
                onChange={(e: any) => setHandoffPeriodKey(e.target.value)}
                className="w-full"
            >
                {(model === "prepago" ? PREPAGO_PERIODS : PROMESA_PERIODS).map((p) => (
                <option key={p.key} value={p.key}>
                    {p.label}
                </option>
                ))}
            </SELECT>
            </DIV>
          <H2 className="text-lg font-semibold">Paquetes (7 / 14 / All) + horas incluidas</H2>

          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={editCaps} onChange={(e) => setEditCaps(e.target.checked)} />
            Editar capacidades por paquete
          </label>
        </DIV>

        <DIV className="grid gap-3 md:grid-cols-3">
          {packages.map((pkg) => (
            <DIV key={pkg.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 grid gap-2">
              <LABEL>Nombre</LABEL>
              <INPUT
                value={pkg.name}
                onChange={(e: any) => updatePkg(pkg.id, { name: e.target.value })}
                className="w-full"
              />

              <LABEL className="mt-2">Precio mensual base ({currency})</LABEL>
              <INPUT
                type="number"
                inputMode="decimal"
                value={String(pkg.baseMonthly)}
                onChange={(e: any) => updatePkg(pkg.id, { baseMonthly: Number(e.target.value || 0) })}
                className="w-full"
              />

              <LABEL className="mt-2">Horas incluidas / mes</LABEL>
              <INPUT
                type="number"
                inputMode="decimal"
                value={String(pkg.includedSupportHoursPerMonth)}
                onChange={(e: any) => updatePkg(pkg.id, { includedSupportHoursPerMonth: Number(e.target.value || 0) })}
                className="w-full"
              />
              <P className="text-xs text-white/60">
                (Si soporte está OFF, esto no impacta costos.)
              </P>

              <DIV className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3">
                <P className="text-xs text-white/60">
                  Capacidades incluidas:{" "}
                  <SPAN className="font-mono">{uniqueCaps(pkg.includedCaps).length}</SPAN>
                </P>
                <P className="mt-2 text-xs text-white/50">
                  {uniqueCaps(pkg.includedCaps)
                    .slice(0, 8)
                    .map((k) => capLabelByKey.get(k) ?? k)
                    .join(" • ")}
                  {uniqueCaps(pkg.includedCaps).length > 8 ? " • …" : ""}
                </P>
              </DIV>

              {editCaps && (
                <DIV className="mt-3 grid gap-2 max-h-[260px] overflow-auto rounded-xl border border-white/10 bg-black/20 p-3">
                  {CCT_CAPS_CATALOG.map((c) => {
                    const checked = pkg.includedCaps.includes(c.key as CctCap);
                    return (
                      <label key={c.key} className="flex items-center justify-between gap-3">
                        <SPAN className="text-sm">{c.labelKey}</SPAN>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? uniqueCaps([...(pkg.includedCaps || []), c.key as CctCap])
                              : (pkg.includedCaps || []).filter((x) => x !== (c.key as CctCap));
                            updatePkg(pkg.id, { includedCaps: next });
                          }}
                        />
                      </label>
                    );
                  })}
                </DIV>
              )}

              <P className="text-xs text-white/60">
                En Pts: <SPAN className="font-mono">{fmtPts(toPts(pkg.baseMonthly, ptValue))}</SPAN>
              </P>
                <BUTTON
                    className="mt-2"
                    onClick={() => {
                        const href = buildTokenerHref(locale, pkg.includedCaps, model, handoffPeriodKey);
                        router.push(href);
                        const params = new URLSearchParams();

                        // lo mínimo
                        params.set("src", "pricing");
                        params.set("lockCaps", "1");
                        params.set("packageId", pkg.id);

                        // caps seleccionadas del paquete
                        params.set("caps", (pkg.includedCaps || []).join(","));

                        // si quieres pasar pricing meta también
                        params.set("currency", currency);
                        params.set("ptValue", String(ptValue));
                        params.set("baseMonthly", String(pkg.baseMonthly));

                        params.set("ppuEnabled", ppuEnabled ? "1" : "0");
                        params.set("ppeEnabled", ppeEnabled ? "1" : "0");
                        params.set("ppuPct", String(ppuMarkup));
                        params.set("ppePct", String(ppeMarkup));

                        params.set("supportEnabled", supportEnabled ? "1" : "0");
                        params.set("supportHourRatePts", String(supportHourRatePts));
                        params.set("supportIncludedHoursPerMonth", String(pkg.includedSupportHoursPerMonth ?? 0));

                        // ✅ OJO: SIN (org)/(private)
                        router.push(`/${locale}/ClientControlPanel/CapacitorTokener?${params.toString()}`);
                    }}
                >
                Pasar a CCT Tokener
            </BUTTON>

            </DIV>
          ))}
        </DIV>
      </DIV>

      {/* Tabla principal */}
      <DIV className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 overflow-auto">
        <H2 className="text-lg font-semibold">
          {model === "prepago" ? "Prepago" : "Promesa de pago"} —{" "}
          {view === "total" ? "Total del periodo" : view === "avg" ? "Promedio mensual" : "Pago recurrente"}
        </H2>

        <P className="mt-2 text-xs text-white/50">
          Total = base (con descuento) + markup PPU/PPE + soporte extra (si excede horas incluidas).
        </P>

        <DIV className="mt-4 min-w-[980px]">
          <DIV className="grid" style={{ gridTemplateColumns: `240px repeat(${periods.length}, 1fr)` }}>
            <DIV className="p-3 text-xs font-semibold text-white/70">Paquete</DIV>
            {periods.map((p) => (
              <DIV key={p.key} className="p-3 text-xs font-semibold text-white/70">
                {p.label} <SPAN className="text-white/40">({pct(p.discount)})</SPAN>
              </DIV>
            ))}

            {rows.map(({ pkg, per }) => (
              <React.Fragment key={pkg.id}>
                <DIV className="p-3 border-t border-white/10">
                  <SPAN className="font-semibold">{pkg.name}</SPAN>
                  <P className="text-xs text-white/50 mt-1">
                    Base mensual: {formatValue(pkg.baseMonthly)} • Caps:{" "}
                    <SPAN className="font-mono">{uniqueCaps(pkg.includedCaps).length}</SPAN>
                    {supportEnabled ? (
                      <>
                        {" "}• Incluye:{" "}
                        <SPAN className="font-mono">{pkg.includedSupportHoursPerMonth}h/mes</SPAN>
                      </>
                    ) : null}
                  </P>
                </DIV>

                {per.map((cell) => {
                  const v =
                    view === "total"
                      ? formatValue(cell.total)
                      : view === "avg"
                      ? formatValue(cell.avg)
                      : cell.recurrent;

                  return (
                    <DIV key={cell.period.key} className="p-3 border-t border-white/10">
                      <SPAN className="text-sm">{v}</SPAN>

                      {(supportEnabled || effectiveMarkup > 0) && view !== "recurrent" && (
                        <P className="mt-2 text-xs text-white/50">
                          {effectiveMarkup > 0 ? (
                            <>
                              Markup: <SPAN className="font-mono">{formatValue(cell.markupFee)}</SPAN>{" "}
                            </>
                          ) : null}
                          {supportEnabled ? (
                            <>
                              Soporte extra:{" "}
                              <SPAN className="font-mono">{formatValue(cell.supportFeeCurrency)}</SPAN>{" "}
                              <SPAN className="text-white/40">
                                (exceso: {round2(cell.billableExtraHours)}h)
                              </SPAN>
                            </>
                          ) : null}
                        </P>
                      )}
                    </DIV>
                  );
                })}
              </React.Fragment>
            ))}
          </DIV>
        </DIV>
      </DIV>

      {/* Comparativa */}
      <DIV className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 overflow-auto">
        <H2 className="text-lg font-semibold">
          Comparativa — Prepago vs Promesa (3/4/6/12 meses)
        </H2>

        <P className="mt-2 text-xs text-white/50">
          Comparativa incluye el markup PPU/PPE. (Soporte extra no se incluye aquí porque es variable por horas.)
        </P>

        <DIV className="mt-4 min-w-[1100px]">
          <DIV className="grid" style={{ gridTemplateColumns: `240px repeat(${COMMON_PERIOD_KEYS.length}, 1fr)` }}>
            <DIV className="p-3 text-xs font-semibold text-white/70">Paquete</DIV>
            {COMMON_PERIOD_KEYS.map((k) => {
              const label = PREPAGO_PERIODS.find((p) => p.key === k)?.label ?? k;
              return (
                <DIV key={k} className="p-3 text-xs font-semibold text-white/70">
                  {label}
                </DIV>
              );
            })}

            {comparison.map(({ pkg, cells }: any) => (
              <React.Fragment key={pkg.id}>
                <DIV className="p-3 border-t border-white/10">
                  <SPAN className="font-semibold">{pkg.name}</SPAN>
                  <P className="text-xs text-white/50 mt-1">
                    Base mensual: {formatValue(pkg.baseMonthly)} • Caps:{" "}
                    <SPAN className="font-mono">{uniqueCaps(pkg.includedCaps).length}</SPAN>
                  </P>
                </DIV>

                {cells.map((c: any) => (
                  <DIV key={c.key} className="p-3 border-t border-white/10">
                    <P className="text-xs text-white/60">Prepago</P>
                    <P className="text-sm">
                      {formatValue(c.totalPre)}{" "}
                      <SPAN className="text-white/50">({formatValue(c.avgPre)}/mes)</SPAN>
                    </P>

                    <P className="mt-2 text-xs text-white/60">Promesa</P>
                    <P className="text-sm">
                      {formatValue(c.totalPro)}{" "}
                      <SPAN className="text-white/50">({formatValue(c.avgPro)}/mes)</SPAN>
                    </P>

                    <P className="mt-2 text-xs text-white/60">Δ (Promesa - Prepago)</P>
                    <P className="text-sm">
                      {formatValue(c.deltaTotal)}{" "}
                      <SPAN className="text-white/50">({formatValue(c.deltaAvg)}/mes)</SPAN>
                    </P>
                  </DIV>
                ))}
              </React.Fragment>
            ))}
          </DIV>
        </DIV>

        <P className="mt-4 text-xs text-white/50">
          Ruta: /{locale}/ClientControlPanel/PricingEmulator
        </P>
      </DIV>

      <DIV className="mt-6 flex items-center gap-3 flex-wrap">
        <BUTTON
          variant="ghost"
          onClick={() => {
            setModel("prepago");
            setView("total");
            setCurrency("USD");
            setUnit("currency");
            setPtValue(1);

            setSupportEnabled(false);
            setSupportHourRatePts(35);
            setSupportExtraHoursPerMonth(0);

            setPpuEnabled(false);
            setPpuMarkup(0.05);
            setPpeEnabled(false);
            setPpeMarkup(0.08);

            setEditCaps(false);

            setPackages([
              { id: "p1", name: "Pack 1 (7 caps)", baseMonthly: 99, includedCaps: PACK1_BASE_7, includedSupportHoursPerMonth: 0 },
              { id: "p2", name: "Pack 2 (14 caps)", baseMonthly: 179, includedCaps: PACK2_14, includedSupportHoursPerMonth: 2 },
              { id: "p3", name: "Pack 3 (All caps)", baseMonthly: 299, includedCaps: ALL_CAPS, includedSupportHoursPerMonth: 6 },
            ]);
          }}
        >
          Reset (defaults)
        </BUTTON>

        <P className="text-xs text-white/50">
          Soporte: default <SPAN className="font-mono">35 Pts/h</SPAN>. Sí, lo puedes cambiar.
        </P>
      </DIV>
    </DIV>
  );
}
