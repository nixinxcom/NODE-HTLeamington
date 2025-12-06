// functionalities/functions/notifications/executeCampaignPush.ts

import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import type { CampaignExecution } from "./metrics.types";
import type { Recipient } from "./resolveRecipientsFromAudiences";

const db = getFirestore();

/**
 * Envía las notificaciones de una CampaignExecution vía FCM.
 *
 * IMPORTANTE:
 *  - NO crea NotificationRuns.
 *  - Solo envía push a los deviceId que tengan token activo.
 *  - El registro detallado (NotificationRun) se debe hacer
 *    desde el Service Worker / app cuando se muestre o se interactúe.
 */
export async function executeCampaignPush(
  execution: CampaignExecution,
  recipients: Recipient[],
): Promise<{ sent: number; failed: number }> {
  if (!recipients.length) return { sent: 0, failed: 0 };

  const messaging = getMessaging();
  let sent = 0;
  let failed = 0;

  // Cargar notificaciones definidas en Providers/Notifications
  const notifSnap = await db.collection("Providers").doc("Notifications").get();
  const notifData = notifSnap.data() || {};
  const allNotifications: any[] = Array.isArray(notifData.notifications)
    ? notifData.notifications
    : [];

  // Resolver notificaciones que correspondan a esta ejecución
  const notifications = allNotifications.filter((n: any) =>
    (execution.notificationIds || []).includes(n.notificationId),
  );

  if (!notifications.length) {
    console.warn(
      `[executeCampaignPush] No notifications found for execution ${execution.executionId}`,
    );
    return { sent: 0, failed: 0 };
  }

  // Solo recipients con deviceId pueden recibir push
  const targets = recipients.filter((r) => !!r.deviceId);

  for (const notif of notifications) {
    const title = notif.title ?? "NIXINX";
    const body = notif.body ?? "";
    const baseData: Record<string, string> =
      (notif.data as Record<string, string>) ?? {};

    for (const r of targets) {
      if (!r.deviceId) continue;

      try {
        // Buscar token activo para ese deviceId en el tenant
        const tokenSnap = await db
          .collection("tenants")
          .doc(execution.tenantId || "__default__")
          .collection("notificationTokens")
          .where("deviceId", "==", r.deviceId)
          .where("active", "==", true)
          .limit(1)
          .get();

        if (tokenSnap.empty) continue;
        const token = tokenSnap.docs[0].get("token") as string | undefined;
        if (!token) continue;

        // Data que viajará al Service Worker para registrar el NotificationRun
        const data: Record<string, string> = {
          ...baseData,
          executionId: execution.executionId,
          campaignId: execution.campaignId,
          campaignName: execution.campaignName,
          strategyId: execution.strategyId,
          audienceId: r.originAudienceId,
          notificationId: notif.notificationId,
          tenantId: execution.tenantId ?? "__default__",
          locale: execution.locale ?? "en",
          uid: r.uid ?? "",
          deviceId: r.deviceId ?? "",
          email: r.email ?? "",
          originType: r.originType,
          format: "push",
        };

        // Enviar push
        await messaging.send({
          token,
          notification: {
            title,
            body,
          },
          data,
          webpush: notif.clickAction
            ? { fcmOptions: { link: notif.clickAction } }
            : undefined,
        });

        sent++;
      } catch (err) {
        failed++;
        console.error("[executeCampaignPush] error sending push", err);
      }
    }
  }

  return { sent, failed };
}
