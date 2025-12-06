// functionalities/functions/notifications/runCampaignNow.ts

import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import type {
  CampaignExecution,
  CampaignExecutionLine,
} from "./metrics.types";
import {
  resolveRecipientsFromAudiences,
  type Recipient,
} from "./resolveRecipientsFromAudiences";
import { executeCampaignPush } from "./executeCampaignPush";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

type DeliveryChannel = "inApp" | "push" | "email" | "sms";

type NotificationCampaign = {
  id: string;
  name?: string;
  strategyId: string;
  audienceIds?: string[];
  notificationIds?: string[];

  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;

  targetSubaudiencesSummary?: string[];
  targetSubaudiencesClauses?: any[];

  repeatRule?: string | null;
  maxAttemptsPerId?: number | null;
  tenantId?: string;
  locale?: string;

  deliveryChannels?: DeliveryChannel[];
};

type RunCampaignPayload = {
  campaignId: string;
};

type RunCampaignResult = {
  executionId: string;
  targetedIdsCount: number;
  targetedRunsCount: number;
  lines: number;
  sent: number;
  failed: number;
};

/**
 * runCampaignNow
 *
 * 1) Lee la campaña de notificationCampaigns/<id>.
 * 2) Materializa IDs únicos desde Providers/Audiences (+ AudienceMembers).
 * 3) Crea campaignExecutions + campaignExecutionLines (snapshot de planeación).
 * 4) Llama a executeCampaignPush para enviar push (por ahora solo "push").
 *
 * IMPORTANTE:
 *  - NO crea NotificationRuns aquí.
 *  - Los NotificationRuns deben crearse SOLO cuando haya entrega/visualización
 *    real desde el Service Worker o la app (vía endpoint separado).
 */
export const runCampaignNow = onCall(
  async (
    req: CallableRequest<RunCampaignPayload>,
  ): Promise<RunCampaignResult> => {
    const { campaignId } = req.data || {};
    const uid = req.auth?.uid ?? null;

    if (!campaignId) {
      throw new HttpsError("invalid-argument", "campaignId is required");
    }

    // 1) Leer campaña
    const campRef = db.collection("notificationCampaigns").doc(campaignId);
    const campSnap = await campRef.get();
    if (!campSnap.exists) {
      throw new HttpsError("not-found", "Campaign not found");
    }

    const raw = campSnap.data() || {};
    const campaign: NotificationCampaign = {
      id: campaignId,
      name: raw.name,
      strategyId: raw.strategyId,
      audienceIds: Array.isArray(raw.audienceIds) ? raw.audienceIds : [],
      notificationIds: Array.isArray(raw.notificationIds)
        ? raw.notificationIds
        : [],
      startDate: raw.startDate ?? null,
      endDate: raw.endDate ?? null,
      startTime: raw.startTime ?? null,
      endTime: raw.endTime ?? null,
      targetSubaudiencesSummary: raw.targetSubaudiencesSummary ?? [],
      targetSubaudiencesClauses: raw.targetSubaudiencesClauses ?? [],
      repeatRule: raw.repeatRule ?? null,
      maxAttemptsPerId:
        typeof raw.maxAttemptsPerId === "number" ? raw.maxAttemptsPerId : null,
      tenantId: raw.tenantId,
      locale: raw.locale,
    };

    const audienceIds = campaign.audienceIds ?? [];
    const notificationIds = campaign.notificationIds ?? [];

    if (!audienceIds.length || !notificationIds.length) {
      throw new HttpsError(
        "failed-precondition",
        "Campaign must have at least one audience and one notification",
      );
    }

    // 2) Materializar IDs únicos desde audiencias (deduplicado)
    const recipients: Recipient[] = await resolveRecipientsFromAudiences(
      audienceIds,
    );
    const targetedIdsCount = recipients.length;

    if (targetedIdsCount === 0) {
      console.warn(
        `[runCampaignNow] Campaign ${campaignId} tiene 0 destinatarios materializados.`,
      );
    }

    // Por ahora:
    //  - sólo respetamos el canal "push" a nivel envío real
    //  - pero usamos deliveryChannels de la campaña para decidir si se manda push

    const effectiveChannels: DeliveryChannel[] =
      Array.isArray(campaign.deliveryChannels) &&
      campaign.deliveryChannels.length > 0
        ? campaign.deliveryChannels
        : ["inApp", "push"]; // default para campañas viejas

    const shouldSendPush = effectiveChannels.includes("push");

    const formats = shouldSendPush ? ["push"] : [];
    const repetitions = 1;

    const formatCount = formats.length;
    const targetedRunsCount =
      targetedIdsCount * notificationIds.length * formatCount * repetitions;

    // 3) Crear cabecera CampaignExecution
    const execRef = db.collection("campaignExecutions").doc();
    const executionId = execRef.id;
    const executedAt = Timestamp.now();

    const execDoc: CampaignExecution = {
      executionId,
      campaignId: campaign.id,
      campaignName: campaign.name || campaign.id,
      strategyId: campaign.strategyId,
      audienceIds,
      notificationIds,

      tenantId: campaign.tenantId || "__default__",
      locale: campaign.locale || "en",

      startDate: campaign.startDate ?? null,
      endDate: campaign.endDate ?? null,
      startTime: campaign.startTime ?? null,
      endTime: campaign.endTime ?? null,
      repeatRule: campaign.repeatRule ?? null,
      formats,
      maxAttemptsPerId: campaign.maxAttemptsPerId ?? null,

      targetSubaudiencesSummary: campaign.targetSubaudiencesSummary ?? [],
      targetSubaudiencesClauses: campaign.targetSubaudiencesClauses ?? [],

      executedAt,
      scheduledFor: null,

      targetedIdsCount,
      targetedRunsCount,

      createdByUid: uid,
    };

    await execRef.set(execDoc);

    // 3b) Crear líneas de planeación por notificación × formato
    const linesCol = db.collection("campaignExecutionLines");
    const batch = db.batch();
    let linesCount = 0;

    for (const notificationId of notificationIds) {
      for (const format of formats) {
        const lineRef = linesCol.doc();
        const line: CampaignExecutionLine = {
          lineId: lineRef.id,
          executionId,
          campaignId: execDoc.campaignId,
          campaignName: execDoc.campaignName,
          strategyId: execDoc.strategyId,

          notificationId,
          format,

          audienceIds: execDoc.audienceIds,
          targetedIdsCount,
          repetitions,

          plannedRuns: targetedIdsCount * repetitions,

          maxAttemptsPerId: execDoc.maxAttemptsPerId ?? null,

          tenantId: execDoc.tenantId,
          locale: execDoc.locale,

          startDate: execDoc.startDate ?? null,
          endDate: execDoc.endDate ?? null,
          startTime: execDoc.startTime ?? null,
          endTime: execDoc.endTime ?? null,
        };

        batch.set(lineRef, line);
        linesCount++;
      }
    }

    await batch.commit();

    let sent = 0;
    let failed = 0;

    // 4) Enviar push SOLO si la campaña tiene canal "push"
    if (formats.includes("push")) {
      // OJO: executeCampaignPush YA NO crea NotificationRuns.
      const res = await executeCampaignPush(execDoc, recipients);
      sent = res.sent;
      failed = res.failed;
    } else {
      console.log(
        `[runCampaignNow] Campaign ${campaignId} sin canal "push" seleccionado. No se envían push.`,
      );
    }

    return {
      executionId,
      targetedIdsCount,
      targetedRunsCount,
      lines: linesCount,
      sent,
      failed,
    };
  },
);
