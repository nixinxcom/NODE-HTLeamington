// complements/components/Notifications/NotificationTriggerButton.tsx
"use client";

import React, { useState } from "react";
import { BUTTON, SPAN } from "@/complements/components/ui/wrappers";
import { sendNotification } from "@/app/lib/notifications/client";
import type { CreateNotificationInput } from "@/app/lib/notifications/types";

type Props = {
  /** Texto del botón */
  label?: string;
  /**
   * Factory que construye el CreateNotificationInput
   * (target + payload: title, body, data, etc.)
   */
  buildInput: () => CreateNotificationInput;
  className?: string;
};

export default function NotificationTriggerButton({
  label = "Enviar notificación",
  buildInput,
  className,
}: Props) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleClick = async () => {
    if (sending) return;

    setError(null);
    setResult(null);
    setSending(true);

    try {
      const input = buildInput();
      const res = await sendNotification(input);
      setResult(`${res.successCount} ok / ${res.failureCount} error(es)`);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={className}>
      <BUTTON onClick={handleClick} disabled={sending}>
        {sending ? "Enviando…" : label}
      </BUTTON>

      {error && (
        <SPAN className="text-xs text-red-500 ml-2">
          {error}
        </SPAN>
      )}

      {result && !error && (
        <SPAN className="text-xs text-green-500 ml-2">
          {result}
        </SPAN>
      )}
    </div>
  );
}
