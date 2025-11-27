// app/lib/branding/interface.ts

/** Texto genérico: string, JSX.Element, etc. */
export type BrandingText = string; // o tu UIString si quieres: string | JSX.Element

/* ─────────────────────────────────────────────────────────
   Subtipos de apoyo
   ───────────────────────────────────────────────────────── */

export interface BrandingValueItem<TText = BrandingText> {
  value: TText;
}

export interface BrandingBranch<TText = BrandingText> {
  name: TText;
  url: string;
  icon?: string;
}

export interface BrandingContactAddress {
  street?: string;
  number?: string;
  interior?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  /** latitud/longitude del schema "company.contact.address" */
  latitud?: number;
  longitude?: number;
  /** lat/lng/zoom del schema "contact.address" */
  lat?: number;
  lng?: number;
  zoom?: number;
}

export interface BrandingContact<TText = BrandingText> {
  website?: string;
  phone?: string;
  email?: string;
  googleProfileURL?: string;
  address?: BrandingContactAddress;
  whatsapp?: string;
  map?: string;
  directions?: TText;
  google?: string;
  googleMaps?: string;
}

export interface BrandingSocial<TText = BrandingText> {
  name: TText;
  url: string;
  username?: string;
  icon?: string;
}

export interface BrandingPlatform<TText = BrandingText> {
  name: TText;
  url: string;
  icon?: string;
}

export interface BrandingScheduleSlot {
  day: string;
  open?: string;
  close?: string;
  closed?: boolean;
}

export interface BrandingHoliday<TText = BrandingText> {
  name: TText;
  date: string; // ISO recomendado (YYYY-MM-DD)
}

export interface BrandingGalleryItem {
  imageUrl: string;
}

export interface BrandingProduct<TText = BrandingText> {
  prodName: TText;
  description?: TText;
  price: number;
  image?: string;
  video?: string;
  gallery?: BrandingGalleryItem[];
  url?: string;
  category?: string;
  subcategory?: string;
}

export interface BrandingService<TText = BrandingText> {
  servName: TText;
  description?: TText;
  price: number;
  image?: string;
  video?: string;
  gallery?: BrandingGalleryItem[];
  url?: string;
}

export interface BrandingEvent<TText = BrandingText> {
  eventName: TText;
  description?: TText;
  /** Fecha principal del evento (string, idealmente ISO) */
  date: string;
  startTime?: string;
  endTime?: string;
  price: number;
  image?: string;
  video?: string;
  gallery?: BrandingGalleryItem[];
  url?: string;
  category?: string;
  subcategory?: string;
}

export interface BrandingAgentAI<TText = BrandingText> {
  name?: TText;
  displayName?: TText;
  role?: TText;
  description?: TText;
  tone?: TText;
  greeting?: TText;
  farewell?: TText;
  unknown_response?: TText;
  fallback_when_unsure?: TText;
}

/* ─────────────────────────────────────────────────────────
   Interface principal: alineada al BRANDING_PANEL_SCHEMA
   ───────────────────────────────────────────────────────── */

export default interface iBranding<TText = BrandingText> {
  /* Grupo: company (schema) */
  legalName?: TText;
  brandName?: TText;
  logo?: string;
  tagline?: TText;
  contact?: BrandingContact<TText>;
  terms?: TText;
  privacy?: TText;
  mission?: TText;
  vision?: TText;
  values?: BrandingValueItem<TText>[];
  branches?: BrandingBranch<TText>[];

  // Opcional: espejo estructurado de company para código viejo que use Branding.company.*
  company?: {
    legalName?: TText;
    brandName?: TText;
    logo?: string;
    tagline?: TText;
    contact?: BrandingContact<TText>;
    terms?: TText;
    privacy?: TText;
    mission?: TText;
    vision?: TText;
    values?: BrandingValueItem<TText>[];
    branches?: BrandingBranch<TText>[];
  };

  /* Grupo: agentAI */
  agentAI?: BrandingAgentAI<TText>;

  // Alias planos para el schema actual (groupKey agentAI, name sin prefijo)
  name?: TText;
  displayName?: TText;
  role?: TText;
  description?: TText;
  tone?: TText;
  greeting?: TText;
  farewell?: TText;
  unknown_response?: TText;
  fallback_when_unsure?: TText;

  /* Grupo: socials */
  socials?: BrandingSocial<TText>[];

  /* Grupo: platforms */
  platforms?: BrandingPlatform<TText>[];

  /* Grupo: contact (ya consolidado arriba en contact/address/etc.) */
  // Los campos address.*, phone, email, whatsapp, map, directions, google, googleMaps
  // están modelados dentro de BrandingContact.

  /* Grupo: schedule */
  schedule?: BrandingScheduleSlot[];

  /* Grupo: holidays */
  holidays?: BrandingHoliday<TText>[];

  /* Grupo: products */
  products?: BrandingProduct<TText>[];

  /* Grupo: services */
  services?: BrandingService<TText>[];

  /* Grupo: events */
  events?: BrandingEvent<TText>[];

  /* Grupo: more (JSON libre) */
  more?: any;

  /** Extensión dinámica para cualquier campo nuevo que agregue FUI. */
  [key: string]: any;
}
