// app/lib/notifications/client.ts
"use client";

import type { CreateNotificationInput } from "@/app/lib/notifications/types";

/**
 * Cliente simple para llamar a /api/push/send desde el browser.
 * Lo usa NotificationTriggerButton.
 */
export async function sendNotification(
  input: CreateNotificationInput,
): Promise<{ ok: boolean; successCount: number; failureCount: number }> {
  const res = await fetch("/api/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as
      | { error?: string }
      | null;
    const msg = json?.error || `HTTP ${res.status}`;
    throw new Error(`sendNotification failed: ${msg}`);
  }

  const json = (await res.json()) as {
    ok: boolean;
    successCount: number;
    failureCount: number;
  };

  return json;
}
