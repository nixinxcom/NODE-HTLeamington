export type DisplayMode = 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
export type DisplayOverride =
  | 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser' | 'window-controls-overlay';
export type Orientation =
  | 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary'
  | 'landscape-primary' | 'landscape-secondary';

/** ===== AAI (OpenAI + Gemini) tipos unificados ===== */
export type AAIProvider = 'openai' | 'gemini';
export type OpenAIEndpointMode = 'auto' | 'chat' | 'responses';

export type OpenAIChatModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | (string & { __openaiChat?: true });

export type OpenAIResponsesModel =
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'o4'
  | 'o4-mini'
  | (string & { __openaiResponses?: true });

export type OpenAIModel = OpenAIChatModel | OpenAIResponsesModel;

export type GeminiModel =
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-1.0-pro'
  | (string & { __gemini?: true });


export interface AgentAIIndice { [key: string]: string[]; }

export interface AgentAICommon {
  provider: AAIProvider;
  model: string;              // permite cualquier string; arriba hay unions guía
  avatar?: string;
  temperature?: number;
  languages?: string[];
  persona?: string;
  /** <-- Ajuste: admite arreglo o { items: [...] } */
  indiceAI?: AgentAIIndice;
  profileMaxChars?: number;
  cacheTtlSec?: number;
}

/** OpenAI params */
export interface OpenAIChatParams {
  maxTokens?: number;         // -> max_tokens
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}
export interface OpenAIResponsesParams {
  maxOutputTokens?: number;   // -> max_output_tokens
  top_p?: number;
  stop?: string[];
}
export interface OpenAISettings extends AgentAICommon {
  provider: 'openai';
  model: OpenAIModel | string;
  apiMode?: OpenAIEndpointMode;   // "auto" resuelve chat vs responses
  chat?: OpenAIChatParams;        // overrides para Chat Completions
  responses?: OpenAIResponsesParams; // overrides para Responses
  /** Compatibilidad con campos planos existentes (no obligatorios) */
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  max_tokens_cap?: number;
  maxTokens?: number;
}

/** Gemini params */
export interface GeminiGenerationConfig {
  maxOutputTokens?: number;
  temperature?: number;       // Gemini usa camelCase
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}
export interface GeminiSettings extends AgentAICommon {
  provider: 'gemini';
  model: GeminiModel | string;
  generationConfig?: GeminiGenerationConfig;
}

export type AgentAISettings = OpenAISettings | GeminiSettings;

/** ===== iSettings ===== */
export default interface iSettings {
  faculties?: {
    adminPanel: boolean;
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
    notifications: boolean;
    paypal?: boolean;
    stripe?: boolean;
    adsense?: boolean;
  };
  company: {
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
  };
  domain: {
    enabled: boolean;
    url: string;
  };
  /** <-- Reemplazo: ahora admite OpenAI y Gemini con parámetros correctos */
  agentAI: AgentAISettings;
  website: {
    url: string;
    favicon: string;
    ogDefault: { image: string };
    fonts: { headings: string; body: string };
    theme: {
      aliases?: {
        light: 'light' | string; /** nombre del tema físico que actuará como slot "light" */
        dark:  'dark'  | string; /** nombre del tema físico que actuará como slot "dark" */
      };
      initialSlot: 'dark' | 'light'; // tema por defecto (debe estar en aliases)
      meta?: { themeColor?: { light?: string; dark?: string } }; // para <meta name="theme-color"/>
    };
    i18n: { defaultLocale: string; supported: string[] };
  };
  directUrls: Record<string, string>;
  pwa: {
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
  more?: {
    [k: string]: any;  // espacio para futuras expansiones
  };
}
