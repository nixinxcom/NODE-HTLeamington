"use client";
import React, { useEffect, useMemo, useState } from "react";
import { saveSettingsClient } from "@/app/lib/settings/client";
import Link from "next/link";
import Image from "next/image";
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

/* ========= Tipos / Constantes ========= */
type ThemeKey = string;
type ComponentKey = string;
type StyleState =
  | "rest" | "hover" | "active" | "disabled"
  | "highlight" | "highhover" | "inert" | "focus" | "visited" | "warning" | "error";

type TransitionSpeedKey = "verySlow" | "slow" | "normal" | "fast" | "veryFast";
const TRANSITION_SPEEDS: Record<TransitionSpeedKey, string> = {
  verySlow: "500ms",
  slow: "320ms",
  normal: "200ms",
  fast: "120ms",
  veryFast: "80ms",
};

export type TokenSet = {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  opacity?: number;
  cursor?: string;

  borderRadius?: number;
  borderWidth?: number;
  boxShadow?: string;
  outlineColor?: string;
  outlineWidth?: string;

  paddingX?: number;
  paddingY?: number;
  marginX?: number;
  marginY?: number;

  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;

  transitionSpeed?: TransitionSpeedKey;
};

export type StylesSchema = {
  $version: 1;
  themes: ThemeKey[];
  global: {
    body: Record<ThemeKey, TokenSet>;
    font?: { baseFamily?: string; scale?: number };
  };
  components: Record<ComponentKey, Record<ThemeKey, Record<StyleState, TokenSet>>>;
};

const BASE_COMPONENTS: ComponentKey[] = [
  "input","select","button","label",
  "h1","h2","h3","h4","h5","h6",
  "a","p","image","nextimage","link"
];
const STATES: StyleState[] = [
  "rest","hover","active","disabled","highlight","highhover",
  "inert","focus","visited","warning","error"
];
const NON_REST_STATES: StyleState[] = [
  "hover","active","disabled","highlight","highhover","inert","focus","visited","warning","error"
];
const BASE_THEMES: ThemeKey[] = ["light","dark"];

const DEFAULT_TOKENS: TokenSet = {
  backgroundColor: "#ffffff",
  textColor: "#111827",
  borderColor: "#e5e7eb",
  borderRadius: 10,
  borderWidth: 1,
  paddingX: 12,
  paddingY: 10,
  marginX: 0,
  marginY: 8,
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: 0,
  lineHeight: 1.3,
  transitionSpeed: "normal",
};
/* ========= Utils ========= */
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function deepMerge<T extends Record<string, any>>(a: T, b?: Partial<T>): T {
  if (!b) return a;
  const out: any = Array.isArray(a) ? [...a] : { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === "object" && !Array.isArray(v)) out[k] = deepMerge((a as any)[k] ?? {}, v as any);
    else if (v !== undefined) out[k] = v;
  }
  return out;
}

function toKey(name: string) {
  return name.trim().replace(/\s+/g, "-").toLowerCase();
}

/* ========= Herencia desde REST ========= */
function resolveTokens(
  schema: StylesSchema,
  comp: ComponentKey,
  theme: ThemeKey,
  state: StyleState
): TokenSet {
  const themeMap = schema.components[comp]?.[theme] ?? {};
  const rest = themeMap.rest ?? {};
  const stateRaw = state === "rest" ? {} : (themeMap[state] ?? {});
  return { ...DEFAULT_TOKENS, ...rest, ...stateRaw };
}

function clearStateOverrides(sc: StylesSchema, theme: ThemeKey, comp: ComponentKey, state: StyleState): StylesSchema {
  if (state === "rest") return sc;
  const next = clone(sc);
  next.components[comp] ??= {} as any;
  (next.components[comp] as any)[theme] ??= {} as any;
  (next.components[comp] as any)[theme][state] = {};
  return next;
}

function copyRestToState(sc: StylesSchema, theme: ThemeKey, comp: ComponentKey, state: StyleState): StylesSchema {
  if (state === "rest") return sc;
  const next = clone(sc);
  const rest = next.components[comp]?.[theme]?.rest ?? {};
  next.components[comp] ??= {} as any;
  (next.components[comp] as any)[theme] ??= {} as any;
  (next.components[comp] as any)[theme][state] = clone(rest);
  return next;
}

function copyRestToAllStates(sc: StylesSchema, theme: ThemeKey, comp: ComponentKey): StylesSchema {
  const next = clone(sc);
  next.components[comp] ??= {} as any;
  (next.components[comp] as any)[theme] ??= {} as any;
  const rest = (next.components[comp] as any)[theme]?.rest ?? {};
  if (!rest || Object.keys(rest).length === 0) return next;
  for (const st of NON_REST_STATES) (next.components[comp] as any)[theme][st] = clone(rest);
  return next;
}

type TokenKey = keyof TokenSet;

function unsetToken(sc: StylesSchema, theme: ThemeKey, comp: ComponentKey, state: StyleState, key: TokenKey): StylesSchema {
  const next = clone(sc);
  next.components[comp] ??= {} as any;
  (next.components[comp] as any)[theme] ??= {} as any;
  const cur = ((next.components[comp] as any)[theme][state] ?? {}) as TokenSet;
  if (cur && key in cur) {
    delete (cur as any)[key];
    (next.components[comp] as any)[theme][state] = { ...cur };
  }
  return next;
}

function copyRestPropsToState(
  sc: StylesSchema, theme: ThemeKey, comp: ComponentKey, state: StyleState, props: Set<TokenKey>
): StylesSchema {
  if (state === "rest") return sc;
  const next = clone(sc);
  const rest = resolveTokens(next, comp, theme, "rest");
  next.components[comp] ??= {} as any;
  (next.components[comp] as any)[theme] ??= {} as any;
  const target = { ...((next.components[comp] as any)[theme][state] ?? {}) };
  for (const p of Array.from(props)) (target as any)[p] = (rest as any)[p];
  (next.components[comp] as any)[theme][state] = target;
  return next;
}

function copyRestPropsToAllStates(
  sc: StylesSchema, theme: ThemeKey, comp: ComponentKey, props: Set<TokenKey>
): StylesSchema {
  const next = clone(sc);
  const rest = resolveTokens(next, comp, theme, "rest");
  next.components[comp] ??= {} as any;
  (next.components[comp] as any)[theme] ??= {} as any;
  for (const st of NON_REST_STATES) {
    const target = { ...((next.components[comp] as any)[theme][st] ?? {}) };
    for (const p of Array.from(props)) (target as any)[p] = (rest as any)[p];
    (next.components[comp] as any)[theme][st] = target;
  }
  return next;
}

/* ========= BoxShadow helpers ========= */
type BoxShadowParts = { inset: boolean; x: number; y: number; blur: number; spread: number; color: string; };
const DEFAULT_BOX: BoxShadowParts = { inset: false, x: 0, y: 2, blur: 6, spread: 0, color: "rgba(0,0,0,0.2)" };

function parseBoxShadow(v?: string): BoxShadowParts {
  if (!v || !v.trim()) return { ...DEFAULT_BOX };
  let s = v.trim();
  const inset = /\binset\b/i.test(s);
  s = s.replace(/\binset\b/gi, "").trim();
  const colorMatch = s.match(
    /(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8})\s*$/i
  );
  let color = DEFAULT_BOX.color;
  if (colorMatch) { color = colorMatch[1]; s = s.slice(0, s.length - colorMatch[1].length).trim(); }
  const parts = s.split(/\s+/).filter(Boolean).map(t => parseFloat(String(t).replace(/px$/i,""))).filter(Number.isFinite);
  const [x = 0, y = 0, blur = 0, spread = 0] = parts;
  return { inset, x, y, blur, spread, color };
}
function stringifyBoxShadow(p: BoxShadowParts): string {
  const nums = `${p.x}px ${p.y}px ${p.blur}px ${p.spread}px`;
  return `${p.inset ? "inset " : ""}${nums} ${p.color}`.trim();
}
/* ========= Schema base ========= */
function makeEmptySchema(): StylesSchema {
  const components: StylesSchema["components"] = {};
  for (const c of BASE_COMPONENTS) {
    components[c] = {
      light: Object.fromEntries(STATES.map(s => [s, s === "rest" ? { ...DEFAULT_TOKENS } : {}])) as Record<StyleState, TokenSet>,
      dark:  Object.fromEntries(STATES.map(s =>
        s === "rest"
          ? [s, { ...DEFAULT_TOKENS, backgroundColor: "#0f1419", textColor: "#F9FAFB" }]
          : [s, {}]
      )) as Record<StyleState, TokenSet>,
    };
  }
  return {
    $version: 1,
    themes: [...BASE_THEMES],
    global: {
      body: {
        light: { ...DEFAULT_TOKENS, backgroundColor: "#ffffff", textColor: "#111827" },
        dark:  { ...DEFAULT_TOKENS, backgroundColor: "#0b1220", textColor: "#e5e7eb" },
      },
      font: { baseFamily: DEFAULT_TOKENS.fontFamily, scale: 1 },
    },
    components,
  };
}

function ensureTheme(schema: StylesSchema, theme: ThemeKey, base: ThemeKey = "light"): StylesSchema {
  const next = clone(schema);
  if (!next.themes.includes(theme)) next.themes.push(theme);
  if (!next.global.body[theme]) next.global.body[theme] = clone(next.global.body[base] ?? DEFAULT_TOKENS);
  for (const c of Object.keys(next.components)) {
    const comp = (next.components[c] ??= {} as any);
    if (!comp[theme]) {
      const baseMap = comp[base];
      comp[theme] = baseMap
        ? clone(baseMap)
        : (Object.fromEntries(STATES.map(s => [s, s === "rest" ? clone(DEFAULT_TOKENS) : {}])) as Record<StyleState, TokenSet>);
    }
  }
  return next;
}

function ensureComponent(sc: StylesSchema, key: string): StylesSchema {
  const safe = toKey(key);
  if (!safe) return sc;
  if (sc.components[safe]) return sc;
  const next = clone(sc);
  (next.components as any)[safe] = {};
  for (const th of next.themes) {
    (next.components as any)[safe][th] = Object.fromEntries(
      STATES.map((s) => [s, s === "rest" ? { ...DEFAULT_TOKENS } : {}])
    ) as Record<StyleState, TokenSet>;
  }
  return next;
}
function duplicateComponent(sc: StylesSchema, fromKey: string, toKeyName: string): StylesSchema {
  const src = toKey(fromKey), dst = toKey(toKeyName);
  if (!src || !dst || src === dst) return sc;
  const srcNode = sc.components[src];
  if (!srcNode) return sc;
  const next = clone(sc);
  next.components[dst] = clone(srcNode);
  return next;
}
function renameComponent(sc: StylesSchema, fromKey: string, toKeyName: string): StylesSchema {
  const src = toKey(fromKey), dst = toKey(toKeyName);
  if (!src || !dst || src === dst) return sc;
  const srcNode = sc.components[src];
  if (!srcNode) return sc;
  const next = clone(sc);
  next.components[dst] = clone(srcNode);
  delete next.components[src];
  return next;
}
function removeComponent(sc: StylesSchema, key: string): StylesSchema {
  const k = toKey(key);
  if (!k) return sc;
  const next = clone(sc);
  delete next.components[k];
  if (Object.keys(next.components).length === 0) return ensureComponent(next, "button");
  return next;
}
function renameTheme(schema: StylesSchema, oldKey: ThemeKey, newKey: ThemeKey): StylesSchema {
  if (oldKey === newKey) return schema;
  if (!schema.themes.includes(oldKey) || schema.themes.includes(newKey)) return schema;
  const next = clone(schema);
  next.themes = next.themes.map((t) => (t === oldKey ? newKey : t));
  next.global.body[newKey] = next.global.body[oldKey];
  delete next.global.body[oldKey];
  for (const c of Object.keys(next.components)) {
    const compMap = next.components[c] as Record<ThemeKey, Record<StyleState, TokenSet>>;
    compMap[newKey] = compMap[oldKey];
    delete compMap[oldKey];
  }
  return next;
}
function removeTheme(schema: StylesSchema, theme: ThemeKey): StylesSchema {
  if (schema.themes.length <= 1) return schema;
  const next = clone(schema);
  next.themes = next.themes.filter((t) => t !== theme);
  delete next.global.body[theme];
  for (const c of Object.keys(next.components)) {
    const compMap = next.components[c] as Record<ThemeKey, Record<StyleState, TokenSet>>;
    delete compMap[theme];
  }
  return next;
}
/* ========= UI Helpers ========= */
const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
);

const Accordion: React.FC<React.PropsWithChildren<{ title: string; defaultOpen?: boolean; actions?: React.ReactNode }>> = ({
  title, defaultOpen = true, actions, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2">
        <BUTTON className="text-left font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2" onClick={() => setOpen(o => !o)}>
          <SPAN className="w-4">{open ? "▾" : "▸"}</SPAN>{title}
        </BUTTON>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {open && <div className="p-3 border-t border-gray-100 dark:border-gray-800">{children}</div>}
    </div>
  );
};

const Field: React.FC<React.PropsWithChildren<{ label: string; hint?: string }>> = ({ label, hint, children }) => (
  <LABEL className="flex flex-col gap-1 text-sm">
    <SPAN className="font-medium text-gray-700 dark:text-gray-200">{label}</SPAN>
    {children}
    {hint && <SPAN className="text-xs text-gray-500 dark:text-gray-400">{hint}</SPAN>}
  </LABEL>
);

const Chip: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <BUTTON
    type="button"
    onClick={onClick}
    className={
      "px-3 py-1.5 rounded-full border text-sm transition " +
      (active ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800")
    }
  >
    {children}
  </BUTTON>
);

const HintBadge: React.FC<{ on: boolean }> = ({ on }) => (
  <SPAN className={"inline-block w-2.5 h-2.5 rounded-full " + (on ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-700")} title={on ? "Override en este estado" : "Hereda"} />
);
const isOverridden = (raw: TokenSet, k: keyof TokenSet) => raw && Object.prototype.hasOwnProperty.call(raw, k);

/* ========= ColorField ========= */
const ColorField: React.FC<{ value?: string; onChange: (v: string) => void; placeholder?: string; }> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<string>(value ?? "");
  const [alpha, setAlpha] = useState<number>(1);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  const normalizeHex = (v: string) => /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6,8})$/.test(v.trim()) ? v.trim().toLowerCase() : v.trim();
  const hexToRgba = (hex: string) => {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    if (h.length === 4) h = h.split("").map(c => c + c).join("");
    if (h.length === 6) h += "ff";
    const n = parseInt(h, 16);
    return { r: (n >> 24) & 255, g: (n >> 16) & 255, b: (n >> 8) & 255, a: (n & 255) / 255 };
  };
  const compose = (base: string, a: number) => {
    if (isTransparent) return "transparent";
    if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6,8})$/.test(base)) {
      const { r, g, b } = hexToRgba(base);
      const aa = Math.round(clamp01(a) * 255);
      return `#${to2(r)}${to2(g)}${to2(b)}${to2(aa)}`.toLowerCase();
    }
    if (/rgba?\(/i.test(base)) {
      const body = base.replace(/rgba?\(/i, "").replace(/\)$/, "");
      const p = body.split(/,\s*/);
      return `rgba(${p[0] ?? "0"}, ${p[1] ?? "0"}, ${p[2] ?? "0"}, ${clamp01(a)})`;
    }
    if (/hsla?\(/i.test(base)) {
      const body = base.replace(/hsla?\(/i, "").replace(/\)$/, "");
      const p = body.split(/,\s*/);
      return `hsla(${p[0] ?? "0"}, ${p[1] ?? "0%"}, ${p[2] ?? "0%"}, ${clamp01(a)})`;
    }
    return a === 1 ? base : base;
  };

  useEffect(() => setTemp(value ?? ""), [value]);
  useEffect(() => {
    const v = (value ?? "").trim();
    if (v.toLowerCase() === "transparent") { setIsTransparent(true); setAlpha(0); }
    else {
      setIsTransparent(false);
      if (/^#/.test(v)) setAlpha(hexToRgba(v).a);
      else if (/rgba?\(|hsla?\(/i.test(v)) {
        const m = v.match(/,\s*([0-9.]+)\s*\)\s*$/);
        setAlpha(m ? clamp01(parseFloat(m[1])) : 1);
      } else setAlpha(1);
    }
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setTemp(value ?? ""); setOpen(false); }
      if (e.key === "Enter" && open) { onChange(compose(normalizeHex(temp || "#ffffff"), alpha)); setOpen(false); }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, temp, alpha, value]);

  useEffect(() => { const closeAll = () => setOpen(false); window.addEventListener("colorfield:closeAll", closeAll); return () => window.removeEventListener("colorfield:closeAll", closeAll); }, []);

  const toggle = () => { if (!open) window.dispatchEvent(new Event("colorfield:closeAll")); setOpen(o => !o); };
  const applyAndClose = () => { onChange(compose(normalizeHex(temp || "#ffffff"), alpha)); setOpen(false); };

  const baseForInputColor = (() => {
    if (isTransparent) return "#ffffff";
    const h = normalizeHex(temp || value || "");
    if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(h)) return `#${h.slice(1, 7)}`;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4})$/.test(h)) {
      const x = h.slice(1).split("").map(c => c + c).join("");
      return `#${x.slice(0, 6)}`;
    }
    return "#ffffff";
  })();

  const raw = (temp ?? value ?? "").trim();
  const isTransparentKeyword = raw.toLowerCase() === "transparent";
  const hexAlpha = (() => {
    if (/^#[0-9a-fA-F]{8}$/.test(raw)) return parseInt(raw.slice(7, 9), 16) / 255;
    if (/^#[0-9a-fA-F]{4}$/.test(raw)) return parseInt(raw.slice(4, 5), 16) / 15;
    return null;
  })();
  const funcAlpha = (() => {
    const m = raw.match(/(rgba?|hsla?)\(([^)]+)\)/i);
    if (!m) return null;
    const parts = m[2].split(/\s*,\s*/);
    const a = parseFloat(parts[parts.length - 1]);
    return Number.isFinite(a) ? a : null;
  })();
  const effectiveAlpha = isTransparentKeyword ? 0 : hexAlpha ?? funcAlpha ?? (isTransparent ? 0 : alpha);
  const showChecker = effectiveAlpha < 1 - 1e-6;
  const fillColor = isTransparentKeyword || isTransparent ? "rgba(0,0,0,0)" : compose(normalizeHex(temp || value || "#ffffff"), effectiveAlpha);

  return (
    <div className="relative" ref={ref}>
      <BUTTON
        type="button"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
        aria-expanded={open}
        className="flex items-center gap-2 w-full rounded-xl border border-gray-300 bg-white text-black px-2 py-2"
      >
        <SPAN
          className="inline-block h-5 w-5 rounded border border-gray-300 overflow-hidden"
          style={showChecker
            ? { backgroundImage: "conic-gradient(#ccc 25%, #eee 0 50%, #ccc 0 75%, #eee 0)", backgroundSize: "8px 8px", boxShadow: `inset 0 0 0 9999px ${fillColor}` }
            : { background: fillColor }}
        />
        <SPAN className="truncate text-left text-gray-800 dark:text-gray-100">
          {isTransparent ? "transparent" : (value || placeholder || "Select color")}
        </SPAN>
        <SPAN className="ml-auto text-xs text-gray-500">{open ? "▲" : "▼"}</SPAN>
      </BUTTON>

      {open && (
        <div className="absolute z-20 mt-2 w-80 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg" onMouseDownCapture={(e) => { e.stopPropagation(); (e as any).nativeEvent?.stopImmediatePropagation?.(); }} onClickCapture={(e) => { e.stopPropagation(); (e as any).nativeEvent?.stopImmediatePropagation?.(); }}>
          <div className="flex items-center justify-between mb-2">
            <SPAN className="text-xs font-medium text-gray-500 dark:text-gray-400">Selecciona un color</SPAN>
            <BUTTON type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setTemp(value ?? ""); setOpen(false); }} aria-label="Cerrar selector" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">✕</BUTTON>
          </div>
          <LABEL className="flex items-center gap-2 mb-2 text-xs text-gray-600 dark:text-gray-300">
            <INPUT type="checkbox" checked={isTransparent} onChange={(e) => {
              const checked = e.target.checked; setIsTransparent(checked);
              if (checked) { setAlpha(0); onChange("transparent"); }
              else { onChange(compose(normalizeHex(temp || "#ffffff"), alpha || 1)); }
            }} />
            usar <code>transparent</code>
          </LABEL>
          <div className="mb-2">
            <INPUT type="color" className="w-full h-10 rounded disabled:opacity-50" disabled={isTransparent} value={baseForInputColor}
              onChange={(e) => { setTemp(e.target.value); onChange(compose(e.target.value, alpha)); }} />
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <SPAN>Transparencia (alpha)</SPAN><SPAN>{Math.round(alpha * 100)}%</SPAN>
            </div>
            <INPUT type="range" min={0} max={100} value={Math.round(alpha * 100)} disabled={isTransparent}
              onChange={(e) => { const a = clamp01(Number(e.target.value) / 100); setAlpha(a); onChange(compose(normalizeHex(temp || "#ffffff"), a)); }} className="w-full" />
          </div>
          <div>
            <INPUT type="text" className="w-full rounded-lg border border-gray-300 bg-white text-black px-2 py-2 font-mono text-xs"
              placeholder={placeholder || "#111827 | rgba(...) | hsla(...) | transparent"}
              value={isTransparent ? "transparent" : temp} disabled={isTransparent} onChange={(e) => setTemp(e.target.value)}
              onBlur={() => onChange(compose(normalizeHex(temp || "#ffffff"), alpha))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onChange(compose(normalizeHex(temp || "#ffffff"), alpha)); setOpen(false); } }} />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <BUTTON type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setTemp(value ?? ""); setOpen(false); }} className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700">Cerrar</BUTTON>
            <BUTTON type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); applyAndClose(); }} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Aplicar</BUTTON>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========= BoxShadowField ========= */
const BoxShadowField: React.FC<{ value?: string; onChange: (v: string) => void; }> = ({ value, onChange }) => {
  const [parts, setParts] = useState<BoxShadowParts>(() => parseBoxShadow(value));
  useEffect(() => setParts(parseBoxShadow(value)), [value]);
  const update = <K extends keyof BoxShadowParts>(k: K, v: BoxShadowParts[K]) => { const next = { ...parts, [k]: v }; setParts(next); onChange(stringifyBoxShadow(next)); };
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
      <LABEL className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 md:col-span-1 col-span-2">
        <INPUT type="checkbox" checked={parts.inset} onChange={(e) => update("inset", e.target.checked)} /> inset
      </LABEL>
      <div className="md:col-span-1 col-span-1"><div className="text-xs text-gray-500 mb-1">X</div><INPUT type="number" className="w-full rounded-lg border px-2 py-1.5 bg-white text-black" value={parts.x} onChange={(e) => update("x", Number((e.target as HTMLInputElement).value))} /></div>
      <div className="md:col-span-1 col-span-1"><div className="text-xs text-gray-500 mb-1">Y</div><INPUT type="number" className="w-full rounded-lg border px-2 py-1.5 bg-white text-black" value={parts.y} onChange={(e) => update("y", Number((e.target as HTMLInputElement).value))} /></div>
      <div className="md:col-span-1 col-span-1"><div className="text-xs text-gray-500 mb-1">Blur</div><INPUT type="number" min={0} className="w-full rounded-lg border px-2 py-1.5 bg-white text-black" value={parts.blur} onChange={(e) => update("blur", Number((e.target as HTMLInputElement).value))} /></div>
      <div className="md:col-span-1 col-span-1"><div className="text-xs text-gray-500 mb-1">Spread</div><INPUT type="number" className="w-full rounded-lg border px-2 py-1.5 bg-white text-black" value={parts.spread} onChange={(e) => update("spread", Number((e.target as HTMLInputElement).value))} /></div>
      <div className="md:col-span-1 col-span-2"><div className="text-xs text-gray-500 mb-1">Color</div><ColorField value={parts.color} onChange={(c) => update("color", c)} /></div>
    </div>
  );
};

/* ========= Preview helpers ========= */
/** Reemplaza todo a partir de aquí por las Partes 1→4 de este mensaje. */

/* === Inputs compactos y robustos === */

type TinyBaseProps = { w?: number; className?: string; style?: React.CSSProperties };
/* === Estilos base para inputs SIEMPRE legibles (bg blanco, texto negro) === */
const baseInputClass =
  "h-7 rounded-md border border-gray-300 dark:border-gray-700 bg-white text-black px-2 text-xs " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-gray-400 selection:bg-indigo-100 selection:text-black";

/* === Chip toggle reutilizable (evita selección de texto) === */
const ChipToggle: React.FC<{ label: string; active: boolean; onToggle: () => void; title?: string }> = ({
  label, active, onToggle, title
}) => (
  <BUTTON
    type="button"
    title={title}
    className={
      "px-2 py-1 rounded-md border text-xs select-none whitespace-nowrap " +
      (active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-black")
    }
    onClick={onToggle}
  >
    {label}
  </BUTTON>
);

/** input color que NO se cierra de inmediato (paramos propagación) */
const TinyColor: React.FC<{ value?: string; onChange: (v: string) => void; title?: string }> = ({ value, onChange, title }) => {
  const to6 = (v?: string) => {
    const x = (v ?? "#ffffff").toLowerCase();
    if (/^#[0-9a-f]{8}$/.test(x)) return "#" + x.slice(1, 7);
    if (/^#[0-9a-f]{6}$/.test(x)) return x;
    if (/^#[0-9a-f]{3,4}$/.test(x)) { const y = x.slice(1).split("").map(c=>c+c).join(""); return "#" + y.slice(0,6); }
    return "#ffffff";
  };
  return (
    <INPUT
      type="color"
      title={title}
      className="h-7 w-7 rounded border border-gray-300 dark:border-gray-700 p-0 bg-white"
      value={to6(value)}
      onClick={(e)=>e.stopPropagation()}
      onMouseDown={(e)=>e.stopPropagation()}
      onChange={(e)=>onChange((e.target as HTMLInputElement).value)}
    />
  );
};

/** numérico con buffer (permite escribir 15 sin perder foco; confirma en blur/Enter) */
const TinyNumberCommit: React.FC<{
  value?: number; min?: number; max?: number; step?: number; onCommit: (n: number) => void;
  placeholder?: string; w?: number; className?: string; style?: React.CSSProperties;
}> = ({ value, min, max, step, onCommit, placeholder, w = 64, className, style }) => {
  const [txt, setTxt] = React.useState<string>(value === undefined ? "" : String(value));
  const [focused, setFocused] = React.useState(false);
  React.useEffect(() => { if (!focused) setTxt(value === undefined ? "" : String(value)); }, [value, focused]);
  const clamp = (n: number) => {
    let x = n; if (min !== undefined) x = Math.max(min, x); if (max !== undefined) x = Math.min(max, x); return x;
  };
  const commit = () => {
    const n = Number(txt);
    onCommit(Number.isFinite(n) ? clamp(n) : (value ?? 0));
    setFocused(false);
  };
  return (
    <INPUT
      type="text"
      inputMode="decimal"
      pattern="[0-9.\\-]*"
      className={`${baseInputClass} ${className ?? ""}`}
      style={{ width: w, ...style }}
      value={txt}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onChange={(e) => setTxt((e.target as HTMLInputElement).value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); (e.target as HTMLInputElement).blur(); } }}
    />
  );
};

const TinyText: React.FC<{ value?: string; onCommit: (v: string) => void; placeholder?: string; w?: number; className?: string; style?: React.CSSProperties; }> = ({
  value, onCommit, placeholder, w = 120, className, style
}) => {
  const [txt, setTxt] = React.useState<string>(value ?? "");
  const [focused, setFocused] = React.useState(false);
  React.useEffect(() => { if (!focused) setTxt(value ?? ""); }, [value, focused]);
  const commit = () => { onCommit(txt); setFocused(false); };
  return (
    <INPUT
      type="text"
      className={`${baseInputClass} ${className ?? ""}`}
      style={{ width: w, ...style }}
      value={txt}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onChange={(e) => setTxt((e.target as HTMLInputElement).value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); (e.target as HTMLInputElement).blur(); } }}
    />
  );
};

/* === Definiciones de propiedades === */

type PropEditorType = "color" | "number" | "text" | "shadow";
type PropDef = {
  key: keyof TokenSet;
  abbr: string;
  label: string;
  type: PropEditorType;
  min?: number; max?: number; step?: number;
  width?: number;
};

const CONTROL_PROPS: PropDef[] = [
  { key: "backgroundColor", abbr: "BG",   label: "backgroundColor", type: "color",  width: 32 },
  { key: "textColor",       abbr: "FG",   label: "textColor",       type: "color",  width: 32 },
  { key: "borderColor",     abbr: "BCol", label: "borderColor",     type: "color",  width: 32 },

  { key: "borderWidth",   abbr: "BWi", label: "borderWidth",   type: "number", min: 0, max: 12, step: 1, width: 56 },
  { key: "borderRadius",  abbr: "BRa", label: "borderRadius",  type: "number", min: 0, max: 40, step: 1, width: 56 },

  { key: "paddingX", abbr: "PX", label: "paddingX", type: "number", min: 0, max: 40, step: 1, width: 56 },
  { key: "paddingY", abbr: "PY", label: "paddingY", type: "number", min: 0, max: 40, step: 1, width: 56 },
  { key: "marginX",  abbr: "MX", label: "marginX",  type: "number", min: 0, max: 64, step: 1, width: 56 },
  { key: "marginY",  abbr: "MY", label: "marginY",  type: "number", min: 0, max: 64, step: 1, width: 56 },

  { key: "fontSize",      abbr: "FSz", label: "fontSize",      type: "number", min: 10, max: 64, step: 1, width: 56 },
  { key: "fontWeight",    abbr: "FWt", label: "fontWeight",    type: "number", min: 100, max: 900, step: 50, width: 64 },
  { key: "letterSpacing", abbr: "LSp", label: "letterSpacing (em)", type: "number", min: -0.1, max: 0.3, step: 0.005, width: 64 },
  { key: "lineHeight",    abbr: "LH",  label: "lineHeight",    type: "number", min: 1, max: 2.2, step: 0.05, width: 56 },

  { key: "boxShadow",     abbr: "BSh", label: "boxShadow",     type: "shadow", width: 210 },
];

/* === Globales compactos (2 filas) === */
type GlobalDef = { key: keyof TokenSet; abbr: string; label: string; type: "color" | "number"; min?: number; max?: number; step?: number; width?: number; };

const GLOBAL_PROPS_ROW1: GlobalDef[] = [
  { key: "backgroundColor", abbr: "BG",  label: "Global backgroundColor", type: "color" },
  { key: "textColor",       abbr: "FG",  label: "Global textColor",       type: "color" },
  { key: "borderRadius",    abbr: "BRa", label: "Global borderRadius",    type: "number", min: 0, max: 40, step: 1, width: 56 },
  { key: "borderWidth",     abbr: "BWi", label: "Global borderWidth",     type: "number", min: 0, max: 8,  step: 1, width: 56 },
  { key: "marginX",         abbr: "MX",  label: "Global marginX",         type: "number", min: 0, max: 64, step: 1, width: 56 },
  { key: "marginY",         abbr: "MY",  label: "Global marginY",         type: "number", min: 0, max: 64, step: 1, width: 56 },
];

const GLOBAL_PROPS_ROW2: GlobalDef[] = [
  { key: "paddingX",   abbr: "PX",  label: "Global paddingX",   type: "number", min: 0, max: 40, step: 1, width: 56 },
  { key: "paddingY",   abbr: "PY",  label: "Global paddingY",   type: "number", min: 0, max: 40, step: 1, width: 56 },
  { key: "fontSize",   abbr: "FSz", label: "Global fontSize",   type: "number", min: 10, max: 64, step: 1, width: 56 },
  { key: "lineHeight", abbr: "LH",  label: "Global lineHeight", type: "number", min: 1,  max: 2.2, step: 0.05, width: 56 },
];

/* === Cabecera de columna compacta === */
const PropHeaderCell: React.FC<{ abbr: string; title: string }> = ({ abbr, title }) => (
  <div className="px-1 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-600 text-center" title={title}>
    {abbr}
  </div>
);

/* === Botonera de estados (solo en topbar, sin duplicados) === */
const StateButtons: React.FC<{ current: StyleState; onPick: (s: StyleState) => void }> = ({ current, onPick }) => (
  <div className="flex flex-wrap gap-1.5 select-none">
    {STATES.map((s) => (
      <ChipToggle key={s} label={s} active={current === s} onToggle={() => onPick(s)} title={`Cambiar a ${s}`} />
    ))}
  </div>
);

/* === Alias → key real (por si el alias no coincide con el key) === */
const themeKeyFromAlias = (alias: ThemeKey | undefined, fallback: ThemeKey): ThemeKey => (alias || fallback);

/* === Mini editor de box-shadow (inset, x,y,blur,spread,color) con commit on blur === */
const MiniBoxShadowEditor: React.FC<{ value?: string; onCommit: (v: string) => void }> = ({ value, onCommit }) => {
  const [parts, setParts] = React.useState<BoxShadowParts>(() => parseBoxShadow(value));
  React.useEffect(() => setParts(parseBoxShadow(value)), [value]);

  const upd = <K extends keyof BoxShadowParts>(k: K, v: BoxShadowParts[K]) => {
    const nx = { ...parts, [k]: v };
    setParts(nx);
    onCommit(stringifyBoxShadow(nx));
  };

  return (
    <div className="flex items-center gap-1">
      <LABEL title="inset" className="text-[10px] text-gray-600 flex items-center gap-1">
        <INPUT type="checkbox" checked={parts.inset} onChange={(e)=>upd("inset", e.target.checked)} />
        ins
      </LABEL>
      <TinyNumberCommit w={48} value={parts.x}     onCommit={(n)=>upd("x", n)}     placeholder="x" />
      <TinyNumberCommit w={48} value={parts.y}     onCommit={(n)=>upd("y", n)}     placeholder="y" />
      <TinyNumberCommit w={48} value={parts.blur}  onCommit={(n)=>upd("blur", n)}  placeholder="blur" />
      <TinyNumberCommit w={48} value={parts.spread}onCommit={(n)=>upd("spread", n)}placeholder="spr" />
      <TinyColor value={parts.color} onChange={(c)=>upd("color", c)} title="shadow color" />
    </div>
  );
};
/* === Acordeón: Preview sticky Light/Dark por alias (sin botones de estado dentro) === */

const StickyDualPreviewAccordion: React.FC<{
  schema: StylesSchema;
  aliasLight: ThemeKey; aliasDark: ThemeKey;
  component: ComponentKey;
  currentState: StyleState;                     // estado global (arriba, junto al select)
  onHoverToggle: (theme: ThemeKey, on: boolean) => void;
  hoverByTheme: Record<ThemeKey, boolean>;
  updateGlobal: (theme: ThemeKey, patch: Partial<TokenSet>) => void;
}> = ({ schema, aliasLight, aliasDark, component, currentState, onHoverToggle, hoverByTheme, updateGlobal }) => {

  const renderSide = (themeKey: ThemeKey, themeLabel: "light" | "dark") => {
    const effState: StyleState = hoverByTheme[themeKey] ? "hover" : currentState;
    const tok = resolveTokens(schema, component, themeKey, effState);
    const global = schema.global.body[themeKey] ?? {};

    const previewStyle: React.CSSProperties = {
      backgroundColor: tok.backgroundColor, color: tok.textColor,
      borderColor: tok.borderColor, borderWidth: (tok.borderWidth ?? 0) + "px",
      borderStyle: "solid", borderRadius: (tok.borderRadius ?? 0) + "px",
      boxShadow: tok.boxShadow, padding: `${tok.paddingY ?? 0}px ${tok.paddingX ?? 0}px`,
      fontFamily: tok.fontFamily, fontSize: (tok.fontSize ?? 16) + "px", fontWeight: tok.fontWeight as any,
      letterSpacing: (tok.letterSpacing ?? 0) + "em", lineHeight: String(tok.lineHeight ?? 1.2),
      transition: `all ${TRANSITION_SPEEDS[tok.transitionSpeed ?? "normal"]} ease`,
      opacity: currentState === "disabled" ? 0.6 : 1, cursor: currentState === "disabled" ? "not-allowed" : undefined,
    };

    const commonHover = { onMouseEnter: () => onHoverToggle(themeKey, true), onMouseLeave: () => onHoverToggle(themeKey, false) };
    const label = `${component} (${themeLabel}/${currentState})`;

    const Control = (() => {
      if (component === "button" || (!BASE_COMPONENTS.includes(component) && component !== "image" && component !== "a" && component !== "p")) {
        return <BUTTON style={previewStyle} disabled={currentState === "disabled"} {...commonHover}>{label}</BUTTON>;
      }
      if (component === "input")   return <INPUT  style={previewStyle as any} placeholder={label} disabled={currentState === "disabled"} {...commonHover} />;
      if (component === "select")  return <SELECT style={previewStyle as any} disabled={currentState === "disabled"} {...commonHover}><option>{label}</option></SELECT>;
      if (component === "label")   return <LABEL style={previewStyle as any}>{label}</LABEL>;
      if (component === "h1") return <H1 style={previewStyle as any}>{label}</H1>;
      if (component === "h2") return <H2 style={previewStyle as any}>{label}</H2>;
      if (component === "h3") return <H3 style={previewStyle as any}>{label}</H3>;
      if (component === "h4") return <H4 style={previewStyle as any}>{label}</H4>;
      if (component === "h5") return <H5 style={previewStyle as any}>{label}</H5>;
      if (component === "h6") return <H6 style={previewStyle as any}>{label}</H6>;
      if (component === "a")  return <a href="#" onClick={(e)=>e.preventDefault()} style={previewStyle as any} {...commonHover}>{label}</a>;
      if (component === "p")  return <P style={previewStyle as any}>{label}</P>;
      if (component === "image") return <img style={previewStyle as any} src="https://picsum.photos/seed/pwa-sticky/280/150" alt="preview" />;
      if (component === "nextimage") {
        return (
          <SPAN style={previewStyle as any}>
            <Image src="https://picsum.photos/seed/pwa-sticky-next/280/150" alt="preview" width={280} height={150} unoptimized style={{ display: "block", borderRadius: "inherit" }} />
          </SPAN>
        );
      }
      return <BUTTON style={previewStyle} disabled={currentState === "disabled"} {...commonHover}>{label}</BUTTON>;
    })();

    const GlobalCell: React.FC<{ def: GlobalDef }> = ({ def }) => {
      const v = (schema.global.body[themeKey] ?? {})[def.key] as any;
      if (def.type === "color") {
        return (
          <div className="flex items-center gap-1">
            <SPAN className="text-[10px] text-black dark:text-white" title={def.label}>{def.abbr}</SPAN>
            <TinyColor value={v} onChange={(nv) => updateGlobal(themeKey, { [def.key]: nv } as any)} title={def.label} />
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1">
          <SPAN className="text-[10px] text-black dark:text-white" title={def.label}>{def.abbr}</SPAN>
          <TinyNumberCommit w={def.width ?? 56} value={Number(v ?? 0)} min={def.min} max={def.max} step={def.step}
            onCommit={(n)=>updateGlobal(themeKey, { [def.key]: n } as any)}
          />
        </div>
      );
    };

    return (
      <div className="p-3">
        <div
          className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-6"
          style={{
            backgroundColor: global.backgroundColor, color: global.textColor,
            borderColor: global.borderColor, borderWidth: (global.borderWidth ?? 0) + "px", borderStyle: "solid",
            borderRadius: (global.borderRadius ?? 0) + "px", fontFamily: global.fontFamily,
            fontSize: (global.fontSize ?? 16) + "px", lineHeight: String(global.lineHeight ?? 1.3),
            padding: `${global.paddingY ?? 0}px ${global.paddingX ?? 0}px`,
            margin: `${global.marginY ?? 0}px ${global.marginX ?? 0}px`,
            transition: `all ${TRANSITION_SPEEDS[global.transitionSpeed ?? "normal"]} ease`,
          }}
        >
          <div className="text-center text-xs mb-2 opacity-70">{themeLabel} (alias: <code>{themeKey}</code>)</div>
          <div className="flex items-center justify-center py-4">{Control}</div>

          {/* Globales compactos en 2 filas */}
          <div className="mt-2 space-y-2 bg-white dark:bg-black rounded-md p-2">
            <div className="flex flex-wrap gap-2 items-center">{GLOBAL_PROPS_ROW1.map((d) => <GlobalCell key={d.key as string} def={d} />)}</div>
            <div className="flex flex-wrap gap-2 items-center">{GLOBAL_PROPS_ROW2.map((d) => <GlobalCell key={d.key as string} def={d} />)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Accordion title="Preview (sticky) — Light/Dark por alias" defaultOpen>
      <div className="sticky top-16 z-20 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-800">
          {renderSide(themeKeyFromAlias(aliasLight, "light"), "light")}
          {renderSide(themeKeyFromAlias(aliasDark,  "dark"),  "dark")}
        </div>
      </div>
    </Accordion>
  );
};
/* === Acordeón: Tabla de ajustes compacta (sin columna "Valores") === */

const PropertyHeader: React.FC = () => (
  <div
    className="grid sticky top-0 z-10 bg-gray-50/70 dark:bg-gray-900/50"
    style={{ gridTemplateColumns: `repeat(${CONTROL_PROPS.length}, minmax(72px, 1fr))` }}
  >
    {CONTROL_PROPS.map((p) => <PropHeaderCell key={String(p.key)} abbr={p.abbr} title={p.label} />)}
  </div>
);

const PropertyValueRow: React.FC<{
  schema: StylesSchema; themeKey: ThemeKey; component: ComponentKey; state: StyleState;
  onUpdate: (patch: Partial<TokenSet>) => void;
}> = ({ schema, themeKey, component, state, onUpdate }) => {
  const resolved = resolveTokens(schema, component, themeKey, state);
  const raw = (schema.components[component]?.[themeKey]?.[state] ?? {}) as TokenSet;

  const cell = (p: PropDef) => {
    const val = (raw[p.key] ?? resolved[p.key]) as any;
    if (p.type === "color") {
      return <TinyColor value={val as string} onChange={(nv)=>onUpdate({ [p.key]: nv } as any)} title={p.label} />;
    }
    if (p.type === "number") {
      return (
        <TinyNumberCommit
          w={p.width ?? 56}
          value={Number(val ?? 0)}
          min={p.min} max={p.max} step={p.step}
          onCommit={(n)=>onUpdate({ [p.key]: n } as any)}
        />
      );
    }
    if (p.type === "text") {
      return <TinyText w={p.width ?? 140} value={String(val ?? "")} onCommit={(v)=>onUpdate({ [p.key]: v } as any)} />;
    }
    if (p.type === "shadow") {
      return <MiniBoxShadowEditor value={String(val ?? "")} onCommit={(v)=>onUpdate({ [p.key]: v } as any)} />;
    }
    return null;
  };

  return (
    <div
      className="grid border-b border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40"
      style={{ gridTemplateColumns: `repeat(${CONTROL_PROPS.length}, minmax(72px, 1fr))` }}
    >
      {CONTROL_PROPS.map((p) => (
        <div key={String(p.key)} className="px-1 py-1.5 flex items-center justify-center">{cell(p)}</div>
      ))}
    </div>
  );
};

const PropertyInheritRow: React.FC<{
  schema: StylesSchema; themeKey: ThemeKey; component: ComponentKey; state: StyleState;
  onUnset: (key: keyof TokenSet) => void;
}> = ({ schema, themeKey, component, state, onUnset }) => {
  const raw = (schema.components[component]?.[themeKey]?.[state] ?? {}) as TokenSet;
  return (
    <div
      className="grid border-b border-gray-100 dark:border-gray-800"
      style={{ gridTemplateColumns: `repeat(${CONTROL_PROPS.length}, minmax(72px, 1fr))` }}
    >
      {CONTROL_PROPS.map((p) => {
        const overridden = isOverridden(raw, p.key);
        return (
          <div key={String(p.key)} className="px-1 py-1 flex items-center justify-center">
            {overridden ? (
              <BUTTON
                type="button"
                className="px-2 py-0.5 rounded border text-[10px] bg-white text-black"
                title="Limpiar override (heredar)"
                onClick={()=>onUnset(p.key)}
              >
                ↺
              </BUTTON>
            ) : (
              <SPAN className="text-[10px] text-gray-400">✓</SPAN>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DynamicPropertyTableAccordion: React.FC<{
  schema: StylesSchema;
  aliasLight: ThemeKey; aliasDark: ThemeKey;
  component: ComponentKey;
  currentState: StyleState;
  updateTokens: (theme: ThemeKey, comp: ComponentKey, state: StyleState, patch: Partial<TokenSet>) => void;
  unsetTokenFn: (theme: ThemeKey, comp: ComponentKey, state: StyleState, key: keyof TokenSet) => void;
}> = ({ schema, aliasLight, aliasDark, component, currentState, updateTokens, unsetTokenFn }) => {
  const thLight = themeKeyFromAlias(aliasLight, "light");
  const thDark  = themeKeyFromAlias(aliasDark, "dark");

  return (
    <Accordion title="Tabla de ajustes (sticky, compacta)" defaultOpen>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-auto max-h-[60vh]">
        <PropertyHeader />
        {/* Light */}
        <div className="bg-white/40 dark:bg-gray-900/30">
          <div className="px-2 py-1 text-[11px] font-medium text-gray-600">Light (alias: <code>{thLight}</code>) — estado: <strong>{currentState}</strong></div>
          <PropertyValueRow
            schema={schema}
            themeKey={thLight}
            component={component}
            state={currentState}
            onUpdate={(patch)=>updateTokens(thLight, component, currentState, patch)}
          />
          <div className="px-2 pt-1 text-[10px] text-gray-500">Hereda</div>
          <PropertyInheritRow
            schema={schema}
            themeKey={thLight}
            component={component}
            state={currentState}
            onUnset={(key)=>unsetTokenFn(thLight, component, currentState, key)}
          />
        </div>
        {/* Dark */}
        <div className="bg-white/40 dark:bg-gray-900/30">
          <div className="px-2 py-1 text-[11px] font-medium text-gray-600">Dark (alias: <code>{thDark}</code>) — estado: <strong>{currentState}</strong></div>
          <PropertyValueRow
            schema={schema}
            themeKey={thDark}
            component={component}
            state={currentState}
            onUpdate={(patch)=>updateTokens(thDark, component, currentState, patch)}
          />
          <div className="px-2 pt-1 text-[10px] text-gray-500">Hereda</div>
          <PropertyInheritRow
            schema={schema}
            themeKey={thDark}
            component={component}
            state={currentState}
            onUnset={(key)=>unsetTokenFn(thDark, component, currentState, key)}
          />
        </div>
      </div>
    </Accordion>
  );
};
/* === Componente principal: StyleDesigner (acordeones pedidos + correcciones) === */

export default function StyleDesigner({
  initialStyles,
  loadStyles,
  saveStyles,
  aliasInitial,
  initialSlot,
  onSaveAliases,
  onSaveInitialSlot,
  className,
}: {
  initialStyles?: Partial<StylesSchema>;
  loadStyles?: () => Promise<StylesSchema | null>;
  saveStyles?: (schema: StylesSchema) => Promise<void>;
  aliasInitial?: { light: string; dark: string };
  initialSlot?: "light" | "dark";
  onSaveAliases?: (a: { light: string; dark: string }) => Promise<void>;
  onSaveInitialSlot?: (s: "light" | "dark") => Promise<void>;
  className?: string;
}) {
  /* schema base */
  const [schema, setSchema] = React.useState<StylesSchema>(() => {
    const base = makeEmptySchema();
    let merged = deepMerge(base, (initialStyles as any) ?? {});
    for (const t of merged.themes) merged = ensureTheme(merged, t, "light");
    for (const c of BASE_COMPONENTS) merged = ensureComponent(merged, c);
    return merged;
  });

  React.useEffect(() => {
    if (!loadStyles) return;
    let alive = true;
    (async () => {
      const remote = await loadStyles();
      if (!alive || !remote) return;
      let merged = deepMerge(makeEmptySchema(), remote);
      for (const t of merged.themes) merged = ensureTheme(merged, t, "light");
      for (const c of BASE_COMPONENTS) merged = ensureComponent(merged, c);
      setSchema(merged);
    })();
    return () => { alive = false; };
  }, [loadStyles]);

  /* aliases + initial */
  const [aliasLight, setAliasLight] = React.useState(aliasInitial?.light ?? "light");
  const [aliasDark,  setAliasDark]  = React.useState(aliasInitial?.dark  ?? "dark");
  const [initial, setInitial]       = React.useState<"light" | "dark">(initialSlot ?? "light");

  React.useEffect(() => {
    if (schema.themes.length === 1) {
      const only = schema.themes[0];
      if (aliasLight !== only) setAliasLight(only);
      if (aliasDark  !== only) setAliasDark(only);
    }
  }, [schema.themes, aliasLight, aliasDark]);

  async function saveMeta() {
    if (onSaveAliases) await onSaveAliases({ light: aliasLight, dark: aliasDark });
    if (onSaveInitialSlot) await onSaveInitialSlot(initial);
    if (!onSaveAliases || !onSaveInitialSlot) {
      await saveSettingsClient({ website: { theme: { aliases: { light: aliasLight, dark: aliasDark }, initialSlot: initial } } } as any);
    }
    alert("Configuración de alias e initial slot guardada");
  }

  /* helpers edición */
  function updateGlobal(theme: ThemeKey, patch: Partial<TokenSet>) {
    setSchema((prev) => { const next = clone(prev); next.global.body[theme] = { ...(next.global.body[theme] ?? {}), ...patch }; return next; });
  }
  function updateTokens(theme: ThemeKey, comp: ComponentKey, state: StyleState, patch: Partial<TokenSet>) {
    setSchema((prev) => {
      const next = clone(prev);
      next.components[comp] ??= {} as any;
      (next.components[comp] as any)[theme] ??= {} as any;
      (next.components[comp] as any)[theme][state] = { ...((next.components[comp] as any)[theme][state] ?? {}), ...patch };
      return next;
    });
  }
  const unsetTokenFn = (theme: ThemeKey, comp: ComponentKey, state: StyleState, key: keyof TokenSet) =>
    setSchema(prev => unsetToken(prev, theme, comp, state, key));

  /* selección de control + estado global */
  const allComponents = React.useMemo(
    () => Array.from(new Set<ComponentKey>([...BASE_COMPONENTS, ...Object.keys(schema.components)])),
    [schema.components]
  );
  const [component, setComponent] = React.useState<ComponentKey>(allComponents[0] ?? "button");
  React.useEffect(() => { if (!allComponents.includes(component)) setComponent(allComponents[0] ?? "button"); }, [allComponents]);

  const [currentState, setCurrentState] = React.useState<StyleState>("rest");
  const [hoverByTheme, setHoverByTheme] = React.useState<Record<ThemeKey, boolean>>({});

  /* === CSS Vars Panel helper (filtros por tema/control/estado/propiedad) === */
  const CSSVarsPanel: React.FC<{
    schema: StylesSchema;
    aliasLight: ThemeKey; aliasDark: ThemeKey;
    initial: "light"|"dark";
  }> = ({ schema, aliasLight, aliasDark, initial }) => {
    const comps = React.useMemo(()=>Object.keys(schema.components || {}), [schema.components]);

    const compProps = React.useMemo(()=>[
      "backgroundColor","textColor","borderColor","borderWidth","borderRadius",
      "boxShadow","paddingX","paddingY","fontFamily","fontSize","fontWeight",
      "letterSpacing","lineHeight","outlineColor","outlineWidth",
      "marginX","marginY","opacity","cursor","transitionSpeed"
    ] as const, []);

    const bodyProps = React.useMemo(()=>[
      "backgroundColor","textColor","borderColor","borderWidth","borderRadius",
      "fontFamily","fontSize","fontWeight","letterSpacing","lineHeight",
      "paddingX","paddingY","marginX","marginY","transitionSpeed"
    ] as const, []);

    type CompProp = typeof compProps[number];
    const [filterTheme, setFilterTheme] = React.useState<"both"|"light"|"dark">("both");
    const [filterComp, setFilterComp]   = React.useState<string>("*");
    const [filterState, setFilterState] = React.useState<StyleState | "*">("*");
    const [filterProp, setFilterProp]   = React.useState<CompProp | "*">("*");
    const [search, setSearch]           = React.useState("");

    const themesToShow = React.useMemo(() => {
      if (filterTheme === "both") return ([
        ["light", aliasLight] as const,
        ["dark",  aliasDark ] as const
      ]).filter(([, name]) => !!name);
      if (filterTheme === "light") return [["light", aliasLight] as const].filter(([, name]) => !!name);
      return [["dark", aliasDark] as const].filter(([, name]) => !!name);
    }, [filterTheme, aliasLight, aliasDark]);

    const filteredComps  = React.useMemo(()=> (filterComp==="*" ? comps : comps.filter(c => c===filterComp)), [filterComp, comps]);
    const filteredStates = React.useMemo(()=> (filterState==="*" ? STATES : STATES.filter(s => s===filterState)), [filterState]);

    const makeList = React.useCallback(() => {
      const out: string[] = [];

      // Component vars (respetan todos los filtros)
      for (const [slotLabel] of themesToShow) {
        for (const c of filteredComps) {
          const props = filterProp === "*" ? compProps : [filterProp];
          for (const p of props) {
            for (const st of filteredStates) {
              const v = `--${c}-${p}-${slotLabel}-${st}`;
              if (!search || v.toLowerCase().includes(search.toLowerCase())) out.push(v);
            }
          }
        }
      }

      // Body vars (globales) — solo cuando:
      // - NO se filtró un control específico (filterComp === "*")
      // - NO se filtró un estado específico (body no tiene estado)
      // - Y la propiedad está en bodyProps (o no se filtró propiedad)
      const canIncludeBody =
        filterComp === "*" &&
        (filterState === "*" || !filterState) &&
        (filterProp === "*" || (bodyProps as readonly string[]).includes(filterProp as string));

      if (canIncludeBody) {
        for (const [slotLabel] of themesToShow) {
          const bodyPropsFiltered =
            filterProp === "*"
              ? bodyProps
              : ((bodyProps as readonly string[]).includes(filterProp as string) ? [filterProp as any] : []);
          for (const p of bodyPropsFiltered) {
            const v = `--body-${p}-${slotLabel}`;
            if (!search || v.toLowerCase().includes(search.toLowerCase())) out.push(v);
          }
        }
      }

      return out;
    }, [themesToShow, filteredComps, filterProp, filteredStates, compProps, bodyProps, search, filterComp, filterState]);


    const list = makeList();

    // JSON idéntico a tu lógica actual
    const jsonText = React.useMemo(() => JSON.stringify((() => {
      const light = aliasLight;
      const dark  = aliasDark;
      return {
        aliases: { light, dark },
        initialSlot: initial,
        themes: Array.from(new Set([light, dark].filter(Boolean))),
        components: Object.fromEntries(Object.entries(schema.components || {}).map(([ck, v]: any) => {
          const out: any = {};
          if (v[light]) out[ck] = { ...(out[ck]||{}), [light]: v[light] };
          if (v[dark])  out[ck] = { ...(out[ck]||{}), [dark]:  v[dark]  };
          return [ck, out[ck] || {}];
        })),
        global: {
          body: {
            ...(schema.global?.body?.[light] ? { [light]: schema.global.body[light] } : {}),
            ...(schema.global?.body?.[dark]  ? { [dark]:  schema.global.body[dark]  } : {}),
          },
          font: schema.global?.font
        },
        $version: schema.$version
      };
    })(), null, 2), [schema, aliasLight, aliasDark, initial]);

    return (
      <Accordion title="JSON y Variables CSS (con filtros)" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4">
          {/* JSON (misma construcción) */}
          <div>
            <textarea
              readOnly
              className="w-full h-64 font-mono text-xs rounded-lg border p-3 bg-white text-black"
              value={jsonText}
            />
          </div>

          {/* Filtros */}
          <div className="rounded-lg border p-2 bg-white text-black">
            <div className="flex flex-wrap items-center gap-2">
              <LABEL className="text-xs text-gray-600">Tema</LABEL>
              <SELECT className="rounded border px-2 py-1 bg-white text-black"
                value={filterTheme}
                onChange={(e)=>setFilterTheme((e.target as HTMLSelectElement).value as any)}
              >
                <option value="both">both (light+dark)</option>
                <option value="light">light</option>
                <option value="dark">dark</option>
              </SELECT>

              <LABEL className="text-xs text-gray-600 ml-2">Control</LABEL>
              <SELECT className="rounded border px-2 py-1 bg-white text-black"
                value={filterComp}
                onChange={(e)=>setFilterComp((e.target as HTMLSelectElement).value)}
              >
                <option value="*">Todos</option>
                {comps.map(c => <option key={c} value={c}>{c}</option>)}
              </SELECT>

              <LABEL className="text-xs text-gray-600 ml-2">Estado</LABEL>
              <SELECT className="rounded border px-2 py-1 bg-white text-black"
                value={filterState}
                onChange={(e)=>setFilterState((e.target as HTMLSelectElement).value as any)}
              >
                <option value="*">Todos</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </SELECT>

              <LABEL className="text-xs text-gray-600 ml-2">Propiedad</LABEL>
              <SELECT className="rounded border px-2 py-1 bg-white text-black"
                value={filterProp}
                onChange={(e)=>setFilterProp((e.target as HTMLSelectElement).value as any)}
              >
                <option value="*">Todas</option>
                {compProps.map(p => <option key={p} value={p}>{p}</option>)}
              </SELECT>

              <INPUT
                className="ml-auto rounded border px-2 py-1 text-xs bg-white text-black"
                placeholder="Buscar…"
                value={search}
                onChange={(e)=>setSearch((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          {/* Resultado filtrado */}
          <div className="h-56 overflow-auto rounded-lg border p-3 bg-white text-black">
            <div className="text-[11px] text-gray-600 mb-1">{list.length} variables</div>
            <pre className="text-xs leading-5 whitespace-pre-wrap">{list.join("\n")}</pre>
          </div>
        </div>
      </Accordion>
    );
  };

  return (
    <div className={"w-full max-w-[1400px] mx-auto p-4 md:p-6 " + (className ?? "")}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 mb-4">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur px-3 py-2">
          <div className="flex items-center gap-2">
            <SPAN className="text-sm text-gray-700">Control</SPAN>
            <SELECT
              className="rounded-lg border px-2 py-1.5 bg-white text-black"
              value={component}
              onChange={(e)=>setComponent((e.target as HTMLSelectElement).value as ComponentKey)}
            >
              {allComponents.map(c => <option key={c} value={c}>{c}</option>)}
            </SELECT>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <SPAN className="text-xs text-gray-600">Estado</SPAN>
            <StateButtons current={currentState} onPick={setCurrentState} />
          </div>

          <BUTTON
            onClick={async () => { if (saveStyles) await saveStyles(schema); await saveMeta(); }}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Guardar todo
          </BUTTON>
        </div>
      </div>

      {/* (1) CRUD de temas + asignación por Drag&Drop */}
      <Accordion title="Temas: CRUD y asignación de aliases (Drag & Drop)" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* lista de temas arrastrables */}
          <div className="rounded-xl border p-3">
            <div className="text-xs font-medium mb-2">Temas disponibles (arrastra a Light/Dark)</div>
            <div className="flex flex-wrap gap-2">
              {(schema.themes ?? []).map((t) => (
                <SPAN
                  key={t}
                  draggable
                  onDragStart={(e:any) => e.dataTransfer.setData("text/plain", t)}
                  className="px-2 py-1 rounded-full border text-xs cursor-grab bg-white text-black"
                  title="Arrastra a Light o Dark"
                >{t}</SPAN>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <BUTTON className="px-2 py-1 rounded-lg border text-xs bg-white text-black" onClick={()=>{
                const name=(prompt("Nombre del nuevo tema:")||"").trim(); if(!name) return;
                if(schema.themes.includes(name)) return alert("Ese tema ya existe");
                setSchema(prev=>ensureTheme(prev, name, "light"));
              }}>+ Nuevo</BUTTON>

              <BUTTON className="px-2 py-1 rounded-lg border text-xs bg-white text-black" onClick={()=>{
                const base=(prompt("Duplicar desde tema:", schema.themes[0])||"").trim(); if(!base) return;
                if(!schema.themes.includes(base)) return alert("Tema base no existe");
                const name=(prompt(`Duplicar "${base}" como:`)||"").trim(); if(!name) return;
                if(schema.themes.includes(name)) return alert("Ya existe ese tema");
                setSchema(prev=>ensureTheme(prev, name, base));
              }}>Duplicar</BUTTON>

              <BUTTON className="px-2 py-1 rounded-lg border text-xs bg-white text-black" onClick={()=>{
                const old=(prompt("Renombrar tema:", schema.themes[0])||"").trim(); if(!old) return;
                if(!schema.themes.includes(old)) return alert("Tema no existe");
                const neo=(prompt(`Nuevo nombre para "${old}":`, old)||"").trim(); if(!neo || neo===old) return;
                if(schema.themes.includes(neo)) return alert("Ya existe ese tema");
                setSchema(prev=>renameTheme(prev, old, neo));
                if(aliasLight===old) setAliasLight(neo);
                if(aliasDark===old)  setAliasDark(neo);
              }}>Renombrar</BUTTON>

              <BUTTON className="px-2 py-1 rounded-lg border border-red-300 text-red-600 text-xs bg-white" onClick={()=>{
                const t=(prompt("Eliminar tema:", schema.themes[0])||"").trim(); if(!t) return;
                if(schema.themes.length<=1) return alert("Debe quedar al menos un tema.");
                if(!schema.themes.includes(t)) return alert("Tema no existe");
                if(!confirm(`Eliminar "${t}"?`)) return;
                setSchema(prev=>removeTheme(prev, t));
                if(aliasLight===t) setAliasLight(schema.themes.find(x=>x!==t) || "light");
                if(aliasDark===t)  setAliasDark(schema.themes.find(x=>x!==t) || "dark");
              }}>Eliminar</BUTTON>
            </div>
          </div>

          {/* zonas de drop para aliases */}
          <div
            className="rounded-xl border p-3 bg-white/70"
            onDragOver={(e)=>e.preventDefault()}
            onDrop={(e)=>{ const t=e.dataTransfer.getData("text/plain"); if (t) setAliasLight(t as ThemeKey); }}
          >
            <div className="text-xs font-medium mb-1">Light alias (soltar aquí)</div>
            <div className="text-sm bg-white text-black rounded-md border px-2 py-1">{aliasLight || "—"}</div>
          </div>

          <div
            className="rounded-xl border p-3 bg-white/70"
            onDragOver={(e)=>e.preventDefault()}
            onDrop={(e)=>{ const t=e.dataTransfer.getData("text/plain"); if (t) setAliasDark(t as ThemeKey); }}
          >
            <div className="text-xs font-medium mb-1">Dark alias (soltar aquí)</div>
            <div className="text-sm bg-white text-black rounded-md border px-2 py-1">{aliasDark || "—"}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <LABEL className="inline-flex items-center gap-2"><INPUT type="radio" name="initial" checked={initial==="light"} onChange={()=>setInitial("light")} />Light</LABEL>
            <LABEL className="inline-flex items-center gap-2"><INPUT type="radio" name="initial" checked={initial==="dark"}  onChange={()=>setInitial("dark")}  />Dark</LABEL>
          </div>
          <BUTTON onClick={saveMeta} className="px-4 py-2 rounded-lg border bg-white text-black">Guardar aliases + initial slot</BUTTON>
        </div>
      </Accordion>

      {/* (2) Preview sticky */}
      <StickyDualPreviewAccordion
        schema={schema}
        aliasLight={aliasLight}
        aliasDark={aliasDark}
        component={component}
        currentState={currentState}
        hoverByTheme={hoverByTheme}
        onHoverToggle={(th, on)=>setHoverByTheme(m=>({ ...m, [th]: on }))}
        updateGlobal={updateGlobal}
      />

      {/* (3) Tabla de ajustes */}
      <DynamicPropertyTableAccordion
        schema={schema}
        aliasLight={aliasLight}
        aliasDark={aliasDark}
        component={component}
        currentState={currentState}
        updateTokens={updateTokens}
        unsetTokenFn={unsetTokenFn}
      />

      {/* (4) Heredar/copiar a múltiples (con fix de iteración Set) */}
      <Accordion title="Heredar / Copiar estilos a múltiples controles" defaultOpen={false}>
        <BulkCopyInner
          schema={schema}
          setSchema={setSchema}
          allComponents={allComponents}
          aliasLight={aliasLight}
          aliasDark={aliasDark}
          defaultSource={component}
          currentState={currentState}
        />
      </Accordion>

      {/* (5) JSON + Variables CSS (misma lógica) */}
      <CSSVarsPanel schema={schema} aliasLight={aliasLight} aliasDark={aliasDark} initial={initial} />
    </div>
  );
}

/* === Cuerpo interno del Bulk copy (extraído para mantener el archivo ordenado) === */
const BulkCopyInner: React.FC<{
  schema: StylesSchema;
  setSchema: React.Dispatch<React.SetStateAction<StylesSchema>>;
  allComponents: ComponentKey[];
  aliasLight: ThemeKey; aliasDark: ThemeKey;
  defaultSource: ComponentKey;
  currentState: StyleState;
}> = ({ schema, setSchema, allComponents, aliasLight, aliasDark, defaultSource, currentState }) => {
  const [source, setSource] = React.useState<ComponentKey>(defaultSource);
  const [targets, setTargets] = React.useState<Set<ComponentKey>>(new Set(allComponents.filter(c => c !== defaultSource)));
  const [themeScope, setThemeScope] = React.useState<"light"|"dark"|"both">("both");
  const [propsSel, setPropsSel] = React.useState<Set<keyof TokenSet>>(new Set(CONTROL_PROPS.map(p => p.key)));
  const [statesSel, setStatesSel] = React.useState<Set<StyleState>>(new Set<StyleState>([currentState]));

  React.useEffect(() => { setStatesSel(new Set<StyleState>([currentState])); }, [currentState]);
  const toggle = <T extends string>(s: Set<T>, v: T) => { const nx = new Set(s); nx.has(v) ? nx.delete(v) : nx.add(v); return nx; };

  const copyForTheme = (themeKey: ThemeKey) => {
    const srcTok = (st: StyleState) => resolveTokens(schema, source, themeKey, st);
    setSchema(prev => {
      let next = clone(prev);
      for (const dst of Array.from(targets) as ComponentKey[]) {
        for (const st of Array.from(statesSel)) {
          const from = srcTok(st);
          const patch: Partial<TokenSet> = {};
          for (const k of Array.from(propsSel)) (patch as any)[k] = (from as any)[k];
          next.components[dst] ??= {} as any;
          (next.components[dst] as any)[themeKey] ??= {} as any;
          (next.components[dst] as any)[themeKey][st] = {
            ...((next.components[dst] as any)[themeKey][st] ?? {}),
            ...patch,
          };
        }
      }
      return next;
    });
  };

  const apply = () => {
    if (!source || targets.size === 0 || propsSel.size === 0 || statesSel.size === 0) {
      alert("Selecciona fuente, al menos un destino, propiedades y estados.");
      return;
    }
    if (themeScope === "light" || themeScope === "both") copyForTheme(themeKeyFromAlias(aliasLight, "light"));
    if (themeScope === "dark"  || themeScope === "both") copyForTheme(themeKeyFromAlias(aliasDark,  "dark"));
    alert("Estilos copiados.");
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fuente y estados */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div className="text-sm font-semibold mb-2">Fuente</div>
          <div className="flex items-center gap-2 flex-wrap">
            <SPAN className="text-xs text-gray-600">Control</SPAN>
            <SELECT className="rounded-lg border px-2 py-1.5 bg-white text-black"
              value={source} onChange={(e)=>setSource((e.target as HTMLSelectElement).value as ComponentKey)}
            >
              {allComponents.map(c => <option key={c} value={c}>{c}</option>)}
            </SELECT>
            <SPAN className="ml-2 text-xs text-gray-600">Estados</SPAN>
            <div className="flex flex-wrap gap-1.5">
              {STATES.map(s => (
                <LABEL key={s} className={`px-2 py-1 rounded-lg border text-xs bg-white ${statesSel.has(s) ? "bg-indigo-600 text-white border-indigo-600" : "text-black"}`}>
                  <INPUT type="checkbox" className="mr-1" checked={statesSel.has(s)} onChange={()=>setStatesSel(toggle(statesSel, s))} />
                  {s}
                </LABEL>
              ))}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            Tema: <code>{themeScope === "both" ? `${aliasLight} + ${aliasDark}` : themeScope === "light" ? aliasLight : aliasDark}</code>
          </div>
        </div>

        {/* Destinos y propiedades */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div className="text-sm font-semibold mb-2">Destinos</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {allComponents.map(c => (
              <LABEL key={c} className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 bg-white text-black">
                <INPUT type="checkbox" checked={targets.has(c)} onChange={()=>setTargets(toggle(targets, c))} />
                {c}
              </LABEL>
            ))}
          </div>

          <div className="text-sm font-semibold mb-2">Propiedades a copiar</div>
          <div className="flex flex-wrap gap-2">
            {CONTROL_PROPS.map(p => (
              <LABEL key={String(p.key)} className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 bg-white text-black" title={p.label}>
                <INPUT type="checkbox" checked={propsSel.has(p.key)} onChange={()=>setPropsSel(toggle(propsSel, p.key))} />
                {p.abbr}
              </LABEL>
            ))}
          </div>

          <div className="mt-3 text-sm font-semibold mb-2">Tema destino</div>
          <div className="flex items-center gap-2">
            <LABEL className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 bg-white text-black">
              <INPUT type="radio" checked={themeScope==="both"} onChange={()=>setThemeScope("both")} /> ambos
            </LABEL>
            <LABEL className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 bg-white text-black">
              <INPUT type="radio" checked={themeScope==="light"} onChange={()=>setThemeScope("light")} /> light
            </LABEL>
            <LABEL className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 bg-white text-black">
              <INPUT type="radio" checked={themeScope==="dark"} onChange={()=>setThemeScope("dark")} /> dark
            </LABEL>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <BUTTON className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700" onClick={apply}>Aplicar</BUTTON>
      </div>
    </div>
  );
};
