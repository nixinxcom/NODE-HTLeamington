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

export interface SessionBehavior {
  /** identificador lógico de la sesión en NIXINX */
  sessionId: string;
  /** tenant al que pertenece la sesión */
  tenantId: string;
  /** uid de Firebase si aplica (opcional) */
  userId?: string;
  /** locale corto (es/en/fr, etc.) */
  locale?: string;
  /** lista de eventos generados en la sesión */
  events: SessionEvent[];
}
