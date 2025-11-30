// complements/components/Notifications/NotificationsInbox.tsx
"use client";

import React, { useState } from "react";

import {
  DIV,
  SPAN,
  P,
  BUTTON,
} from "@/complements/components/ui/wrappers";

import {
  useUserNotifications,
} from "@/app/lib/notifications/hooks";

import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/app/lib/notifications/userNotificationsClient";

type NotificationsInboxProps = {
  className?: string;
  /** Si true, solo muestra unread. Si false, muestra todas (resaltando unread). */
  onlyUnread?: boolean;
};

export default function NotificationsInbox({
  className,
  onlyUnread = false,
}: NotificationsInboxProps) {
  const { notifications, loading, error } =
    useUserNotifications(onlyUnread);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const unread = notifications.filter((n) => n.status === "unread");

  const handleMarkAsRead = async (id: string) => {
    if (updatingId) return;
    try {
      setUpdatingId(id);
      await markNotificationAsRead(id);
    } catch (e) {
      console.error("[NotificationsInbox] Error markNotificationAsRead", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!unread.length || bulkLoading) return;
    try {
      setBulkLoading(true);
      await markAllNotificationsAsRead(unread.map((n) => n.id));
    } catch (e) {
      console.error("[NotificationsInbox] Error markAllNotificationsAsRead", e);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <DIV className={["flex flex-col gap-3", className ?? ""].join(" ")}>
      <DIV className="flex items-center justify-between gap-2">
        <SPAN className="text-sm font-semibold">
          Notificaciones
        </SPAN>
        <DIV className="flex items-center gap-2 text-xs">
          <SPAN className="opacity-70">
            Pendientes: {unread.length}
          </SPAN>
          <BUTTON
            type="button"
            kind="button"
            disabled={!unread.length || bulkLoading}
            onClick={handleMarkAllAsRead}
          >
            {bulkLoading ? "Marcando…" : "Marcar todas como leídas"}
          </BUTTON>
        </DIV>
      </DIV>

      {loading && notifications.length === 0 && (
        <P className="text-xs opacity-70">
          Cargando notificaciones…
        </P>
      )}

      {error && (
        <P className="text-xs text-red-400">
          Error cargando notificaciones: {error}
        </P>
      )}

      {!loading && notifications.length === 0 && !error && (
        <P className="text-xs opacity-70">
          No hay notificaciones.
        </P>
      )}

      <DIV className="flex flex-col gap-2">
        {notifications.map((n) => {
          const isUnread = n.status === "unread";
          const created =
            n.createdAt?.toLocaleString?.() ?? "(sin fecha)";

          return (
            <DIV
              key={n.id}
              className={[
                "border rounded-md px-3 py-2 bg-black/40 flex flex-col gap-1",
                isUnread ? "border-blue-400" : "border-white/15 opacity-75",
              ].join(" ")}
            >
              <DIV className="flex items-center justify-between gap-2">
                <SPAN className="font-semibold text-sm">
                  {n.title || "(sin título)"}
                </SPAN>
                <SPAN
                  className={[
                    "text-[10px] px-2 py-[1px] rounded-full border",
                    isUnread
                      ? "border-blue-400 text-blue-300"
                      : "border-gray-500 text-gray-400",
                  ].join(" ")}
                >
                  {isUnread ? "No leída" : "Leída"}
                </SPAN>
              </DIV>

              <P className="text-xs opacity-80">
                {n.message}
              </P>

              <DIV className="flex items-center justify-between mt-1">
                <SPAN className="text-[10px] opacity-60">
                  {created}
                </SPAN>

                {isUnread && (
                  <BUTTON
                    type="button"
                    kind="button"
                    onClick={() => handleMarkAsRead(n.id)}
                    disabled={updatingId === n.id}
                  >
                    {updatingId === n.id
                      ? "Marcando…"
                      : "Marcar como leída"}
                  </BUTTON>
                )}
              </DIV>
            </DIV>
          );
        })}
      </DIV>
    </DIV>
  );
}
