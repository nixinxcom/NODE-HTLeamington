"use client";

import React, { useState } from "react";
import {
  DIV,
  BUTTON,
} from "@/complements/components/ui/wrappers";
import { useNotificationCount } from "@/app/lib/notifications/hooks";
import NotificationsInbox from "./NotificationsInbox";

type Props = {
  className?: string;
};

/**
 * Badge global de notificaciones:
 * - Muestra campana + contador de pendientes.
 * - Al hacer click abre un dropdown con el Inbox.
 */
export default function NotificationsBadge({ className }: Props) {
  const { count, loading } = useNotificationCount();
  const [open, setOpen] = useState(false);

  const unreadCount = count ?? 0;
  const hasUnread = unreadCount > 0;

  const toggle = () => {
    if (loading) return;
    setOpen((prev) => !prev);
  };

  return (
    <DIV className={`relative ${className ?? ""}`}>
      {/* Botón de campana + burbuja */}
      <BUTTON
        type="button"
        kind="button"
        onClick={toggle}
        aria-label="Ver notificaciones"
        className="relative inline-flex items-center justify-center"
      >
        {/* Icono simple; cámbialo por el que quieras */}
        <span className="text-lg leading-none">🔔</span>

        {hasUnread && (
          <span
            className="
              absolute -top-1 -right-1
              flex items-center justify-center
              min-w-[18px] h-[18px]
              rounded-full
              bg-red-600
              text-[10px] font-semibold text-white
              px-[4px]
            "
          >
            {unreadCount}
          </span>
        )}
      </BUTTON>

      {/* Dropdown con la bandeja de notificaciones */}
      {open && (
        <DIV
          className="
            absolute right-0 mt-2
            w-[340px] max-h-[70vh]
            overflow-y-auto
            border border-white/15
            rounded-xl
            bg-black/90
            shadow-xl
            z-50
          "
        >
          <NotificationsInbox className="max-h-[70vh] overflow-y-auto" />
        </DIV>
      )}
    </DIV>
  );
}
