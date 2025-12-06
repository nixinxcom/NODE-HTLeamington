// app/lib/audiences/types.ts

export type AudienceType = 'manual' | 'ruleBased' | 'external';

export interface UtmInfo {
  /** utm_source: de dónde viene el tráfico (google, facebook, newsletter, etc.) */
  utmstring?: string;

  /** utm_source: de dónde viene el tráfico (google, facebook, newsletter, etc.) */
  source?: string;

  /** utm_medium: tipo de canal (cpc, social, email, referral, etc.) */
  medium?: string;

  /** utm_campaign: nombre de la campaña */
  campaign?: string;

  /** utm_term: palabra clave (si aplica) */
  term?: string;

  /** utm_content: variante creativa (banner_a, video_15s, etc.) */
  content?: string;

  /** crudo completo por si quieres guardarlo tal cual llegó */
  raw?: string; // ej: "utm_source=google&utm_medium=cpc&utm_campaign=promo_tacos"
}

export interface AudienceDoc {
  /** ID único que usarás en CampaignsCenter.audienceIds */
  audienceId: string;
  /** Nombre amigable */
  name: string;
  /** Descripción opcional */
  description?: string;

  type: AudienceType;
  source?:
    | 'internal'
    | 'facebook'
    | 'google'
    | 'tiktok'
    | 'instagram'
    | 'linkedin'
    | 'youtube'
    | 'display'
    | 'search'
    | 'maps'
    | 'other';

  /** Audiencias manuales (listas cortas a mano) */
  userIds?: string[];

  /** Audiencias por regla (lo dejaremos como JSON libre por ahora) */
  rules?: unknown;

  /** Opcional: etiquetas para ayudar a filtrar en UI / reporting */
  track?: string;          // ej: "sales.cta.headphones"
  trackCategory?: string;  // ej: "sales", "support", "nav"
  trigger?: string;        // ej: "Promo audífonos 2x1"
  target?: string;         // ej: "headphones", "giftcards"

  /**
   * Información UTM asociada a esta audiencia.
   * Ej: utm_source=google, utm_medium=cpc, utm_campaign=promo_tacos, etc.
   */
  utm?: UtmInfo;

  tags?: string[];         // ej: ["ventas", "black-friday"]

  createdAt?: any;
  updatedAt?: any;
}

/** Lo que trae Providers/Audiences vía FdvProvider */
export type AudiencesProviderDoc = {
  audiences?: AudienceDoc[];
};
