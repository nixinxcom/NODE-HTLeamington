// functionalities/functions/notifications/applyCampaign.ts

import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, WriteBatch } from "firebase-admin/firestore";
import type { CampaignExecution, NotificationRun } from "./metrics.types";

// Inicializar admin una vez
initializeApp();
const db = getFirestore();

/** Tipo mínimo de la campaña en notificationCampaigns */
type NotificationCampaign = {
  id: string;
  name?: string;
  strategyId: string;
  audienceIds?: string[];
  notificationIds?: string[];
  // campos de fechas que ya traes en tus docs de campañas
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  // resumen de subaudiencias (lo que ya tengas en el doc)
  targetSubaudiencesSummary?: string[];
  targetSubaudiencesClauses?: any[];
};

/** Receptor final de una notificación */
type Recipient = {
  uid?: string;
  deviceId?: string;
  originType: "uid" | "device";
  audienceId: string;

  // tracking / behaviour en el momento de construir la audiencia
  sessionTrack?: string | null;
  sessionTrigger?: string | null;
  sessionTarget?: string | null;
  sessionCategory?: string | null;

  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmId?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  utmInternalName?: string | null;
  ctaUrls?: string[];
};

/**
 * TODO: por ahora stub que devuelve [].
 * Después lo conectamos a tu modelo real de Audiences / AudienceMembers.
 */
async function resolveRecipientsFromAudiences(
  audienceIds: string[],
): Promise<Recipient[]> {
  if (!audienceIds || audienceIds.length === 0) {
    return [];
  }

  // Aquí luego:
  // - Leer Providers/Audiences kind="target"
  // - Leer Providers/AudienceMembers/<audienceId>/users
  // - Mapear a Recipient[]
  // De momento vacío para que compile.
  return [];
}

/**
 * applyCampaignToAudience
 * Se llama desde el Campaign Center para ejecutar una campaña contra audiencias target.
 */
export const applyCampaignToAudience = onCall(
  async (req: CallableRequest<{ campaignId: string }>) => {
    const { campaignId } = req.data || {};
    const uid = req.auth?.uid ?? null;

    if (!campaignId) {
      throw new HttpsError("invalid-argument", "campaignId is required");
    }

    // 1) Leer campaña de notificationCampaigns
    const campRef = db.collection("notificationCampaigns").doc(campaignId);
    const campSnap = await campRef.get();
    if (!campSnap.exists) {
      throw new HttpsError("not-found", "Campaign not found");
    }

    const raw = campSnap.data() || {};
    const campaign: NotificationCampaign = {
      id: campSnap.id,
      name: raw.name,
      strategyId: raw.strategyId,
      audienceIds: raw.audienceIds ?? [],
      notificationIds: raw.notificationIds ?? [],
      startDate: raw.startDate ?? null,
      endDate: raw.endDate ?? null,
      startTime: raw.startTime ?? null,
      endTime: raw.endTime ?? null,
      targetSubaudiencesSummary: raw.targetSubaudiencesSummary ?? [],
      targetSubaudiencesClauses: raw.targetSubaudiencesClauses ?? [],
    };

    // 2) Resolver recipients (IDs) a partir de audienceIds
    const recipients = await resolveRecipientsFromAudiences(
      campaign.audienceIds ?? [],
    );

    const targetedIdsCount = recipients.length;
    const notificationIds = campaign.notificationIds ?? [];

    // 3) Crear CampaignExecution
    const execRef = db.collection("campaignExecutions").doc();
    const executionId = execRef.id;

    const executedAt = Timestamp.now();

    const execDoc: CampaignExecution = {
      executionId,
      campaignId: campaign.id,
      campaignName: campaign.name ?? campaign.id,
      strategyId: campaign.strategyId,
      audienceIds: campaign.audienceIds ?? [],
      notificationIds,
      executedAt,
      scheduledFor: null,
      targetedIdsCount,
      targetedRunsCount: targetedIdsCount * notificationIds.length,
      deliveredCount: 0,
      interactedCount: 0,
      startDate: campaign.startDate ?? null,
      endDate: campaign.endDate ?? null,
      startTime: campaign.startTime ?? null,
      endTime: campaign.endTime ?? null,
      targetSubaudiencesSummary: campaign.targetSubaudiencesSummary ?? [],
      targetSubaudiencesClauses: campaign.targetSubaudiencesClauses ?? [],
      createdByUid: uid,
    };

    await execRef.set(execDoc);

    // 4) Fan-out: crear NotificationRuns
    const batch: WriteBatch = db.batch();
    let deliveredCount = 0;

    for (const r of recipients) {
      for (const notifId of notificationIds) {
        const runRef = db.collection("notificationRuns").doc();
        const runId = runRef.id;

        const runDoc: NotificationRun = {
          runId,
          executionId,
          campaignId: campaign.id,
          campaignName: campaign.name ?? campaign.id,
          strategyId: campaign.strategyId,
          audienceId: r.audienceId,
          notificationId: notifId,
          uid: r.uid ?? null,
          deviceId: r.deviceId ?? null,
          originType: r.originType,

          startDate: campaign.startDate ?? null,
          endDate: campaign.endDate ?? null,
          startTime: campaign.startTime ?? null,
          endTime: campaign.endTime ?? null,

          sessionTrack: r.sessionTrack ?? null,
          sessionTrigger: r.sessionTrigger ?? null,
          sessionTarget: r.sessionTarget ?? null,
          sessionCategory: r.sessionCategory ?? null,
          sessionRef: null,

          utmSource: r.utmSource ?? null,
          utmMedium: r.utmMedium ?? null,
          utmCampaign: r.utmCampaign ?? null,
          utmId: r.utmId ?? null,
          utmTerm: r.utmTerm ?? null,
          utmContent: r.utmContent ?? null,
          utmInternalName: r.utmInternalName ?? null,
          ctaUrls: r.ctaUrls ?? [],

          sentAt: executedAt,
          deliveredAt: executedAt,
          interactionType: null,
          interactionAt: null,
          deliveryStatus: "delivered",
          errorCode: null,
        };

        batch.set(runRef, runDoc);
        deliveredCount++;
      }
    }

    if (deliveredCount > 0) {
      await batch.commit();
    }

    // 5) Actualizar contadores básicos en CampaignExecution
    await execRef.update({
      deliveredCount,
    });

    return {
      executionId,
      targetedIdsCount,
      deliveredCount,
    };
  },
);
