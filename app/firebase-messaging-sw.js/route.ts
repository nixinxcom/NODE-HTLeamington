import { NextResponse } from "next/server";

export const runtime = "nodejs"; // opcional

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
  };

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const region = "us-central1";

  // URL pública de la Cloud Function HTTP registerNotificationRun
  const registerUrl = `https://${region}-${projectId}.cloudfunctions.net/registerNotificationRun`;

  const body = `
    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

    firebase.initializeApp(${JSON.stringify(config)});

    const messaging = firebase.messaging();
    const REGISTER_URL = "${registerUrl}";

    messaging.onBackgroundMessage((payload) => {
      const n = payload.notification || {};
      const data = payload.data || {};
      const title = n.title || "";
      const options = {
        body: n.body,
        icon: n.icon || "/icon-192x192.png",
        data,
      };

      // 1) Comportamiento que ya tenías: mostrar la notificación
      self.registration.showNotification(title, options);

      // 2) NUEVO: registrar la entrega real en registerNotificationRun
      try {
        const body = {
          executionId: data.executionId,
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          strategyId: data.strategyId,
          audienceId: data.audienceId,
          notificationId: data.notificationId,
          tenantId: data.tenantId,
          locale: data.locale,
          uid: data.uid || null,
          deviceId: data.deviceId || null,
          email: data.email || null,
          originType: data.originType || "device",
          format: data.format || "push",
          deliveryStatus: "delivered",
        };

        // Validación mínima para no spamear el endpoint
        if (body.executionId && body.campaignId && body.notificationId && body.audienceId) {
          fetch(REGISTER_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }).catch(() => {
            // En un SW no queremos romper la notificación por un fallo de red
          });
        }
      } catch (e) {
        // Silenciar errores en el SW
      }
    });
  `;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
