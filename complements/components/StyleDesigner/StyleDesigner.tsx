"use client";
import ReactDOM from "react-dom";
import React, { useEffect, useMemo, useState } from "react";
import { saveSettingsClient } from "@/app/lib/settings/client";
import Link from "next/link";
import Image from "next/image";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

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
  "a",
  "b",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
  "div",
  "div2",
  "div3",
  "link",
  "link2",
  "label",
  "label2",
  "input",
  "input2",
  "button",
  "button2",
  "select",
  "select2",
  "image",
  "image2",
  "nextimage",
];
const STATES: StyleState[] = [
  "rest",
  "hover",
  "active",
  "disabled",
  "highlight",
  "highhover",
  "inert",
  "focus",
  "visited",
  "warning",
  "error"
];
const NON_REST_STATES: StyleState[] = [
  "hover",
  "active",
  "disabled",
  "highlight",
  "highhover",
  "inert",
  "focus",
  "visited",
  "warning",
  "error"
];
const BASE_THEMES: ThemeKey[] = ["light","dark"];

const DEFAULT_TOKENS: TokenSet = {
  backgroundColor: "#ffffff",
  textColor: "#000000",
  borderColor: "#e5e7eb",
  borderRadius: 7,
  borderWidth: 1,
  paddingX: 4,
  paddingY: 3,
  marginX: 0,
  marginY: 4,
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: 0,
  lineHeight: 1.4,
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

const CSSGlobalsGenerator: React.FC<{
  schema: StylesSchema;
  states: StyleState[];
  components: ComponentKey[];
  aliasLight: ThemeKey;
  aliasDark: ThemeKey;
}> = ({ schema, states, components, aliasLight, aliasDark }) => {
  // Props globales (body)
  const BODY_PROPS: (keyof TokenSet)[] = [
    "backgroundColor",
    "textColor",
    "borderColor",
    "borderWidth",
    "borderRadius",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "paddingX",
    "paddingY",
    "marginX",
    "marginY",
    "transitionSpeed",
  ];

  // Props por control
  const CONTROL_PROPS: (keyof TokenSet)[] = [
    "backgroundColor",
    "textColor",
    "borderColor",
    "borderWidth",
    "borderRadius",
    "boxShadow",
    "paddingX",
    "paddingY",
    "marginX",
    "marginY",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "outlineColor",
    "outlineWidth",
    "opacity",
    "cursor",
    "transitionSpeed",
  ];

  // ─────────────────────────────────────────────
  // (1) Bloques de alias: html[data-theme="light/dark"]
  // ─────────────────────────────────────────────
  const buildAliasBlock = (slot: "light" | "dark"): string => {
    const lines: string[] = [];

    lines.push(`/* ${slot.toUpperCase()} */`);
    lines.push(`html[data-theme="${slot}"]{`);

    // BODY (sin estados)
    for (const prop of BODY_PROPS) {
      const p = String(prop);
      lines.push(`  --body-${p}: var(--body-${p}-${slot});`);
    }

    lines.push("");

    // COMPONENTES (con estados)
    for (const comp of components) {
      const c = String(comp); // respeta exactamente el nombre del componente

      for (const prop of CONTROL_PROPS) {
        const p = String(prop);
        for (const st of states) {
          lines.push(
            `  --${c}-${p}-${st}: var(--${c}-${p}-${slot}-${st});`
          );
        }
      }

      lines.push("");
    }

    lines.push("}");
    return lines.join("\n");
  };

  // ─────────────────────────────────────────────
  // (2) Bloques de clases CSS para los wrappers
  //     (.link, .button, .input, .select, .label,
  //      .h1…h6, .a, .p, .div, .div2, .div3, etc.)
  // ─────────────────────────────────────────────
  const buildWrapperBlocks = (components: ComponentKey[]): string => {
    const lines: string[] = [];

    lines.push("");
    lines.push("/* =====================================================================");
    lines.push(" * Wrappers base (clases CSS que consumen los tokens RDD)");
    lines.push(" * ===================================================================== */");
    lines.push("");

    const makeBlockFor = (raw: string): string[] => {
      const c = raw;                 // nombre tal cual del componente: "link", "button2", "div3"
      const upper = c.toUpperCase(); // título del comentario

      const out: string[] = [];
      out.push(`/* === ${upper} === */`);
      out.push(`.${c}{`);
      out.push(`  background-color: var(--${c}-backgroundColor-rest);`);
      out.push(`  color:            var(--${c}-textColor-rest);`);
      out.push("");
      out.push("  border-style: solid;");
      out.push(`  border-width: calc(var(--${c}-borderWidth-rest) * 1px);`);
      out.push(`  border-color: var(--${c}-borderColor-rest);`);
      out.push("");
      out.push(
        `  border-radius: calc(var(--${c}-borderRadius-rest) * 1px);`
      );
      out.push(`  box-shadow:    var(--${c}-boxShadow-rest);`);
      out.push(
        `  padding:       calc(var(--${c}-paddingY-rest) * 1px) calc(var(--${c}-paddingX-rest) * 1px);`
      );

      // Ajustes especiales por tipo (como en tu ejemplo)
      if (c === "link" || c === "a") {
        out.push("");
        out.push("  text-decoration: none;");
      }
      if (c === "link") {
        out.push("  display: inline-block;");
      }

      out.push("");
      out.push(
        `  transition: all var(--${c}-transitionSpeed-rest, 200ms) ease;`
      );
      out.push("}");

      // :hover
      out.push(`.${c}:hover{`);
      out.push(`  background-color: var(--${c}-backgroundColor-hover);`);
      out.push(`  color:            var(--${c}-textColor-hover);`);
      out.push(`  border-color:     var(--${c}-borderColor-hover);`);
      out.push("}");

      // :active
      out.push(`.${c}:active{`);
      out.push(`  background-color: var(--${c}-backgroundColor-active);`);
      out.push(`  color:            var(--${c}-textColor-active);`);
      out.push(`  border-color:     var(--${c}-borderColor-active);`);
      out.push("}");

      // [disabled]
      out.push(`.${c}[disabled],`);
      out.push(`.${c}[aria-disabled="true"]{`);
      out.push("  pointer-events: none;");
      out.push(`  opacity:        var(--${c}-opacity-disabled, .6);`);
      out.push(`  background-color: var(--${c}-backgroundColor-disabled);`);
      out.push(`  color:            var(--${c}-textColor-disabled);`);
      out.push(`  border-color:     var(--${c}-borderColor-disabled);`);
      out.push("}");

      // .{c}.c-highlight
      out.push(`.${c}.${c}-highlight{`);
      out.push(
        `  background-color: var(--${c}-backgroundColor-highlight);`
      );
      out.push(`  color:            var(--${c}-textColor-highlight);`);
      out.push(`  border-color:     var(--${c}-borderColor-highlight);`);
      out.push("}");
      out.push(`.${c}.${c}-highlight:hover{`);
      out.push(
        `  background-color: var(--${c}-backgroundColor-highhover);`
      );
      out.push(`  color:            var(--${c}-textColor-highhover);`);
      out.push(`  border-color:     var(--${c}-borderColor-highhover);`);
      out.push("}");

      out.push("");
      return out;
    };

    // generamos para todos los componentes que tengan tokens
    for (const comp of components) {
      lines.push(...makeBlockFor(String(comp)));
    }

    // Bloque html/body
    lines.push("/* Consume los tokens globales en el layout */");
    lines.push("html, body{");
    lines.push("  background-color: var(--body-backgroundColor);");
    lines.push("  color:            var(--body-textColor);");
    lines.push("  font-family:      var(--body-fontFamily);");
    lines.push("  font-size:        var(--body-fontSize);");
    lines.push("  font-weight:      var(--body-fontWeight);");
    lines.push("  letter-spacing:   var(--body-letterSpacing);");
    lines.push("  line-height:      var(--body-lineHeight);");
    lines.push("}");
    lines.push("");
    lines.push("/* Si tu wrapper principal pinta fondo, herédalo */");
    lines.push("main, #__next, [data-app-root]{");
    lines.push("  background: inherit;");
    lines.push("  color: inherit;");
    lines.push("}");

    return lines.join("\n");
  };

  // ─────────────────────────────────────────────
  // (3) Texto completo de globals.css
  // ─────────────────────────────────────────────
  const cssText = React.useMemo(() => {
    const header = [
      "/* =====================================================================",
      " * globals.css generado desde StyleDesigner",
      ` * Alias actuales: light → \"${aliasLight}\", dark → \"${aliasDark}\"`,
      " * Ajusta / recorta lo que necesites y pégalo en tu globals.css",
      " * =====================================================================",
      " */",
      "",
    ].join("\n");

    return [
      header,
      buildAliasBlock("light"),
      "",
      buildAliasBlock("dark"),
      "",
      buildWrapperBlocks(components),
    ].join("\n");
  }, [aliasLight, aliasDark, components, states]);

  const [copyStatus, setCopyStatus] = React.useState<"idle" | "ok" | "error">(
    "idle"
  );

  const handleCopyGlobals = async () => {
    try {
      await navigator.clipboard.writeText(cssText);
      setCopyStatus("ok");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (e) {
      console.error("No se pudo copiar al portapapeles", e);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <SPAN className="text-xs text-gray-600 dark:text-gray-300">
          Este bloque genera el mapping de variables + wrappers base para{" "}
          <code>html[data-theme=\"light/dark\"]</code> y clases (.link,
          .button, .input, .div2, etc.).
        </SPAN>
        <BUTTON
          type="button"
          onClick={handleCopyGlobals}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700"
        >
          {copyStatus === "ok"
            ? "Copiado ✓"
            : copyStatus === "error"
            ? "Error al copiar"
            : "Copiar globals.css"}
        </BUTTON>
      </div>

      <textarea
        readOnly
        className="w-full h-80 font-mono text-[11px] rounded-lg border border-gray-300 dark:border-gray-700 bg-white text-black p-3"
        value={cssText}
      />
    </div>
  );
};

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
const ColorField: React.FC<{ value?: string; onChange: (v: string) => void; placeholder?: string; }> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<string>(value ?? "");
  const [alpha, setAlpha] = useState<number>(1);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  const normalizeHex = (v: string) => v.trim().toLowerCase();

  const parseFromValue = (rawValue?: string) => {
    const raw = (rawValue ?? "").trim();
    if (!raw) {
      return { tmp: "#ffffff", a: 1, transparent: false };
    }
    if (raw.toLowerCase() === "transparent") {
      return { tmp: "#ffffff", a: 0, transparent: true };
    }
    // #RRGGBBAA
    if (/^#[0-9a-fA-F]{8}$/.test(raw)) {
      const rgb = raw.slice(1, 7);
      const aa = parseInt(raw.slice(7, 9), 16) / 255;
      return { tmp: `#${rgb}`, a: clamp01(aa), transparent: false };
    }
    // #RRGGBB
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      return { tmp: raw.toLowerCase(), a: 1, transparent: false };
    }
    // #RGB o #RGBA
    if (/^#[0-9a-fA-F]{3,4}$/.test(raw)) {
      const h = raw.slice(1).split("").map((c) => c + c).join("");
      const rgb = h.slice(0, 6);
      let aa = 1;
      if (h.length === 8) {
        aa = parseInt(h.slice(6, 8), 16) / 255;
      }
      return { tmp: `#${rgb}`, a: clamp01(aa), transparent: false };
    }
    // lo demás: texto libre sin alpha
    return { tmp: raw, a: 1, transparent: false };
  };

  const compose = (base: string, a: number) => {
    if (isTransparent) return "transparent";
    const raw = base.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      const rgb = raw.slice(1, 7);
      const aa = Math.round(clamp01(a) * 255);
      return `#${rgb}${to2(aa)}`.toLowerCase();
    }
    if (/^#[0-9a-fA-F]{8}$/.test(raw)) {
      const rgb = raw.slice(1, 7);
      const aa = Math.round(clamp01(a) * 255);
      return `#${rgb}${to2(aa)}`.toLowerCase();
    }
    return raw || "#ffffff";
  };

  // sincroniza estado interno cuando cambia value externo
  useEffect(() => {
    const { tmp, a, transparent } = parseFromValue(value);
    setTemp(tmp);
    setAlpha(a);
    setIsTransparent(transparent);
  }, [value]);

  // cerrar al click fuera o Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTemp(value ?? "");
        setOpen(false);
      }
      if (e.key === "Enter" && open) {
        onChange(compose(normalizeHex(temp || "#ffffff"), alpha));
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open, temp, alpha, value]);

  // solo un ColorField abierto a la vez
  useEffect(() => {
    const closeAll = () => setOpen(false);
    window.addEventListener("colorfield:closeAll", closeAll as any);
    return () => window.removeEventListener("colorfield:closeAll", closeAll as any);
  }, []);

  useEffect(() => {
    if (!open || !ref.current) return;

    const updatePosition = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const margin = 8;
      const width = 320; // coincide con w-80
      let left = rect.left;
      let top = rect.bottom + margin;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const estimatedHeight = 260; // alto aprox del popup

      // Ajuste horizontal
      if (left + width > vw - margin) {
        left = vw - width - margin;
      }
      if (left < margin) {
        left = margin;
      }

      // Si no cabe hacia abajo, lo abrimos hacia arriba
      if (top + estimatedHeight > vh - margin) {
        top = rect.top - estimatedHeight - margin;
      }

      setPopupPos({ top, left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const toggle = () => {
    if (!open) window.dispatchEvent(new Event("colorfield:closeAll"));
    setOpen((o) => !o);
  };

  const [popupPos, setPopupPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  const baseForInputColor = (() => {
    const raw = (isTransparent ? "#ffffff" : temp || value || "").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
    if (/^#[0-9a-fA-F]{8}$/.test(raw)) return `#${raw.slice(1, 7).toLowerCase()}`;
    if (/^#[0-9a-fA-F]{3,4}$/.test(raw)) {
      const h = raw.slice(1).split("").map((c) => c + c).join("");
      return `#${h.slice(0, 6).toLowerCase()}`;
    }
    return "#ffffff";
  })();

  const effectiveAlpha = isTransparent ? 0 : alpha;
  const showChecker = effectiveAlpha < 1 - 1e-6;
  const fillColor = isTransparent ? "transparent" : compose(temp || value || "#ffffff", effectiveAlpha);

  const handleApply = () => {
    if (isTransparent) {
      onChange("transparent");
    } else {
      onChange(compose(temp || "#ffffff", alpha || 1));
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <BUTTON
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        aria-expanded={open}
        className="flex items-center gap-2 w-full rounded-xl border border-gray-300 bg-white text-black px-2 py-2"
      >
        <SPAN
          className="inline-block h-5 w-5 rounded border border-gray-300 overflow-hidden"
          style={
            showChecker
              ? {
                  backgroundImage: "conic-gradient(#ccc 25%, #eee 0 50%, #ccc 0 75%, #eee 0)",
                  backgroundSize: "8px 8px",
                  boxShadow: `inset 0 0 0 9999px ${fillColor}`,
                }
              : { background: fillColor }
          }
        />
        <SPAN className="truncate text-left text-gray-800 dark:text-gray-100">
          {isTransparent ? "transparent" : value || placeholder || "Select color"}
        </SPAN>
        <SPAN className="ml-auto text-xs text-gray-500">{open ? "▲" : "▼"}</SPAN>
      </BUTTON>

      {open &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className="fixed z-[9999] w-80 rounded-2xl border border-gray-300 bg-gray-900 text-white shadow-lg p-4"
            style={{ top: popupPos.top, left: popupPos.left }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <SPAN className="text-xs font-medium text-gray-300">Selecciona un color</SPAN>
              <BUTTON
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                }}
                aria-label="Cerrar selector"
                className="p-1 rounded hover:bg-gray-800"
              >
                ✕
              </BUTTON>
            </div>

            <div className="mb-2">
              <INPUT
                type="color"
                className="w-full h-10 rounded disabled:opacity-50"
                disabled={isTransparent}
                value={baseForInputColor}
                onChange={(e) => {
                  setTemp(normalizeHex((e.target as HTMLInputElement).value));
                }}
              />
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <SPAN>Opacidad (alpha)</SPAN>
                <SPAN>{Math.round(effectiveAlpha * 100)}%</SPAN>
              </div>
              <INPUT
                type="range"
                min={0}
                max={100}
                value={Math.round(effectiveAlpha * 100)}
                disabled={isTransparent}
                onChange={(e) => {
                  const a = clamp01(Number((e.target as HTMLInputElement).value) / 100);
                  setAlpha(a);
                }}
                className="w-full"
              />
            </div>

            <div>
              <INPUT
                type="text"
                className="w-full rounded-lg border border-gray-300 bg-white text-black px-2 py-2 font-mono text-xs"
                placeholder={placeholder || "#111827 | rgba(...) | hsla(...) | transparent"}
                value={isTransparent ? "transparent" : temp}
                // 👇 ya NO lo deshabilitamos; así puedes salir de "transparent"
                onChange={(e) => {
                  const val = (e.target as HTMLInputElement).value;
                  setTemp(val);

                  const low = val.trim().toLowerCase();

                  if (low === "transparent") {
                    // entra en modo transparente
                    setIsTransparent(true);
                    setAlpha(0);
                  } else {
                    // si estaba en transparente y ahora escribes un color, salimos de ese modo
                    if (isTransparent) {
                      setIsTransparent(false);
                      setAlpha(1);
                    }
                  }
                }}
                onBlur={() => {
                  const low = (temp || "").trim().toLowerCase();

                  if (low === "transparent") {
                    onChange("transparent");
                  } else {
                    onChange(compose(temp || "#ffffff", alpha || 1));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const low = (temp || "").trim().toLowerCase();

                    if (low === "transparent") {
                      onChange("transparent");
                    } else {
                      onChange(compose(temp || "#ffffff", alpha || 1));
                    }
                    setOpen(false);
                  }
                }}
              />
            </div>

          {/* Toggle explícito de transparent */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-200">
            <INPUT
              type="checkbox"
              checked={isTransparent}
              onChange={(e) => {
                const checked = (e.target as HTMLInputElement).checked;

                if (checked) {
                  // Entrar a modo transparente
                  setIsTransparent(true);
                  setAlpha(0);
                } else {
                  // Salir de modo transparente
                  setIsTransparent(false);
                  // Si el texto actual es "transparent" o está vacío, pon un color seguro
                  const low = (temp || "").trim().toLowerCase();
                  if (!temp || low === "transparent") {
                    setTemp("#ffffff");
                  }
                  setAlpha(1);
                }
              }}
            />
            <SPAN>Usar transparent</SPAN>
          </div>

            <div className="flex justify-end gap-2 mt-3">
              <BUTTON
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700"
              >
                Cerrar
              </BUTTON>
              <BUTTON
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isTransparent) {
                    onChange("transparent");
                  } else {
                    onChange(compose(temp || "#ffffff", alpha || 1));
                  }
                  setOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Aplicar
              </BUTTON>
            </div>
          </div>,
          document.body
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

/** input color compacto usando el ColorField (no se cierra al primer clic) */
const TinyColor: React.FC<{ value?: string; onChange: (v: string) => void; title?: string }> = ({
  value,
  onChange,
  title,
}) => {
  return (
    <div className="min-w-[110px]">
      <ColorField
        value={value}
        onChange={onChange}
        placeholder={title || "color"}
      />
    </div>
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

  { key: "borderWidth",   abbr: "BWidth", label: "borderWidth",   type: "number", min: 0, max: 12, step: 1, width: 56 },
  { key: "borderRadius",  abbr: "BRadius", label: "borderRadius",  type: "number", min: 0, max: 40, step: 1, width: 56 },

  { key: "paddingX", abbr: "PadX", label: "paddingX", type: "number", min: 0, max: 40, step: 1, width: 56 },
  { key: "paddingY", abbr: "PadY", label: "paddingY", type: "number", min: 0, max: 40, step: 1, width: 56 },
  { key: "marginX",  abbr: "MrgX", label: "marginX",  type: "number", min: 0, max: 64, step: 1, width: 56 },
  { key: "marginY",  abbr: "MrgY", label: "marginY",  type: "number", min: 0, max: 64, step: 1, width: 56 },

  { key: "fontSize",      abbr: "FSize", label: "fontSize",      type: "number", min: 10, max: 64, step: 1, width: 56 },
  { key: "fontWeight",    abbr: "FWeight", label: "fontWeight",    type: "number", min: 100, max: 900, step: 50, width: 64 },
  { key: "letterSpacing", abbr: "LtrSp", label: "letterSpacing (em)", type: "number", min: -0.1, max: 0.3, step: 0.005, width: 64 },
  { key: "lineHeight",    abbr: "LHeight",  label: "lineHeight",    type: "number", min: 1, max: 2.2, step: 0.05, width: 56 },

  { key: "boxShadow",     abbr: "BoxSdhw", label: "boxShadow",     type: "shadow", width: 210 },
];

/* === Globales compactos (2 filas) === */
type GlobalDef = { key: keyof TokenSet; abbr: string; label: string; type: "color" | "number"; min?: number; max?: number; step?: number; width?: number; };

const GLOBAL_PROPS_ROW1: GlobalDef[] = [
  { key: "backgroundColor", abbr: "BG",  label: "Global backgroundColor", type: "color" },
  { key: "textColor",       abbr: "FG",  label: "Global textColor",       type: "color" },
  { key: "borderRadius",    abbr: "BRadius", label: "Global borderRadius",    type: "number", min: 0, max: 40, step: 1, width: 56 },
  { key: "borderWidth",     abbr: "BWidth", label: "Global borderWidth",     type: "number", min: 0, max: 8,  step: 1, width: 56 },
  { key: "marginX",         abbr: "MrgX",  label: "Global marginX",         type: "number", min: 0, max: 64, step: 1, width: 56 },
  { key: "marginY",         abbr: "MrgY",  label: "Global marginY",         type: "number", min: 0, max: 64, step: 1, width: 56 },
];

const GLOBAL_PROPS_ROW2: GlobalDef[] = [
  { key: "paddingX",      abbr: "PadX",  label: "Global paddingX",            type: "number", min: 0,   max: 40,  step: 1,     width: 56 },
  { key: "paddingY",      abbr: "PadY",  label: "Global paddingY",            type: "number", min: 0,   max: 40,  step: 1,     width: 56 },
  { key: "fontSize",      abbr: "FSize", label: "Global fontSize",            type: "number", min: 10,  max: 64,  step: 1,     width: 56 },
  { key: "lineHeight",    abbr: "LHeight",  label: "Global lineHeight",          type: "number", min: 1,   max: 2.2, step: 0.05,  width: 56 },
  { key: "fontWeight",    abbr: "FWeight", label: "Global fontWeight",          type: "number", min: 100, max: 900, step: 50,    width: 64 },
  { key: "letterSpacing", abbr: "LtrSp", label: "Global letterSpacing (em)",  type: "number", min: -0.1, max: 0.3, step: 0.005, width: 64 },
];

/* === Cabecera de columna compacta === */
const PropHeaderCell: React.FC<{ abbr: string; title: string }> = ({ abbr, title }) => (
  <div
    className="px-1 py-1 text-center text-[9px] leading-tight"
    title={title}
  >
    <div className="font-semibold uppercase tracking-wide text-gray-400">
      {abbr}
    </div>
    <div className="text-[9px] text-gray-500 normal-case">
      {title}
    </div>
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

    // Construye el style para UN estado específico
    const buildPreviewStyle = (st: StyleState): React.CSSProperties => {
      const t = resolveTokens(schema, component, themeKey, st);

      return {
        backgroundColor: t.backgroundColor,
        color: t.textColor,
        borderColor: t.borderColor,
        borderWidth: (t.borderWidth ?? 0) + "px",
        borderStyle: "solid",
        borderRadius: (t.borderRadius ?? 0) + "px",
        boxShadow: t.boxShadow,
        boxSizing: "border-box",
        padding: `${t.paddingY ?? 0}px ${t.paddingX ?? 0}px`,
        margin: `${t.marginY ?? 0}px ${t.marginX ?? 0}px`,
        fontFamily: t.fontFamily,
        fontSize: (t.fontSize ?? 16) + "px",
        fontWeight: t.fontWeight as any,
        letterSpacing: (t.letterSpacing ?? 0) + "em",
        lineHeight: String(t.lineHeight ?? 1.2),
        transition: `all ${TRANSITION_SPEEDS[t.transitionSpeed ?? "normal"]} ease`,
        opacity: st === "disabled" ? 0.6 : 1,
        cursor: st === "disabled" ? "not-allowed" : undefined,
      };
    };

    // Renderiza el control (button, input, h1, etc.) en UN estado
    const renderControlForState = (st: StyleState) => {
      const style = buildPreviewStyle(st);
      const label = `${component} (${themeLabel}/${st})`;
      const disabled = st === "disabled";

      if (component === "div") {
        return (
          <DIV style={style as any}>
            {label}
          </DIV>
        );
      }

      if (component === "input") {
        return (
          <INPUT
            style={style}
            disabled={disabled}
            placeholder={label}
          />
        );
      }

      if (component === "select") {
        return (
          <SELECT style={style} disabled={disabled}>
            <option>{label}</option>
          </SELECT>
        );
      }

      if (component === "label") return <LABEL style={style as any}>{label}</LABEL>;
      if (component === "h1") return <H1 style={style as any}>{label}</H1>;
      if (component === "h2") return <H2 style={style as any}>{label}</H2>;
      if (component === "h3") return <H3 style={style as any}>{label}</H3>;
      if (component === "h4") return <H4 style={style as any}>{label}</H4>;
      if (component === "h5") return <H5 style={style as any}>{label}</H5>;
      if (component === "h6") return <H6 style={style as any}>{label}</H6>;

      if (component === "a" || component === "link") {
        return (
          <A
            href="#"
            onClick={(e: React.MouseEvent) => e.preventDefault()}
            style={style as any}
          >
            {label}
          </A>
        );
      }

      if (component === "p") return <P style={style as any}>{label}</P>;

      if (component === "image") {
        return (
          <SPAN style={style as any}>
            <img
              src="https://picsum.photos/seed/pwa-sticky/260/120"
              alt={label}
              style={{ display: "block", borderRadius: "inherit" }}
            />
          </SPAN>
        );
      }

      if (component === "nextimage") {
        return (
          <SPAN style={style as any}>
            <NEXTIMAGE
              src="https://picsum.photos/seed/pwa-sticky-next/260/120"
              alt={label}
              width={260}
              height={120}
              style={{ display: "block", borderRadius: "inherit" }}
            />
          </SPAN>
        );
      }

      // default: button o cualquier otro wrapper desconocido
      return (
        <BUTTON style={style} disabled={disabled}>
          {label}
        </BUTTON>
      );
    };


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
          <div className="text-center text-xs mb-2 opacity-70">
            {themeLabel} (alias: <code>{themeKey}</code>)
          </div>

          {/* Preview completo: un control por estado (compacto, 2 columnas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {STATES.map((st) => (
              <div
                key={st}
                className={
                  "rounded-xl border px-2 py-1.5 bg-black/60 " +
                  (st === currentState ? "border-red-500" : "border-gray-700/60")
                }
              >
                <div className="mb-0.5">{renderControlForState(st)}</div>
                <SPAN className="block text-[9px] uppercase tracking-wide text-center text-red-400">
                  {st}
                </SPAN>
              </div>
            ))}
          </div>


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
  <div className="px-1 pb-1 text-[11px] font-semibold text-gray-300">
    Propiedades del control
  </div>
);

const PropertyValueRow: React.FC<{
  schema: StylesSchema;
  themeKey: ThemeKey;
  component: ComponentKey;
  state: StyleState;
  onUpdate: (patch: Partial<TokenSet>) => void;
}> = ({ schema, themeKey, component, state, onUpdate }) => {
  const resolved = resolveTokens(schema, component, themeKey, state);
  const raw = (schema.components[component]?.[themeKey]?.[state] ?? {}) as TokenSet;

  const cell = (p: (typeof CONTROL_PROPS)[number]) => {
    const val = (raw as any)[p.key] ?? (resolved as any)[p.key];

    if (p.type === "color") {
      return (
        <TinyColor
          value={val as string}
          onChange={(nv) => onUpdate({ [p.key]: nv } as any)}
          title={p.label}
        />
      );
    }

    if (p.type === "number") {
      return (
        <TinyNumberCommit
          w={p.width ?? 56}
          value={Number(val ?? 0)}
          min={p.min}
          max={p.max}
          step={p.step}
          onCommit={(n) => onUpdate({ [p.key]: n } as any)}
        />
      );
    }

    if (p.type === "text") {
      return (
        <TinyText
          w={p.width ?? 140}
          value={String(val ?? "")}
          onCommit={(v) => onUpdate({ [p.key]: v } as any)}
        />
      );
    }

    if (p.type === "shadow") {
      return (
        <MiniBoxShadowEditor
          value={String(val ?? "")}
          onCommit={(v) => onUpdate({ [p.key]: v } as any)}
        />
      );
    }

    return null;
  };

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40 px-2 pb-2">
      {/* Grid VERTICAL de propiedades: 2–4 columnas, sin scroll horizontal */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {CONTROL_PROPS.map((p) => (
          <div key={String(p.key)} className="flex flex-col gap-1">
            <div className="text-[9px] uppercase tracking-wide text-gray-500">
              {p.abbr}
              <SPAN className="ml-1 text-[9px] normal-case text-gray-400">
                {p.label}
              </SPAN>
            </div>
            {cell(p)}
          </div>
        ))}
      </div>
    </div>
  );
};

const PropertyInheritRow: React.FC<{
  schema: StylesSchema;
  themeKey: ThemeKey;
  component: ComponentKey;
  state: StyleState;
  onUnset: (key: keyof TokenSet) => void;
}> = ({ schema, themeKey, component, state, onUnset }) => {
  const raw = (schema.components[component]?.[themeKey]?.[state] ?? {}) as TokenSet;

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 px-2 pt-1 pb-2">
      {/* Misma idea: grid vertical, pequeño, sin tabla horizontal */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {CONTROL_PROPS.map((p) => {
          const overridden = isOverridden(raw, p.key);
          return (
            <div
              key={String(p.key)}
              className="flex items-center justify-between text-[10px]"
            >
              <SPAN className="text-gray-500">{p.abbr}</SPAN>
              {overridden ? (
                <BUTTON
                  className="px-2 py-0.5 rounded-full text-[10px] bg-gray-800 text-gray-50 hover:bg-red-600"
                  onClick={() => onUnset(p.key)}
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
    </div>
  );
};

const DynamicPropertyTableAccordion: React.FC<{
  schema: StylesSchema;
  aliasLight: ThemeKey;
  aliasDark: ThemeKey;
  component: ComponentKey;
  currentState: StyleState;
  updateTokens: (
    theme: ThemeKey,
    comp: ComponentKey,
    state: StyleState,
    patch: Partial<TokenSet>
  ) => void;
  unsetTokenFn: (
    theme: ThemeKey,
    comp: ComponentKey,
    state: StyleState,
    key: keyof TokenSet
  ) => void;
  mutateSchema: (updater: (prev: StylesSchema) => StylesSchema) => void;
}> = ({
  schema,
  aliasLight,
  aliasDark,
  component,
  currentState,
  updateTokens,
  unsetTokenFn,
  mutateSchema,
}) => {
  const thLight = themeKeyFromAlias(aliasLight, "light");
  const thDark = themeKeyFromAlias(aliasDark, "dark");

  // === Preview por tema (matriz de estados) ===============================
  const renderStatesMatrix = (themeKey: ThemeKey, themeLabel: "light" | "dark") => {
    const buildPreviewStyle = (st: StyleState): React.CSSProperties => {
      const t = resolveTokens(schema, component, themeKey, st);

      return {
        backgroundColor: t.backgroundColor,
        color: t.textColor,
        borderColor: t.borderColor,
        borderWidth: (t.borderWidth ?? 0) + "px",
        borderStyle: "solid",
        borderRadius: (t.borderRadius ?? 0) + "px",
        boxShadow: t.boxShadow,
        padding: `${t.paddingY ?? 0}px ${t.paddingX ?? 0}px`,
        fontFamily: t.fontFamily,
        fontSize: (t.fontSize ?? 16) + "px",
        fontWeight: t.fontWeight as any,
        letterSpacing: (t.letterSpacing ?? 0) + "em",
        lineHeight: String(t.lineHeight ?? 1.2),
        transition: `all ${TRANSITION_SPEEDS[t.transitionSpeed ?? "normal"]} ease`,
        opacity: st === "disabled" ? 0.6 : 1,
        cursor: st === "disabled" ? "not-allowed" : undefined,
      };
    };

    const renderControlForState = (st: StyleState) => {
      const style = buildPreviewStyle(st);
      const label = `${component} (${themeLabel}/${st})`;
      const disabled = st === "disabled";

      if (component === "div") {
        return (
          <DIV style={style as any}>
            {label}
          </DIV>
        );
      }

      if (component === "input") {
        return <INPUT style={style} disabled={disabled} placeholder={label} />;
      }

      if (component === "select") {
        return (
          <SELECT style={style} disabled={disabled}>
            <option>{label}</option>
          </SELECT>
        );
      }

      if (component === "label") return <LABEL style={style as any}>{label}</LABEL>;
      if (component === "h1") return <H1 style={style as any}>{label}</H1>;
      if (component === "h2") return <H2 style={style as any}>{label}</H2>;
      if (component === "h3") return <H3 style={style as any}>{label}</H3>;
      if (component === "h4") return <H4 style={style as any}>{label}</H4>;
      if (component === "h5") return <H5 style={style as any}>{label}</H5>;
      if (component === "h6") return <H6 style={style as any}>{label}</H6>;

      if (component === "a" || component === "link") {
        return (
          <A
            href="#"
            onClick={(e: React.MouseEvent) => e.preventDefault()}
            style={style as any}
          >
            {label}
          </A>
        );
      }

      if (component === "p") return <P style={style as any}>{label}</P>;

      if (component === "image") {
        return (
          <SPAN style={style as any}>
            <img
              src="https://picsum.photos/seed/pwa-states/260/120"
              alt={label}
              style={{ display: "block", borderRadius: "inherit" }}
            />
          </SPAN>
        );
      }

      if (component === "nextimage") {
        return (
          <SPAN style={style as any}>
            <NEXTIMAGE
              src="https://picsum.photos/seed/pwa-states-next/260/120"
              alt={label}
              width={260}
              height={120}
              style={{ display: "block", borderRadius: "inherit" }}
            />
          </SPAN>
        );
      }

      // default: button u otro wrapper
      return (
        <BUTTON style={style} disabled={disabled}>
          {label}
        </BUTTON>
      )
    };

    return (
      <div className="h-full p-3">
        <div className="text-[11px] font-medium text-gray-200 mb-2">
          Preview {component} — {themeLabel} (<code>{themeKey}</code>)
        </div>
        {/* 1 por fila en muy chico, 2 en mediano, 3 en grande */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {STATES.map((st) => (
            <div
              key={st}
              className={
                "rounded-xl border px-2 py-1.5 bg-black/60 " +
                (st === currentState ? "border-red-500" : "border-gray-700/60")
              }
            >
            <div className="mb-0.5">{renderControlForState(st)}</div>
              <SPAN className="block text-[9px] uppercase tracking-wide text-center text-red-400">
                {st}
              </SPAN>
            </div>
          ))}
        </div>
      </div>
    )
  };

  // Panel por tema (light / dark): propiedades a la izq, previews a la der.
  const renderThemePanel = (themeKey: ThemeKey, label: "light" | "dark") => {
    const global = schema.global.body[themeKey] ?? {};
    return (
      <div
        className="rounded-3xl border border-gray-700/50 p-3"
        style={{
          backgroundColor:
            global.backgroundColor ??
            (label === "light" ? "#ffffff" : "#020617"),
          color: global.textColor ?? undefined,
        }}
      >
        {/* Panel por tema: 50% props | 50% previews */}
        <div className="h-[520px] min-h-[520px] flex flex-row gap-3">
          {/* ── COLUMNA IZQUIERDA: PROPIEDADES ── */}
          <div className="basis-1/2 min-w-0 min-h-0 overflow-y-auto rounded-2xl bg-black/40 border border-gray-800/70 p-2">
            <div className="px-1 pb-1 text-[11px] font-medium text-gray-300">
              Control: <strong>{component}</strong> — tema:{" "}
              <strong>{label}</strong> (<code>{themeKey}</code>) — estado:{" "}
              <strong>{currentState}</strong>
            </div>

            <PropertyHeader />

            <PropertyValueRow
              schema={schema}
              themeKey={themeKey}
              component={component}
              state={currentState}
              onUpdate={(patch) =>
                updateTokens(themeKey, component, currentState, patch)
              }
            />
            <div className="px-2 pt-1 text-[10px] text-gray-500">Hereda</div>
            <PropertyInheritRow
              schema={schema}
              themeKey={themeKey}
              component={component}
              state={currentState}
              onUnset={(key) =>
                unsetTokenFn(themeKey, component, currentState, key)
              }
            />
            {/* === Acciones rápidas de REST para este tema/control === */}
            <div className="px-2 pt-2 pb-3 flex flex-wrap gap-2 text-[11px]">
              <SPAN className="text-[10px] uppercase tracking-wide text-gray-500 mr-2">
                Acciones rápidas
              </SPAN>
              <BUTTON
                type="button"
                className="px-2 py-1 rounded-lg border text-xs bg-white text-black"
                title={`Copiar REST → ${currentState}`}
                onClick={() =>
                  mutateSchema((prev) =>
                    copyRestToState(prev, themeKey, component, currentState)
                  )
                }
              >
                REST(Ctrl/Tema) → {currentState}
              </BUTTON>
              <BUTTON
                type="button"
                className="px-2 py-1 rounded-lg border text-xs bg-white text-black"
                title="Copiar REST → todos los estados"
                onClick={() =>
                  mutateSchema((prev) =>
                    copyRestToAllStates(prev, themeKey, component)
                  )
                }
              >
                REST(Ctrl/Tema) → todos
              </BUTTON>
              <BUTTON
                type="button"
                className="px-2 py-1 rounded-lg border border-red-400 text-xs text-red-600 bg-white"
                title={`Eliminar overrides de ${currentState} (hereda 100% de REST)`}
                onClick={() =>
                  mutateSchema((prev) =>
                    clearStateOverrides(prev, themeKey, component, currentState)
                  )
                }
              >
                Limpiar {currentState}
              </BUTTON>
            </div>
          </div>
          {/* ── COLUMNA DERECHA: PREVIEWS ── */}
          <div className="basis-1/2 min-w-0 min-h-0 overflow-y-auto bg-black/60 rounded-2xl border border-gray-700/80">
            {renderStatesMatrix(themeKey, label)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Accordion title="Tabla de ajustes (sticky, compacta)" defaultOpen>
      {/* Cada tema ocupa 100% de ancho; uno debajo del otro */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 px-3 py-3">
        <div className="flex flex-col gap-4">
          {renderThemePanel(thLight, "light")}
          {renderThemePanel(thDark, "dark")}
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
      <>
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

        {/* (6) Generador dinámico de globals.css */}
        <Accordion title="Generar globals.css (auto)" defaultOpen={false}>
          <CSSGlobalsGenerator
            schema={schema}
            states={STATES}
            components={[...BASE_COMPONENTS]}
            aliasLight={aliasLight}
            aliasDark={aliasDark}
          />
        </Accordion>
      </>
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
        <div className="
          rounded-2xl border border-gray-700/60 
          bg-gradient-to-b from-gray-900/90 to-gray-800/60
          shadow-xl p-5 gap-4
          grid grid-cols-1 md:grid-cols-3
          backdrop-blur-sm
        ">
          {/* lista de temas arrastrables */}
          <div className="rounded-xl border p-3">
            <div className="text-xs font-medium mb-2">Temas disponibles (arrastra a Light/Dark)</div>
            <div className="flex flex-wrap gap-2">
              {(schema.themes ?? []).map((t) => (
                <SPAN
                  key={t}
                  draggable
                  onDragStart={(e:any) => e.dataTransfer.setData("text/plain", t)}
                  className="
                    border-2 border-dashed rounded-2xl p-5
                    bg-gray-800/40 hover:bg-gray-700/40
                    text-gray-300 transition-colors
                    min-h-[120px] flex items-center justify-center text-lg
                  "
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
        mutateSchema={(fn) => setSchema((prev) => fn(prev))}
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

              {/* ✅ checkbox: seleccionar / limpiar todos los estados */}
              <LABEL className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white text-black px-2 py-1 rounded border">
                <INPUT
                  type="checkbox"
                  checked={statesSel.size === STATES.length}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    setStatesSel(
                      checked
                        ? new Set<StyleState>(STATES)
                        : new Set<StyleState>()
                    );
                  }}
                />
                todos
              </LABEL>

              <div className="flex flex-wrap gap-1.5">
                {STATES.map((s) => (
                  <LABEL
                    key={s}
                    className={`px-2 py-1 rounded-lg border text-xs bg-white ${
                      statesSel.has(s)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "text-black"
                    }`}
                  >
                    <INPUT
                      type="checkbox"
                      className="mr-1"
                      checked={statesSel.has(s)}
                      onChange={() => setStatesSel(toggle(statesSel, s))}
                    />
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

          {/* ✅ checkbox: seleccionar / limpiar todos los destinos */}
          <div className="mb-2">
            <LABEL className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white text-black px-2 py-1 rounded border">
              <INPUT
                type="checkbox"
                checked={targets.size === allComponents.length}
                onChange={(e) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  setTargets(
                    checked
                      ? new Set<ComponentKey>(allComponents)
                      : new Set<ComponentKey>()
                  );
                }}
              />
              todos
            </LABEL>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {allComponents.map((c) => (
              <LABEL
                key={c}
                className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 bg-white text-black"
              >
                <INPUT
                  type="checkbox"
                  checked={targets.has(c)}
                  onChange={() => setTargets(toggle(targets, c))}
                />
                {c}
              </LABEL>
            ))}
          </div>
          <div className="text-sm font-semibold mb-2">Propiedades a copiar</div>
          {/* ✅ checkbox: seleccionar / limpiar todas las propiedades */}
          <div className="mb-2">
            <LABEL className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white text-black px-2 py-1 rounded border">
              <INPUT
                type="checkbox"
                checked={propsSel.size === CONTROL_PROPS.length}
                onChange={(e) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  setPropsSel(
                    checked
                      ? new Set<keyof TokenSet>(CONTROL_PROPS.map((p) => p.key))
                      : new Set<keyof TokenSet>()
                  );
                }}
              />
              todas
            </LABEL>
          </div>

          <div className="flex flex-wrap gap-2">
            {CONTROL_PROPS.map((p) => (
              <LABEL
                key={String(p.key)}
                className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 bg-white text-black"
                title={p.label}
              >
                <INPUT
                  type="checkbox"
                  checked={propsSel.has(p.key)}
                  onChange={() => setPropsSel(toggle(propsSel, p.key))}
                />
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
        <BUTTON onClick={apply}>Aplicar</BUTTON>
      </div>
    </div>
  );
};
