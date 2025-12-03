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
  /** ID de esta sesión lógica (cambia cada flush) */
  sessionId: string;
  /** Tenant NIXINX */
  tenantId: string;
  /** UID de Firebase Auth (si existe) */
  userId?: string | null;
  /** ID persistente del dispositivo (no requiere login) */
  deviceId?: string | null;
  /** Clave unificada para audiencias: userId || deviceId */
  userOrDeviceId?: string | null;
  /** Locale con el que navegó */
  locale?: string;
  /** UTM detectada al inicio de la sesión */
  utm?: SessionUtmInfo | null;
  /** Eventos registrados durante la sesión */
  events: SessionEvent[];
}
