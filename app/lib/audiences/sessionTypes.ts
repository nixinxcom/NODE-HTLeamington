// app/lib/audiences/sessionTypes.ts

import type {
  BehaviorCategory,
  BehaviorDomain,
  BehaviorEventType,
} from "./behavior.catalog";

export type SessionEventType = BehaviorEventType;

export interface SessionEvent {
  /** timestamp en ms (Date.now()) */
  t: number;
  /** tipo de evento (view, click, submit, play, etc.) */
  type: SessionEventType;
  /** etiqueta lógica del evento, ej: "home.hero.cta", "menu.contact" */
  tag: string;
  /** Category: impacto / intención (revenue, customer_acquisition, etc.) */
  category?: BehaviorCategory;
  /** Trigger: tipo de acción que detonó el evento */
  trigger?: BehaviorEventType;
  /** Target: dominio / área (navigation, content, commerce, etc.) */
  target?: BehaviorDomain;
  /** Metadatos opcionales (productId, campaignId, etc.) */
  meta?: Record<string, unknown>;
}

export type SessionUtmInfo = {
  id?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export interface SessionBehavior {
  sessionId: string;
  tenantId: string;
  userId: string | null;
  deviceId: string | null;
  userOrDeviceId: string | null;
  locale?: string;
  utm: SessionUtmInfo | null;

  /** Eventos detallados de la sesión (histórico fino) */
  events: SessionEvent[];

  /**
   * Claves normalizadas de comportamiento para segmentar en Firestore
   * Formato: `${type}::${tag ?? ""}::${category ?? ""}`
   *
   * Ejemplos:
   *  "view::::home"
   *  "click::cta_hero::landing"
   *  "conversion::order::::"
   */
  behaviorKeys: string[];
}
