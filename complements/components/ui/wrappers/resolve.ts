'use client';

import { cx } from './utils';

/** Alias internos “siempre activos” por elemento HTML o wrappers */
const BUILTIN_ALIASES: Record<string, string> = {
  a: 'link',
  anchor: 'link',
  img: 'image',
  image: 'image',
  nextimage: 'image',
};

/** Normaliza strings/arrays a una sola clase con dedupe. */
function toClass(x?: string | string[]) : string {
  if (!x) return '';
  const parts = (Array.isArray(x) ? x : String(x).trim().split(/\s+/)).filter(Boolean);
  return Array.from(new Set(parts)).join(' ');
}

/**
 * Resuelve clases desde el RDD para un "componente" (kind).
 * Soporta:
 *  - components[kind].base                 -> string | string[]
 *  - components[kind].aliases[scheme]      -> remapea kind por esquema (y sigue la cadena)
 *  - components[kind].variants[name]       -> string | string[]
 *  - components[kind].sizes[name]          -> string | string[]
 *  - components[kind].states[name]         -> string | string[]
 *  - classes[kind]                         -> fallback directo
 *  - BUILTIN_ALIASES                       -> a→link, img/nextimage→image, etc.
 * Con fallback a baseFallback y extra (className adicional).
 */
export function resolveComponentClasses(
  Styles: any,
  kindIn: string,
  opts?: {
    baseFallback?: string;
    scheme?: 'light' | 'dark';
    variant?: string;
    size?: string;
    state?: string;
    extra?: string;
  }
) {
  const { baseFallback = '', scheme, variant, size, state, extra } = opts || {};

  // 0) Normaliza el kind de entrada con alias internos
  const initialKind = (BUILTIN_ALIASES[kindIn] ?? kindIn)?.trim();

  // Si no hay Styles aún (inicio/SSR), devolvemos lo básico
  if (!Styles) {
    return cx(initialKind === 'link' ? 'link' : '', baseFallback, extra);
  }

  // 1) Sigue la cadena de aliases por scheme (por si hay alias→alias)
  let effectiveKind = initialKind;
  const visited = new Set<string>();
  for (let i = 0; i < 5; i++) {
    if (!effectiveKind || visited.has(effectiveKind)) break;
    visited.add(effectiveKind);

    const aliasTarget =
      Styles?.components?.[effectiveKind]?.aliases?.[scheme || ''] as string | undefined;

    if (!aliasTarget) break;

    const next = (BUILTIN_ALIASES[aliasTarget] ?? aliasTarget).trim();
    if (!next || next === effectiveKind) break;
    effectiveKind = next;
  }

  // 2) Nodo de componente efectivo
  const cmp = Styles?.components?.[effectiveKind] ?? Styles?.components?.[initialKind] ?? {};

  // 3) Resolver base con fallback en 'classes', y luego baseFallback
  const base =
    toClass(cmp.base) ||
    toClass(Styles?.classes?.[effectiveKind]) ||
    toClass(Styles?.classes?.[initialKind]) ||
    baseFallback ||
    '';

  // 4) Variantes / tamaños / estados (string | string[])
  const vCls = variant ? toClass(cmp.variants?.[variant]) : '';
  const sCls = size ? toClass(cmp.sizes?.[size]) : '';
  const stCls = state ? toClass(cmp.states?.[state]) : '';

  // 5) Clase extra del usuario
  const extraCls = toClass(extra);

  // 6) Ensamblar con dedupe global
  return cx(base, vCls, sCls, stCls, extraCls);
}
