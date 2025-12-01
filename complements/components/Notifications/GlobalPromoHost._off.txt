"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useProvider } from "@/app/providers/FdvProvider";

import {
  DIV,
  H3,
  P,
  BUTTON,
  A,
} from "@/complements/components/ui/wrappers";

type NotificationConfig = {
  notificationId: string;
  enabled?: boolean;
  title?: string;
  message?: string;
  description?: string;
  callToActionURL?: string;
  userInterfaceType?: "popup" | "badge" | "popupAndBadge";
  deliveryChannel?: "inApp" | "push" | "both";

  // de tu schema:
  targetAudienceType?:
    | "allUsers"
    | "authenticated"
    | "byRole"
    | "bySegment"
    | "byUserId";

  sendDate?: string | null;   // Firestore date → se serializa como string/ISO
  expireDate?: string | null;
};

type NotificationsProviderDoc = {
  notifications?: NotificationConfig[];
};

function storageKey(id: string) {
  return `nx.globalPromo.seen.${id}`;
}

function parseDate(input?: any): Date | null {
  if (!input) return null;
  // soporta Timestamp (toDate) o string ISO
  if (typeof input === "object" && typeof input.toDate === "function") {
    return input.toDate();
  }
  if (typeof input === "string") {
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function isWithinWindow(n: NotificationConfig, now: Date): boolean {
  const start = parseDate(n.sendDate);
  const end = parseDate(n.expireDate);

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

export default function GlobalPromoHost() {
  const { value: notificationsDoc } =
    useProvider<NotificationsProviderDoc>("notifications");

  const [openId, setOpenId] = useState<string | null>(null);

  const candidates = useMemo(() => {
    const list = notificationsDoc?.notifications ?? [];

    const now = new Date();

    return list.filter((n) => {
      if (!n.enabled) return false;
      if (!n.notificationId) return false;

      // Solo cosas que tengan UI popup
      const ui = n.userInterfaceType;
      if (ui !== "popup" && ui !== "popupAndBadge") return false;

      // Solo canal inApp / both
      if (n.deliveryChannel && n.deliveryChannel !== "inApp" && n.deliveryChannel !== "both") {
        return false;
      }

      // Audiencias que nos interesan para "cualquiera"
      const audience = n.targetAudienceType ?? "allUsers";
      if (
        audience !== "allUsers" &&
        audience !== "authenticated" &&
        audience !== "byRole" &&
        audience !== "bySegment"
      ) {
        return false;
      }

      // Ventana de fechas (si la definiste)
      if (!isWithinWindow(n, now)) return false;

      // Si ya se mostró en este dispositivo, lo saltamos
      if (typeof window !== "undefined") {
        if (localStorage.getItem(storageKey(n.notificationId))) {
          return false;
        }
      }

      return true;
    });
  }, [notificationsDoc]);

  // Elegir qué promo mostrar (por ahora la primera válida)
  useEffect(() => {
    if (!candidates.length) {
      setOpenId(null);
      return;
    }
    // si ya hay algo abierto y sigue en la lista, lo respetamos
    if (openId && candidates.some((n) => n.notificationId === openId)) {
      return;
    }
    setOpenId(candidates[0].notificationId);
  }, [candidates, openId]);

  if (!openId) return null;

  const current = candidates.find((n) => n.notificationId === openId);
  if (!current) return null;

  const handleClose = () => {
    if (current.notificationId && typeof window !== "undefined") {
      localStorage.setItem(storageKey(current.notificationId), "seen");
    }
    setOpenId(null);
  };

  const handleGo = () => {
    if (current.notificationId && typeof window !== "undefined") {
      localStorage.setItem(storageKey(current.notificationId), "seen");
    }
    if (current.callToActionURL) {
      window.location.href = current.callToActionURL;
    } else {
      setOpenId(null);
    }
  };

  return (
    <DIV className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <DIV className="bg-zinc-900 rounded-2xl p-5 max-w-md w-full mx-4 shadow-xl space-y-3 border border-white/10">
        <H3 className="text-lg font-semibold">
          {current.title ?? "Promoción"}
        </H3>
        {current.message && (
          <P className="text-sm whitespace-pre-line">
            {current.message}
          </P>
        )}
        {current.description && (
          <P className="text-xs opacity-80 whitespace-pre-line">
            {current.description}
          </P>
        )}

        <DIV className="flex justify-end gap-3 mt-4">
          <BUTTON
            type="button"
            className="text-sm px-3 py-1"
            onClick={handleClose}
          >
            Cerrar
          </BUTTON>
          {current.callToActionURL && (
            <BUTTON
              type="button"
              className="text-sm px-3 py-1"
              onClick={handleGo}
            >
              Ver promoción
            </BUTTON>
          )}
        </DIV>
      </DIV>
    </DIV>
  );
}
