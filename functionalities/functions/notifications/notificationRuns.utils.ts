// functionalities/functions/notifications/notificationRuns.utils.ts

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import type { NotificationRun } from "./metrics.types";

const db = getFirestore();

export type CreateNotificationRunOnDeliveryInput = {
  // Contexto de campaña / ejecución
  executionId: string;
  campaignId: string;
  campaignName: string;
  strategyId: string;
  audienceId: string;
  notificationId: string;

  tenantId?: string;
  locale?: string;

  // Destinatario: usa uno de estos (idealmente uid o deviceId)
  uid?: string;
  deviceId?: string;
  email?: string;

  originType: "uid" | "device" | "email" | "anonymous" | "unknown";

  // Canal / formato
  /** ej: "push", "in-app" */
  format: string;
  /** opcional, por si quieres diferenciar canal lógico */
  channel?: string;

  // Control de intentos (si aplicas retry por usuario)
  attempt?: number;
  maxAttemptsPerId?: number | null;

  // Session behaviour “congelado” (si aplica)
  sessionTrack?: string | null;
  sessionTrigger?: string | null;
  sessionTarget?: string | null;
  sessionCategory?: string | null;
  sessionRef?: string | null;

  // UTM “congelado”
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmId?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  utmInternalName?: string | null;

  // URLs del CTA, si las conoces en el momento de entrega
  ctaUrls?: string[];

  /**
   * Si quieres marcar explícitamente el estado de entrega:
   *  - "delivered": FCM aceptó / in-app mostrado.
   *  - "failed": si llegas aquí en un contexto de fallo (normalmente NO deberías).
   */
  deliveryStatus?: "delivered" | "failed" | "pending" | "unknown";
};

/**
 * Crea un NotificationRun SOLO cuando tenemos una entrega real:
 *  - Push: después de que FCM responda OK (no cuando falla).
 *  - In-app: justo cuando se muestra la notificación al usuario.
 *
 * No se crea nada para intentos fallidos antes de la entrega → no quemas writes inútiles.
 */
export async function createNotificationRunOnDelivery(
  input: CreateNotificationRunOnDeliveryInput,
): Promise<NotificationRun> {
  const {
    executionId,
    campaignId,
    campaignName,
    strategyId,
    audienceId,
    notificationId,
    tenantId,
    locale,
    uid,
    deviceId,
    email,
    originType,
    format,
    channel,
    attempt = 1,
    maxAttemptsPerId = null,
    sessionTrack = null,
    sessionTrigger = null,
    sessionTarget = null,
    sessionCategory = null,
    sessionRef = null,
    utmSource = null,
    utmMedium = null,
    utmCampaign = null,
    utmId = null,
    utmTerm = null,
    utmContent = null,
    utmInternalName = null,
    ctaUrls = [],
    deliveryStatus = "delivered",
  } = input;

  // Seguridad mínima: al menos uno de uid / deviceId / email
  if (!uid && !deviceId && !email) {
    throw new Error(
      "[createNotificationRunOnDelivery] Se requiere al menos uid, deviceId o email",
    );
  }

  const runsCol = db.collection("notificationRuns");
  const docRef = runsCol.doc();
  const now = Timestamp.now();

  const run: NotificationRun = {
    runId: docRef.id,

    executionId,
    campaignId,
    campaignName,
    strategyId,
    audienceId,
    notificationId,

    tenantId,
    locale,

    uid: uid ?? null,
    deviceId: deviceId ?? null,
    email: email ?? null,
    originType,

    format,
    channel,
    attempt,
    maxAttemptsPerId,

    sessionTrack,
    sessionTrigger,
    sessionTarget,
    sessionCategory,
    sessionRef,

    utmSource,
    utmMedium,
    utmCampaign,
    utmId,
    utmTerm,
    utmContent,
    utmInternalName,

    ctaUrls,

    // Entrega efectiva: asumimos que si llamaste a esta función,
    // es porque fue enviada/mostrada.
    sentAt: now,
    deliveredAt: now,
    deliveryStatus,

    interactionType: null,
    interactionAt: null,
    errorCode: null,
  };

  await docRef.set(run);

  return run;
}

/**
 * Actualiza un NotificationRun cuando hay interacción del usuario:
 *  - click, read, dismiss, etc.
 *
 * No crea un run nuevo → solo muta el existente.
 */
export async function markNotificationRunInteraction(params: {
  runId: string;
  interactionType: NotificationRun["interactionType"];
}): Promise<void> {
  const { runId, interactionType } = params;
  const runsCol = db.collection("notificationRuns");
  const ref = runsCol.doc(runId);

  const now = Timestamp.now();

  await ref.update({
    interactionType: interactionType ?? null,
    interactionAt: interactionType ? now : null,
  });
}
