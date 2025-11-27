// app/lib/styles/interface.ts
// Interfaz "UI-friendly" para vistas/admin y constantes usadas por la UI.

import type {
  StylesSchema,
  TokenSet,
  StyleState,
  UIComponent,
} from "./types";
import { UI_COMPONENTS, STATES, BASE_THEMES } from "./types";

export type UIString = string | JSX.Element;

/**
 * Interfaz opcional para vistas (UI-friendly).
 * Si prefieres usar directamente StylesSchema en la UI, puedes ignorarla.
 */
export default interface iStyles<TText = UIString> {
  /** Temas disponibles en el documento (light, dark, etc.) */
  themes?: string[];

  /** Sección global (tokens del body y tipografía) */
  global: {
    /** Mapa de tema → tokens del body */
    body: Record<string, TokenSet>;
    /** Ajustes tipográficos globales */
    font?: { baseFamily?: string; scale?: number };
    /** Campo opcional para documentación visible en UI */
    notes?: TText;
  };

  /**
   * Tokens por componente → tema → estado
   * - componente: "button" | "input" | "select" | "label" | "h1" | ...
   * - tema: cualquiera declarado en `themes`
   * - estado: "rest" | "hover" | "active" | "disabled" | "highlight"
   */
  components: Record<string, Record<string, Partial<Record<StyleState, TokenSet>>>>;
}

/** Constantes que usa la UI/Admin (StyleDesigner, StylesTab) */
export const ALLOWED = {
  components: UI_COMPONENTS as UIComponent[],
  states: STATES as StyleState[],
  themesBase: BASE_THEMES, // slots base esperados por la PWA
};

/** Re-exports útiles (alias estable para la UI) */
export type {
  StylesSchema as StylesDoc, // antes algunos sitios usaban "StylesDoc" / "StyleRecord"
  TokenSet,
  StyleState,
  UIComponent,
} from "./types";
