// app/lib/audiences/sessionTypes.ts

export type SessionEventType = "click" | "view" | "submit";

export interface SessionEvent {
  /** timestamp en ms (Date.now()) */
  t: number;
  /** tipo de evento */
  type: SessionEventType;
  /** etiqueta única del evento, ej: "cta.buy", "menu.contact" */
  tag: string;
  /** categoría lógica, ej: "sales", "support", "nav" */
  category?: string;
  /** metadatos opcionales (productId, campaignId, etc.) */
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
