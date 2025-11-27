// app/lib/settings/interface.ts
import type { ReactNode } from "react";

/** Texto genérico (para descriptions, Address, etc.) */
export type SettingsText = string | ReactNode;

/* ─────────────────────────────────────────────────────────
   Subtipos de apoyo
   ───────────────────────────────────────────────────────── */

export interface FacultiesSettings {
  adminPanel: boolean;
  website: boolean;
  agentAI: boolean;
  ecommerce?: boolean;
  booking?: boolean;
  socialmedia?: boolean;
  sellsplatforms?: boolean;
  products?: boolean;
  services?: boolean;
  contact?: boolean;
  settings?: boolean;
  branding?: boolean;
  styles?: boolean;
  maps?: boolean;
  notifications?: boolean;
  paypal?: boolean;
  stripe?: boolean;
  adsense?: boolean;
}

export interface CompanyLegals<TText = SettingsText> {
  Name: TText;
  TaxId?: string;
  BusinessNumber?: string;
  Email?: string;
  Phone?: string;
  Address?: TText;
  mapLat?: number;
  mapLng?: number;
  placeQuery?: string;
}

export interface CompanyController<TText = SettingsText> {
  Name: TText;
  Email: string;
  Phone: string;
  Address: TText;
}

export interface CompanySettings<TText = SettingsText> {
  legals?: CompanyLegals<TText>;
  controller?: CompanyController<TText>;
}

export interface DomainSettings {
  enabled: boolean;
  url: string;
}

export type AgentAIProvider = "openai" | "gemini" | string;

export interface AgentAISettings {
  provider: AgentAIProvider;
  model: string;
  temperature?: number;
  languages?: string[]; // langCode[]
  rawConfig?: any;
}

export interface WebsiteFonts {
  headings?: string;
  body?: string;
}

export type ThemeSlot = "light" | "dark" | string;

export interface WebsiteTheme {
  aliases?: {
    light?: string;
    dark?: string;
  };
  initialSlot: ThemeSlot;
  meta?: {
    themeColor?: {
      light?: string;
      dark?: string;
    };
  };
}

export interface WebsiteI18N {
  defaultLocale: string;
  supported?: string[]; // locales[]
}

export interface WebsiteSettings {
  url: string;
  favicon?: string;
  ogDefault?: {
    image?: string;
  };
  fonts?: WebsiteFonts;
  theme?: WebsiteTheme;
  i18n?: WebsiteI18N;
}

export interface DirectUrlRoute {
  key: string;
  path: string;
}

export type PwaDisplayMode =
  | "fullscreen"
  | "standalone"
  | "minimal-ui"
  | "browser"
  | string;

export type PwaOrientation =
  | "any"
  | "natural"
  | "landscape"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary"
  | string;

export interface PwaIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export type PwaScreenshotFormFactor = "wide" | "narrow" | string;

export interface PwaScreenshot {
  src: string;
  sizes: string;
  type: string;
  label?: string;
  form_factor?: PwaScreenshotFormFactor;
}

export interface PwaSettings<TText = SettingsText> {
  name: TText;
  shortName: TText;
  description: TText;
  startUrl: string;
  scope: string;
  id: string;
  display: PwaDisplayMode;
  displayOverride?: string[];
  orientation?: PwaOrientation;
  icons?: PwaIcon[];
  screenshots?: PwaScreenshot[];
}

/* ─────────────────────────────────────────────────────────
   Interface principal – alineada a SETTINGS_PANEL_SCHEMA
   ───────────────────────────────────────────────────────── */

export default interface iSettings<TText = SettingsText> {
  /** Grupo: faculties */
  faculties?: FacultiesSettings;

  /** Grupo: company.legals / company.controller */
  company?: CompanySettings<TText>;

  /** Grupo: domain */
  domain?: DomainSettings;

  /** Grupo: agentAI */
  agentAI?: AgentAISettings;

  /** Grupo: website (+ website.theme + website.i18n) */
  website?: WebsiteSettings;

  /** Grupo: directUrls */
  directUrls?: DirectUrlRoute[];

  /** Grupo: pwa (+ pwa.icons + pwa.screenshots) */
  pwa?: PwaSettings<TText>;

  /** Grupo: more (JSON libre) */
  more?: any;

  /** Extensión dinámica para campos futuros del FUI */
  [key: string]: any;
}
