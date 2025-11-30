// complements/components/Notifications/NotificationPopupHost.tsx
"use client";

import React, { useMemo, useState } from "react";

import {
  DIV,
  SPAN,
  P,
  BUTTON,
} from "@/complements/components/ui/wrappers";

import { useUserNotifications } from "@/app/lib/notifications/hooks";
import { markNotificationAsRead } from "@/app/lib/notifications/userNotificationsClient";

function priorityWeight(priority?: string | null): number {
  switch (priority) {
    case "high":
      return 3;
    case "normal":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

type NotificationPopupHostProps = {
  className?: string;
};

export default function NotificationPopupHost({
  className,
}: NotificationPopupHostProps) {
  // Solo unread; el hook ya las ordena por fecha desc
  const { notifications } = useUserNotifications(true);

  // Para permitir “ignorar” temporalmente una notificación sin marcarla como leída
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const current = useMemo(() => {
    const candidates = notifications.filter((n) => {
      if (dismissedIds.includes(n.id)) return false;

      const ui = n.uiType ?? "badge";
      return ui === "popup" || ui === "popupAndBadge";
    });

    if (!candidates.length) return null;

    // Orden: prioridad desc, luego fecha desc (ya viene ordenado por fecha, pero reforzamos)
    const sorted = [...candidates].sort((a, b) => {
      const pa = priorityWeight(a.priority);
      const pb = priorityWeight(b.priority);
      if (pa !== pb) return pb - pa;

      const ta = a.createdAt ? a.createdAt.getTime() : 0;
      const tb = b.createdAt ? b.createdAt.getTime() : 0;
      return tb - ta;
    });

    return sorted[0];
  }, [notifications, dismissedIds]);

  if (!current) {
    return null;
  }

  const handleDismiss = () => {
    // Solo oculta en esta sesión, sin marcar como leída
    setDismissedIds((prev) =>
      prev.includes(current.id) ? prev : [...prev, current.id],
    );
  };

  const handleMarkAsRead = async () => {
    if (markingId) return;
    try {
      setMarkingId(current.id);
      await markNotificationAsRead(current.id);

      // Después de marcar como leída, ya no volverá a aparecer
      setDismissedIds((prev) =>
        prev.includes(current.id) ? prev : [...prev, current.id],
      );
    } catch (e) {
      console.error("[NotificationPopupHost] Error markAsRead", e);
    } finally {
      setMarkingId(null);
    }
  };

  const requiresConfirmation =
    current.requireReadConfirmation === true;

  return (
    <DIV
      className={[
        "fixed z-50 bottom-4 right-4 max-w-xs sm:max-w-sm md:max-w-md",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <DIV className="border border-white/15 rounded-lg bg-black/80 backdrop-blur-md shadow-lg px-4 py-3 flex flex-col gap-2">
        <DIV className="flex items-start justify-between gap-2">
          <SPAN className="text-sm font-semibold">
            {current.title || "Notificación"}
          </SPAN>
          {current.priority && (
            <SPAN className="text-[10px] px-2 py-[1px] rounded-full border border-yellow-400 text-yellow-300">
              {current.priority === "high"
                ? "Alta"
                : current.priority === "normal"
                ? "Media"
                : "Baja"}
            </SPAN>
          )}
        </DIV>

        <P className="text-xs opacity-85 whitespace-pre-wrap">
          {current.message}
        </P>

        {current.createdAt && (
          <SPAN className="text-[10px] opacity-60 mt-1">
            {current.createdAt.toLocaleString?.() ?? ""}
          </SPAN>
        )}

        <DIV className="flex items-center justify-end gap-2 mt-2">
          {/* Si requiere confirmación, no mostramos “Cerrar”, solo “Marcar como leída” */}
          {!requiresConfirmation && (
            <BUTTON
              type="button"
              kind="button"
              onClick={handleDismiss}
            >
              Cerrar
            </BUTTON>
          )}

          <BUTTON
            type="button"
            kind="button"
            onClick={handleMarkAsRead}
            disabled={markingId === current.id}
          >
            {markingId === current.id
              ? "Guardando…"
              : requiresConfirmation
              ? "He leído"
              : "Marcar como leída"}
          </BUTTON>
        </DIV>
      </DIV>
    </DIV>
  );
}
