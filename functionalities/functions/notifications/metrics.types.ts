// functionalities/functions/notifications/metrics.types.ts

// Interaction types we want to track on each notification run
export type RunInteractionType = "read" | "dismiss" | "click" | "other";

/**
 * CampaignExecution
 *  - Es el SNAPSHOT de la planificación de una campaña en el momento en que se ejecuta.
 *  - NO es un log de cada envío; para eso está NotificationRun.
 */
export interface CampaignExecution {
  /** ID del documento en campaignExecutions */
  executionId: string;

  /** Referencia a notificationCampaigns/<id> */
  campaignId: string;
  campaignName: string;

  /** Estrategia usada (Providers/Strategies) */
  strategyId: string;

  /** Audiencias “target” que participarán (Providers/Audiences.audiences[].audienceId) */
  audienceIds: string[];

  /** Notificaciones (templates) que se van a usar */
  notificationIds: string[];

  // ─────────────────────────────────────────────
  // Contexto opcional (multi-tenant, i18n)
  // ─────────────────────────────────────────────
  tenantId?: string;
  locale?: string;

  // ─────────────────────────────────────────────
  // Fechas / ventana de vigencia (copiadas de la campaña)
  // ─────────────────────────────────────────────
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;

  /** Regla de repetición (ej. "weekly", "daily", cron-like…) */
  repeatRule?: string | null;

  /** Canales / formatos planificados (ej. ["in-app", "push"]) */
  formats?: string[];

  /** Límite máximo de intentos por ID (cap de frecuencia) */
  maxAttemptsPerId?: number | null;

  // ─────────────────────────────────────────────
  // Resumen de subaudiencias / cláusulas
  // (lo que ya traes del Audience Builder)
  // ─────────────────────────────────────────────
  targetSubaudiencesSummary?: string[]; // ej: ["utm: instagram / display", "session: trigger=Promo audífonos"]
  targetSubaudiencesClauses?: any[];    // estructura completa, sin procesar

  // ─────────────────────────────────────────────
  // Tiempos de ejecución
  // ─────────────────────────────────────────────
  /** Momento real en que se ejecuta la campaña (onCall o scheduler) */
  executedAt: FirebaseFirestore.Timestamp;

  /** Momento para el que estaba programada (si aplica) */
  scheduledFor?: FirebaseFirestore.Timestamp | null;

  // ─────────────────────────────────────────────
  // Volumen planificado
  // ─────────────────────────────────────────────
  /** Número de IDs únicos target (después de deduplicar) */
  targetedIdsCount: number;

  /**
   * Máximo de “runs” que se podrían generar:
   *  targetedIdsCount × #notificaciones × #formatos × #repeticiones
   */
  targetedRunsCount: number;

  // ─────────────────────────────────────────────
  // Información de quién disparó la campaña
  // ─────────────────────────────────────────────
  createdByUid?: string | null;
}

/**
 * NotificationRun
 *  - Registro granular por ID × notificación × formato × intento.
 *  - Se crea SOLO cuando hay envío / entrega / interacción real.
 */
export interface NotificationRun {
  /** ID del documento en notificationRuns */
  runId: string;

  /** FK a CampaignExecution.executionId */
  executionId: string;

  /** FK a notificationCampaigns/<id> */
  campaignId: string;
  campaignName: string;

  /** Estrategia aplicada */
  strategyId: string;

  /** Audiencia target que originó este run */
  audienceId: string;

  /** Notificación (template) concreto */
  notificationId: string;

  // ─────────────────────────────────────────────
  // Contexto opcional (multi-tenant, i18n)
  // ─────────────────────────────────────────────
  tenantId?: string;
  locale?: string;

  // ─────────────────────────────────────────────
  // Destinatario
  // ─────────────────────────────────────────────
  uid?: string | null;
  deviceId?: string | null;
  email?: string | null;

  /** Cómo identificamos el origen del ID */
  originType?: "uid" | "device" | "email" | "anonymous" | "unknown";

  // ─────────────────────────────────────────────
  // Canal / formato y control de intentos
  // ─────────────────────────────────────────────
  /** Ej. "push", "in-app", "email", "sms"… */
  format?: string;

  /** Canal lógico si quieres diferenciar de format (opcional) */
  channel?: string;

  /** Número de intento (1, 2, 3…) */
  attempt?: number;

  /** Cap máximo para este ID (copiado de CampaignExecution.maxAttemptsPerId) */
  maxAttemptsPerId?: number | null;

  // ─────────────────────────────────────────────
  // Session behaviour "congelado" al momento del run
  // ─────────────────────────────────────────────
  sessionTrack?: string | null;
  sessionTrigger?: string | null;
  sessionTarget?: string | null;
  sessionCategory?: string | null;
  sessionRef?: string | null;

  // ─────────────────────────────────────────────
  // UTMs + nombre interno + URLs de CTA
  // ─────────────────────────────────────────────
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmId?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  /** Nombre interno de campaña / conjunto (como tú lo uses) */
  utmInternalName?: string | null;

  /** URLs donde estaba el CTA (útil para analytics posteriores) */
  ctaUrls?: string[];

  // ─────────────────────────────────────────────
  // Tiempos de ciclo de vida
  // ─────────────────────────────────────────────
  /** Momento en que se intentó enviar/mostrar */
  sentAt: FirebaseFirestore.Timestamp;

  /** Momento en que consideras “entregado” (push aceptado, banner mostrado, etc.) */
  deliveredAt?: FirebaseFirestore.Timestamp | null;

  /** Tipo de interacción (si la hubo) */
  interactionType?: RunInteractionType | null;

  /** Momento de la interacción */
  interactionAt?: FirebaseFirestore.Timestamp | null;

  // ─────────────────────────────────────────────
  // Estado de entrega
  // ─────────────────────────────────────────────
  deliveryStatus?: "pending" | "delivered" | "failed" | "unknown";
  errorCode?: string | null;
}

// ─────────────────────────────────────────────
// Detalle de planeación por notificación × formato
// (tabla dinámica de la ejecución)
// ─────────────────────────────────────────────

export interface CampaignExecutionLine {
  /** ID del doc en campaignExecutionLines */
  lineId: string;

  /** FK a campaignExecutions.executionId */
  executionId: string;

  /** Info base de campaña (copiada para facilitar queries) */
  campaignId: string;
  campaignName: string;
  strategyId: string;

  /** Notificación concreta de esta fila */
  notificationId: string;

  /** Formato / canal de entrega (ej: "push", "in-app") */
  format: string;

  /** Opcional: todos los audienceIds implicados en esta ejecución */
  audienceIds: string[];

  /** IDs únicos target (mismo número que en el header) */
  targetedIdsCount: number;

  /**
   * Cuántas veces se planea entregar ESTA notificación en ESTE formato
   * (en el periodo de vigencia de la campaña).
   * Ej: campaña semanal 4 semanas => repetitions = 4
   */
  repetitions: number;

  /**
   * Planeado para ESTA notificación × formato:
   *  targetedIdsCount × repetitions
   *
   * Si luego quieres el total por campaña:
   *  sum(plannedRuns) de todas las líneas de ese executionId.
   */
  plannedRuns: number;

  /** Cap por ID, si lo usas */
  maxAttemptsPerId?: number | null;

  /** Contexto útil para queries posteriores */
  tenantId?: string;
  locale?: string;

  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}
