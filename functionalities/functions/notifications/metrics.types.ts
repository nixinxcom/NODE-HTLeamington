// functionalities/functions/src/notifications/metrics.types.ts

export type RunInteractionType = "read" | "dismiss" | "click" | "other";

export interface CampaignExecution {
  executionId: string;              // doc id
  campaignId: string;               // notificationCampaigns/<id>
  campaignName: string;
  strategyId: string;
  audienceIds: string[];
  notificationIds: string[];

  // contexto opcional
  tenantId?: string;
  locale?: string;

  // fechas de planeación de la campaña (copiadas del doc de campaign)
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;

  // subaudiencias y criterios usados en el builder
  // (guarda aquí un resumen serializado; luego lo afinamos)
  targetSubaudiencesSummary?: string[]; // ej. ["utm instagram_display...", "..."]
  targetSubaudiencesClauses?: any[];    // claúsulas completas si las quieres

  executedAt: FirebaseFirestore.Timestamp;
  scheduledFor?: FirebaseFirestore.Timestamp | null;

  // volumen
  targetedIdsCount: number;          // IDs únicos
  targetedRunsCount: number;        // IDs × notifs × canales/attempts

  // métricas agregadas (las irás llenando)
  deliveredCount: number;
  interactedCount: number;

  createdByUid?: string | null;
}

export interface NotificationRun {
  runId: string;                     // doc id
  executionId: string;              // FK a CampaignExecution
  campaignId: string;
  campaignName: string;
  strategyId: string;
  audienceId: string;               // audiencia "target" que lo generó
  notificationId: string;

  // Identificadores del receptor
  uid?: string | null;
  deviceId?: string | null;
  originType: "uid" | "device";

  // Fechas/horas de vigencia heredadas de la campaña
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;

  // Tracking / session behaviour "congelado"
  sessionTrack?: string | null;
  sessionTrigger?: string | null;
  sessionTarget?: string | null;
  sessionCategory?: string | null;
  sessionRef?: string | null;

  // UTM + nombre interno + CTA
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmId?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  utmInternalName?: string | null;   // nombre interno legible
  ctaUrls?: string[];                // URLs donde estaba el CTA

  // Tiempos de ciclo de vida
  sentAt: FirebaseFirestore.Timestamp;
  deliveredAt?: FirebaseFirestore.Timestamp | null;
  interactionType?: RunInteractionType | null;
  interactionAt?: FirebaseFirestore.Timestamp | null;

  deliveryStatus?: "pending" | "delivered" | "failed" | "unknown";
  errorCode?: string | null;
}
