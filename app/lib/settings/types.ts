// app/lib/settings/types.ts
import type { JSX } from 'react';

export interface SettingsRecord {
  faculties?:{
    adminPanel: boolean,
    website: boolean;
    agentAI: boolean;
    ecommerce: boolean;
    booking: boolean;
    socialmedia: boolean;
    sellsplatforms: boolean;
    products: boolean;
    services: boolean;
    contact: boolean;
    settings: boolean;
    branding: boolean;
    styles: boolean;
    maps: boolean;
    notifications?: boolean;
    paypal?: boolean;
    stripe?: boolean;
    adsense?: boolean;
  }
  company: iCompany;
  domain: iDomain;
  agentAI?: AgentAISettings;          // ← actualizado (OpenAI | Gemini)
  website: iWebsite;
  directUrls?: Record<string, string>;
  pwa?: iPWA;
  [k: string]: any;                   // extensible para cada cliente
  more?: {
    [k: string]: any;                 // espacio para futuras expansiones
  }
}

/* ---------- Compañía ---------- */
export interface iCompany {
  legals: {
    Name: string;
    TaxId?: string;
    BusinessNumber?: string;
    Email?: string;
    Phone?: string;
    Address?: string;
    mapLat?: number;
    mapLng?: number;
    placeQuery?: string;
  };
  controller: {
    Name: string;
    Email: string;
    Phone: string;
    Address: string;
  };
}

/* ---------- Domain ---------- */
export interface iDomain {
  enabled: boolean;
  url: string; // puede venir con wildcards tipo "*/example.com/*"
}

/* ---------- Agent / AI (OpenAI + Gemini) ---------- */
export type AAIProvider = 'openai' | 'gemini';
export type OpenAIEndpointMode = 'auto' | 'chat' | 'responses';

export interface AgentAIShortcutUI {
  intent: JSX.Element;                 // <FM id="..." defaultMessage="..." />
  shortcut: string;                    // clave/slug (ej. "schedule", "products")
}
export interface AgentAIIndice { [key: string]: string[]; }

export interface AgentAICommon {
  provider: AAIProvider;
  model: string;
  avatar?: string;
  temperature?: number;
  languages?: string[];
  persona?: string;
  shortcuts?: AgentAIShortcutUI[];
  indiceAI?: AgentAIIndice;
  profileMaxChars?: number;
  cacheTtlSec?: number;
}

/** OpenAI */
export interface OpenAIChatParams {
  maxTokens?: number;                  // -> max_tokens
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}
export interface OpenAIResponsesParams {
  maxOutputTokens?: number;            // -> max_output_tokens
  top_p?: number;
  stop?: string[];
}
export interface OpenAISettings extends AgentAICommon {
  provider: 'openai';
  apiMode?: OpenAIEndpointMode;        // "auto" resuelve chat vs responses
  chat?: OpenAIChatParams;             // overrides para Chat Completions
  responses?: OpenAIResponsesParams;   // overrides para Responses
  /** Compatibilidad con campos planos existentes (opcionales) */
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  max_tokens_cap?: number;
  maxTokens?: number;
}

/** Gemini */
export interface GeminiGenerationConfig {
  maxOutputTokens?: number;
  temperature?: number;                // Gemini usa camelCase
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}
export interface GeminiSettings extends AgentAICommon {
  provider: 'gemini';
  generationConfig?: GeminiGenerationConfig;
}

export type AgentAISettings = OpenAISettings | GeminiSettings;

/* ---------- Website / UI ---------- */
export interface iWebsite {
  enabled: boolean;
  url: string;
  favicon?: string;
  ogDefault?: { image: string };
  fonts?: { headings?: string; body?: string };
  theme?: Theme;
  i18n: { defaultLocale: string; supported: string[] };
}
export interface Theme {
  aliases?: {
    light: string; // nombre del tema físico que actuará como slot "light"
    dark:  string; // nombre del tema físico que actuará como slot "dark"
  };
  initialSlot: "dark" | "light"; // tema por defecto (debe estar en aliases)
  meta?: { themeColor?: { light?: string; dark?: string } };
}

/* ---------- PWA ---------- */
export interface iPWA {
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  scope: string;
  id: string;
  display: DisplayMode;
  displayOverride?: DisplayOverride[];
  orientation?: Orientation;
  icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
  screenshots?: Array<{ src: string; sizes: string; type: string; label?: string; form_factor?: 'wide' | 'narrow' }>;
};

export type DisplayMode = 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
export type DisplayOverride =
  | 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser' | 'window-controls-overlay';
export type Orientation =
  | 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary'
  | 'landscape-primary' | 'landscape-secondary';
