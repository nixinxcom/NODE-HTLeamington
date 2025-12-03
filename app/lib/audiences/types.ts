// app/lib/audiences/types.ts

export type AudienceType = 'manual' | 'ruleBased' | 'external';

export interface AudienceDoc {
  /** ID único que usarás en CampaignsCenter.audienceIds */
  audienceId: string;
  /** Nombre amigable */
  name: string;
  /** Descripción opcional */
  description?: string;

  type: AudienceType;
  source?: 'internal' | 'facebook' | 'google' | 'tiktok' | 'instagram' | 'linkedin' | 'youtube' | 'display' | 'search' | 'maps' | 'other';

  /** Audiencias manuales (listas cortas a mano) */
  userIds?: string[];

  /** Audiencias por regla (lo dejaremos como JSON libre por ahora) */
  rules?: unknown;

  /** Opcional: etiquetas para ayudar a filtrar en UI */
  track?: string;          // ej: "sales.cta.headphones"
  trackCategory?: string;  // ej: "sales", "support", "nav"
  trigger?: string;        // ej: "Promo audífonos 2x1"
  target?: string;         // ej: "headphones", "giftcards"
  tags?: string[];         // ej: ["ventas", "black-friday"]

  createdAt?: any;
  updatedAt?: any;
}

/** Lo que trae Providers/Audiences vía FdvProvider */
export type AudiencesProviderDoc = {
  audiences?: AudienceDoc[];
};
