// app/lib/notifications/types.ts

// A quién se manda
export type NotificationTarget =
  | { type: "token"; token: string }
  | { type: "user"; uid: string }
  | { type: "broadcast" }; // all tokens activos del tenant

// Payload compatible con lo que arma route.ts
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  clickAction?: string; // URL para webpush.fcmOptions.link
}

/**
 * Input que espera /api/push/send
 */
export interface CreateNotificationInput {
  target: NotificationTarget;
  payload: NotificationPayload;
}
