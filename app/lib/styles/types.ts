// app/lib/styles/types.ts
// Tipos fuente del documento de Styles (alineados con StyleDesigner y seeds)

export type UIComponent =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "div"
  | "div2"
  | "div3"
  | "input"
  | "input2"
  | "select"
  | "select2"
  | "button"
  | "button2"
  | "label"
  | "label2"
  | "link"
  | "link2"
  | "a"
  | "p"
  | "b"
  | "image";

export type StyleState =
  | "rest"
  | "hover"
  | "active"
  | "disabled"
  | "highlight"
  | "highhover"
  | "highactive"
  | "inert"
  | "focus"
  | "visited"
  | "warning"
  | "error";

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type TransitionSpeedKey =
  | "verySlow"
  | "slow"
  | "normal"
  | "fast"
  | "veryFast";

export const TRANSITION_SPEEDS: Record<TransitionSpeedKey, string> = {
  verySlow: "500ms",
  slow: "320ms",
  normal: "200ms",
  fast: "120ms",
  veryFast: "80ms",
};

export interface TokenSet {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  opacity?: number;
  cursor?: string;

  borderRadius?: number | string;
  borderWidth?: number | string;
  boxShadow?: string;
  outlineColor?: string;
  outlineWidth?: string;

  paddingX?: number | string;
  paddingY?: number | string;
  marginX?: number | string;
  marginY?: number | string;

  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;

  transitionSpeed?: TransitionSpeedKey;
}

export interface GlobalBlock {
  body: Record<string /* theme */, TokenSet>;
  font?: {
    baseFamily?: string;
    scale?: number;
  };
  [k: string]: any;
}

export type ThemeStates = Partial<Record<StyleState, TokenSet>>;

/** Mapa simple de tema → estados */
export type ThemeStateMap = Record<string /* theme */, ThemeStates>;

/**
 * Nodo de componente que acepta:
 * - Temas directos (light/dark/…): theme → {state→tokens}
 * - base?: tema→{state→tokens}
 * - kinds?: { kind → (tema→{state→tokens}) }
 *
 * Usamos una firma de índice permisiva para evitar choques con 'kinds'/'base'.
 */
export interface ComponentNode {
  [theme: string]: any; // p.ej. "light", "dark" (ThemeStates) + otras claves
  base?: Record<string /* theme */, ThemeStates>;
  kinds?: Record<string /* kind */, Record<string /* theme */, ThemeStates>>;
}

/** Bloque de componentes: admite los conocidos y extras */
export type ComponentsBlock =
  Partial<Record<UIComponent, ComponentNode>> & Record<string, ComponentNode>;

export interface StylesSchema {
  $version: 1;
  themes?: string[];
  aliases?: { light: string; dark: string }; // mapeo slot → tema físico (opcional)
  global: GlobalBlock;
  components: ComponentsBlock;
  [k: string]: any;
}

export type StylesDoc = StylesSchema;
export type StylesDocLoose = DeepPartial<StylesSchema>;

export const BASE_THEMES = ["light", "dark"] as const;

export const UI_COMPONENTS: UIComponent[] = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "div",
  "div2",
  "div3",
  "input",
  "input2",
  "select",
  "select2",
  "button",
  "button2",
  "label",
  "label2",
  "link",
  "link2",
  "a",
  "p",
  "b",
  "image",
];

export const STATES: StyleState[] = [
  "rest",
  "hover",
  "active",
  "disabled",
  "highlight",
  "highhover",
  "highactive",
  "inert",
  "focus",
  "visited",
  "warning",
  "error",
];


export const DEFAULT_TOKENS: TokenSet = {
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
  fontSize: 16,
  fontWeight: 500,
  letterSpacing: 0,
  lineHeight: 1.3,
  transitionSpeed: "normal",
};

// ---------------- helpers ----------------
export function deepMerge<T extends Record<string, any>>(
  a: T,
  b: Partial<T>
): T {
  const out: any = Array.isArray(a) ? [...(a as any)] : { ...(a as any) };
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge((a as any)[k] ?? {}, v as any);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Normaliza un documento "suelto" (parcial) en un StylesSchema completo:
 * - Asegura lista de temas (al menos light/dark)
 * - Rellena tokens globales por tema
 * - Rellena todos los estados por componente/tema (solo para los temas directos)
 * - Respeta base/kinds si existen (no se aplanan aquí; se consumen en runtime)
 */
export function normalizeStyles(loose: StylesDocLoose): StylesSchema {
  const out: StylesSchema = {
    $version: 1,
    themes: Array.from(new Set([...(loose.themes ?? []), ...BASE_THEMES])),
    global: {
      body: {},
      font: loose.global?.font
        ? { ...loose.global.font }
        : { baseFamily: DEFAULT_TOKENS.fontFamily, scale: 1 },
    },
    components: {},
  };

  // global.body por tema
  for (const th of out.themes!) {
    out.global.body[th] = {
      ...DEFAULT_TOKENS,
      ...(loose.global?.body?.[th] ?? {}),
    };
  }

  // Copiar componentes (incluyendo base/kinds si los hay)
  for (const [comp, node] of Object.entries(loose.components ?? {})) {
    const n = (out.components[comp] = (out.components[comp] || {}) as ComponentNode);

    // temas directos
    for (const [th, stMapMaybe] of Object.entries(node || {})) {
      if (th === "base" || th === "kinds") continue;
      (n as any)[th] = stMapMaybe as any;
    }

    // base
    if ((node as any)?.base) {
      n.base = { ...(node as any).base };
    }

    // kinds
    if ((node as any)?.kinds) {
      n.kinds = { ...(node as any).kinds };
    }
  }

  // asegurar componentes/temas/estados en los temas directos conocidos
  for (const comp of UI_COMPONENTS) {
    const node = (out.components[comp] = (out.components[comp] || {}) as ComponentNode);
    for (const th of out.themes!) {
      const current = ((node as any)[th] = (node as any)[th] || {});
      for (const st of STATES) {
        current[st] = { ...(DEFAULT_TOKENS), ...(current[st] || {}) };
      }
    }
    // base/kinds no se normalizan aquí (se fusionan/leen en runtime)
  }

  return out;
}
