// functionalities/functions/notifications/scheduledCampaignRunner.ts

import { onSchedule } from "firebase-functions/v2/scheduler";
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

// ─────────────────────────────────────────────
// Firebase Admin init
// ─────────────────────────────────────────────
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// ─────────────────────────────────────────────
// Tipos mínimos de campaña
// ─────────────────────────────────────────────

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

  // Nuevo para scheduling
  deliveryChannels?: DeliveryChannel[];
  lastExecutedAt?: Timestamp | null;
};

// ─────────────────────────────────────────────
// Helpers de fecha/hora
// ─────────────────────────────────────────────

function parseDateTime(
  dateStr?: string | null,
  timeStr?: string | null,
): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;

  const [y, m, d] = parts.map((v) => parseInt(v, 10));
  if (!y || !m || !d) return null;

  let hour = 0;
  let minute = 0;

  if (typeof timeStr === "string" && timeStr.length > 0) {
    const tParts = timeStr.split(":");
    hour = parseInt(tParts[0] ?? "0", 10) || 0;
    minute = parseInt(tParts[1] ?? "0", 10) || 0;
  }

  // Lo interpretamos como UTC; si luego quieres ajustar por locale/tenant,
  // aquí es donde se cambia.
  return new Date(Date.UTC(y, m - 1, d, hour, minute));
}

function getScheduledForTimestamp(raw: any): Timestamp | null {
  const startAt = parseDateTime(raw.startDate, raw.startTime);
  return startAt ? Timestamp.fromDate(startAt) : null;
}

// Decide si una campaña debe dispararse en este tick
function shouldRunCampaignNow(
  raw: any,
  now: Date,
): { shouldRun: boolean; reason?: string } {
  const startAt = parseDateTime(raw.startDate, raw.startTime);
  const endAt = parseDateTime(raw.endDate, raw.endTime);

  const lastExecutedAtTs = raw.lastExecutedAt;
  const lastExecutedAt: Date | null =
    lastExecutedAtTs && typeof lastExecutedAtTs.toDate === "function"
      ? lastExecutedAtTs.toDate()
      : null;

  if (!startAt) {
    return { shouldRun: false, reason: "no-startDate" };
  }

  if (startAt > now) {
    return { shouldRun: false, reason: "not-yet" };
  }

  if (endAt && now > endAt) {
    return { shouldRun: false, reason: "expired" };
  }

  // Por ahora: una sola ejecución programada.
  if (lastExecutedAt && lastExecutedAt >= startAt) {
    return { shouldRun: false, reason: "already-executed" };
  }

  // NOTA: repeatRule aún no se interpreta. En el futuro se puede ampliar aquí.
  return { shouldRun: true };
}

// ─────────────────────────────────────────────
// Core: ejecutar UNA campaña programada
// ─────────────────────────────────────────────

async function runScheduledCampaign(
  campaignRef: FirebaseFirestore.DocumentReference,
  raw: FirebaseFirestore.DocumentData,
): Promise<void> {
  const campaignId = campaignRef.id;

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
    deliveryChannels: Array.isArray(raw.deliveryChannels)
      ? raw.deliveryChannels
      : [],
  };

  const audienceIds = campaign.audienceIds ?? [];
  const notificationIds = campaign.notificationIds ?? [];

  if (!audienceIds.length || !notificationIds.length) {
    console.warn(
      `[scheduledCampaignRunner] Campaign ${campaignId} sin audiencias o notificaciones, se omite.`,
    );
    return;
  }

  // Canales efectivos: si no hay nada definido, asumimos ["inApp", "push"]
  const effectiveChannels: DeliveryChannel[] =
    campaign.deliveryChannels && campaign.deliveryChannels.length > 0
      ? campaign.deliveryChannels
      : (["inApp", "push"] as DeliveryChannel[]);

  const shouldSendPush = effectiveChannels.includes("push");
  if (!shouldSendPush) {
    console.log(
      `[scheduledCampaignRunner] Campaign ${campaignId} no incluye canal "push", se omite envío push.`,
    );
    return;
  }

  // 2) Materializar destinatarios
  const recipients: Recipient[] = await resolveRecipientsFromAudiences(
    audienceIds,
  );
  const targetedIdsCount = recipients.length;

  if (targetedIdsCount === 0) {
    console.warn(
      `[scheduledCampaignRunner] Campaign ${campaignId} tiene 0 destinatarios materializados.`,
    );
  }

  // Formatos "push" por ahora
  const formats = ["push"];
  const repetitions = 1;

  const formatCount = formats.length;
  const targetedRunsCount =
    targetedIdsCount * notificationIds.length * formatCount * repetitions;

  // 3) Crear cabecera CampaignExecution
  const execRef = db.collection("campaignExecutions").doc();
  const executionId = execRef.id;
  const executedAt = Timestamp.now();
  const scheduledFor = getScheduledForTimestamp(raw);

  const execDoc: CampaignExecution = {
    executionId,
    campaignId: campaignId,
    campaignName: campaign.name || campaignId,
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
    scheduledFor,

    targetedIdsCount,
    targetedRunsCount,

    createdByUid: "__scheduler__",
  };

  await execRef.set(execDoc);

  // 4) Crear líneas de planeación
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

  // 5) Enviar push
  const { sent, failed } = await executeCampaignPush(execDoc, recipients);

  console.log(
    `[scheduledCampaignRunner] Campaign ${campaignId} ejecutada (executionId=${executionId}) targetedIds=${targetedIdsCount}, lines=${linesCount}, sent=${sent}, failed=${failed}`,
  );

  // 6) Marcar campaña como ejecutada (una sola vez por ahora)
  await campaignRef.update({
    lastExecutedAt: executedAt,
    lastExecutionId: executionId,
    lastExecutionTrigger: "scheduler",
    ...(campaign.repeatRule ? {} : { status: "finished" }),
  });
}

// ─────────────────────────────────────────────
// Scheduler público (Cloud Function)
// ─────────────────────────────────────────────

export const scheduledCampaignRunner = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/Toronto", // ajústalo si quieres usar otra zona
  },
  async () => {
    const now = new Date();

    const snap = await db
      .collection("notificationCampaigns")
      .where("status", "==", "active")
      .get();

    if (snap.empty) {
      console.log(
        "[scheduledCampaignRunner] No hay campañas 'active' para revisar.",
      );
      return;
    }

    console.log(
      `[scheduledCampaignRunner] Revisando ${snap.size} campañas 'active' a ${now.toISOString()}`,
    );

    for (const docSnap of snap.docs) {
      const raw = docSnap.data();
      const { shouldRun, reason } = shouldRunCampaignNow(raw, now);

      if (!shouldRun) {
        if (reason && reason !== "not-yet") {
          console.log(
            `[scheduledCampaignRunner] Campaign ${docSnap.id} no se ejecuta ahora (reason=${reason}).`,
          );
        }
        continue;
      }

      try {
        await runScheduledCampaign(docSnap.ref, raw);
      } catch (err) {
        console.error(
          `[scheduledCampaignRunner] Error ejecutando campaign ${docSnap.id}`,
          err,
        );
        await docSnap.ref.update({
          lastExecutionError: (err as Error).message ?? String(err),
          lastExecutionErrorAt: Timestamp.now(),
        });
      }
    }
  },
);
