// functionalities/functions/notifications/registerNotificationRun.ts

import { onRequest } from "firebase-functions/v2/https";
import type { Request, Response } from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import {
  createNotificationRunOnDelivery,
  type CreateNotificationRunOnDeliveryInput,
} from "./notificationRuns.utils";

if (!getApps().length) {
  initializeApp();
}

/**
 * HTTP endpoint para registrar un NotificationRun SOLO cuando haya entrega
 * o interacción real.
 *
 * Pensado para ser llamado desde:
 *  - Service Worker (cuando muestra la notificación push).
 *  - App/PWA (cuando muestra un banner in-app o cuando el usuario interactúa).
 *
 * NO se llama desde runCampaignNow ni desde executeCampaignPush.
 */
export const registerNotificationRun = onRequest(
  async (req: Request, res: Response) => {
    // CORS básico para poder llamarlo desde la PWA / SW
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const body = req.body as Partial<CreateNotificationRunOnDeliveryInput>;

      // Validaciones mínimas
      if (!body.executionId) {
        res.status(400).json({ error: "executionId is required" });
        return;
      }
      if (!body.campaignId) {
        res.status(400).json({ error: "campaignId is required" });
        return;
      }
      if (!body.notificationId) {
        res.status(400).json({ error: "notificationId is required" });
        return;
      }
      if (!body.audienceId) {
        res.status(400).json({ error: "audienceId is required" });
        return;
      }
      if (!body.format) {
        res.status(400).json({ error: "format is required" });
        return;
      }
      if (!body.originType) {
        res.status(400).json({ error: "originType is required" });
        return;
      }

      const run = await createNotificationRunOnDelivery(
        body as CreateNotificationRunOnDeliveryInput,
      );

      res.status(200).json({
        ok: true,
        runId: run.runId,
      });
    } catch (err: any) {
      console.error("[registerNotificationRun] error:", err);
      res.status(500).json({
        error: "internal",
        message: err?.message ?? String(err),
      });
    }
  },
);
