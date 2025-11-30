// app/[locale]/admin/notifications-center/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import AdminGuard from "@/complements/admin/AdminGuard";
import {
  DIV,
  H1,
  H2,
  P,
  SPAN,
  BUTTON,
  TABLE,
  THEAD,
  TBODY,
  TR,
  TH,
  TD,
} from "@/complements/components/ui/wrappers";

import { FbAuth, FbDB } from "@/app/lib/services/firebase";
import { useProvider } from "@/app/providers/FdvProvider";
import NotificationsInbox from "@/complements/components/Notifications/NotificationsInbox";
import NotificationPopupHost from "@/complements/components/Notifications/NotificationPopupHost";

// Tipos normalizados que usa el centro de notificaciones
type NotificationConfig = {
  notificationId: string;
  enabled?: boolean;
  category?: "info" | "promo" | "warning" | "system";
  priority?: "low" | "normal" | "high";
  title?: string;
  message?: string;

  // nombre canónico que usamos en userNotifications
  uiType?: "popup" | "badge" | "popupAndBadge";

  // compatibilidad con el schema actual
  userInterfaceType?: "popup" | "badge" | "popupAndBadge";

  deliveryChannel?: "inApp" | "push" | "both";
  requireReadConfirmation?: boolean;

  // 🎯 target interno normalizado
  targetType:
    | "currentUser"
    | "allUsers"
    | "specificUsers"
    | "roles"
    | "anonymous";

  // lista de UIDs explícitos cuando viene de byUserId
  targetUserIds?: string[];
};

type NotificationsProviderDoc = {
  // En FS viene con la forma del NOTIFICATIONS_PANEL_SCHEMA (targetAudienceType, targetUserIds como textarea, etc.)
  notifications?: any[];
};

export default function NotificationsCenterPage() {
  const { value: notificationsDoc } =
    useProvider<NotificationsProviderDoc>("notifications");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Escuchar auth para saber quién es el usuario actual
  useEffect(() => {
    if (!FbAuth) return;
    const unsub = onAuthStateChanged(FbAuth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // Normalizar notificaciones desde Providers/Notifications (FDV)
  const enabledNotifications: NotificationConfig[] =
    (notificationsDoc?.notifications ?? [])
      .map((n: any): NotificationConfig => {
        const rawAudience: string | undefined = n.targetAudienceType;
        const rawIds: string = (n.targetUserIds ?? "") as string;

        // Normalizamos a nuestro tipo interno
        let targetType: NotificationConfig["targetType"] = "currentUser";
        let targetUserIds: string[] | undefined = undefined;

        switch (rawAudience) {
          case "allUsers":
            targetType = "allUsers";
            break;

          case "byUserId":
            targetType = "specificUsers";
            // textarea → lista de UIDs: separados por coma, punto y coma o salto de línea
            targetUserIds = rawIds
              .split(/[,\n;]+/)
              .map((s) => s.trim())
              .filter(Boolean);
            break;

          case "byRole":
            // pendiente implementar fan-out real por rol
            targetType = "roles";
            break;

          case "authenticated":
            // por ahora lo tratamos como currentUser (usuario actual autenticado)
            targetType = "currentUser";
            break;

          case "bySegment":
            // reservado para lógica de segmentos futura
            targetType = "anonymous";
            break;

          default:
            targetType = "currentUser";
            break;
        }

        return {
          notificationId: n.notificationId ?? "",
          enabled: n.enabled,
          category: n.category,
          priority: n.priority,
          title: n.title,
          message: n.message,
          uiType: n.uiType ?? n.userInterfaceType,
          userInterfaceType: n.userInterfaceType,
          deliveryChannel: n.deliveryChannel,
          requireReadConfirmation: n.requireReadConfirmation ?? false,

          // 🎯 campos normalizados que usará el centro
          targetType,
          targetUserIds,
        };
      })
      .filter((n) => n.enabled && n.notificationId);

  const handleApplyToCurrentUser = async (notif: NotificationConfig) => {
    setError(null);
    setLastApplied(null);

    if (!currentUser) {
      setError("no-user");
      return;
    }
    if (!FbDB) {
      setError("no-db");
      return;
    }
    if (!notif.notificationId) {
      setError("missing-notification-id");
      return;
    }

    try {
      setSendingId(notif.notificationId);

      const uid = currentUser.uid;
      const colRef = collection(FbDB, "userNotifications", uid, "items");

      const uiType: NotificationConfig["uiType"] =
        notif.uiType ?? (notif as any).userInterfaceType ?? undefined;

      await addDoc(colRef, {
        notificationId: notif.notificationId,
        title: notif.title ?? "",
        message: notif.message ?? "",
        status: "unread",
        createdAt: serverTimestamp(),
        category: notif.category ?? null,
        priority: notif.priority ?? null,
        uiType: uiType ?? null,
        deliveryChannel: notif.deliveryChannel ?? null,
        requireReadConfirmation: notif.requireReadConfirmation ?? false,
      });

      setLastApplied(notif.notificationId);
    } catch (e: any) {
      console.error(
        "[NotificationsCenter] Error creando userNotification",
        e,
      );
      setError(String(e?.message || e));
    } finally {
      setSendingId(null);
    }
  };

  // Aplicar a audiencia según targetType / targetUserIds
  async function handleApplyToAudience(notif: NotificationConfig) {
    if (!FbDB || !FbAuth) {
      setError("no-db");
      return;
    }

    const baseUser = FbAuth.currentUser;
    const targetType = notif.targetType ?? "currentUser";

    // Resolver UIDs objetivo
    let targetUids: string[] = [];

    if (targetType === "specificUsers" && notif.targetUserIds?.length) {
      targetUids = notif.targetUserIds;
    } else if (
      targetType === "currentUser" ||
      targetType === "anonymous"
    ) {
      if (baseUser?.uid) {
        targetUids = [baseUser.uid];
      }
    } else if (targetType === "allUsers") {
      // ⚠️ Requiere una fuente de UIDs (Users/Profiles + Admin SDK/job backend).
      console.warn(
        "[NotificationsCenter] targetType=allUsers aún no implementado. Usa specificUsers/targetUserIds por ahora.",
      );
      setError("all-users-not-implemented");
      return;
    } else {
      setError("no-targets");
      return;
    }

    if (!targetUids.length) {
      setError("no-targets");
      return;
    }

    setError(null);
    setLastApplied(null);
    setApplying(true);

    try {
      const uiType =
        notif.uiType ?? (notif as any).userInterfaceType ?? undefined;

      const payloadBase = {
        notificationId: notif.notificationId,
        title: notif.title ?? "",
        message: notif.message ?? "",
        status: "unread" as const,
        createdAt: serverTimestamp(),
        category: notif.category ?? null,
        priority: notif.priority ?? null,
        uiType: uiType ?? null,
        deliveryChannel: notif.deliveryChannel ?? null,
        requireReadConfirmation: notif.requireReadConfirmation ?? false,
      };

      // Crear un registro por cada uid
      for (const uid of targetUids) {
        const colRef = collection(FbDB, "userNotifications", uid, "items");
        await addDoc(colRef, payloadBase);
      }

      setLastApplied(
        `${notif.notificationId} (audiencia: ${
          targetType === "specificUsers"
            ? `${targetUids.length} usuarios`
            : targetType
        })`,
      );
    } catch (err) {
      console.error("[NotificationsCenter] Error applyToAudience", err);
      setError("apply-audience");
    } finally {
      setApplying(false);
    }
  }

  return (
    <AdminGuard agentId="notifications-center" showUserChip>
      <DIV className="p-4 space-y-6">
        <H1 className="text-2xl font-semibold">
          Centro de Notificaciones
        </H1>

        <P className="text-sm opacity-75">
          Aquí se muestran las notificaciones definidas en{" "}
          <code>Providers/Notifications</code> (FDV) y marcadas como{" "}
          <code>enabled = true</code>. Desde esta pantalla puedes
          &quot;aplicarlas&quot; al usuario actual o a una audiencia,
          creando entries en{" "}
          <code>userNotifications/&lt;uid&gt;/items</code>, que alimentan el
          badge y la UI interna.
        </P>

        <DIV className="border border-white/10 rounded-lg p-3 bg-black/40">
          <P className="text-xs">
            Usuario actual:{" "}
            {currentUser ? (
              <SPAN className="font-mono">
                {currentUser.uid} ({currentUser.email ?? "anónimo"})
              </SPAN>
            ) : (
              <SPAN className="text-red-400">
                (sin sesión: revisa auth / ensureAnon)
              </SPAN>
            )}
          </P>
          {error === "no-user" && (
            <P className="text-xs text-red-400 mt-1">
              No hay usuario autenticado. Asegúrate de tener auth (incluido
              anonymous).
            </P>
          )}
        </DIV>

        <DIV className="space-y-3">
          <H2 className="text-lg font-semibold">
            Notificaciones habilitadas (FDV)
          </H2>

          {enabledNotifications.length === 0 && (
            <P className="text-sm opacity-70">
              No hay notificaciones <code>enabled = true</code> en
              Providers/Notifications.
            </P>
          )}

          {enabledNotifications.length > 0 && (
            <DIV className="overflow-x-auto border border-white/10 rounded-lg">
              <TABLE className="min-w-full text-sm">
                <THEAD className="bg-white/5">
                  <TR>
                    <TH className="px-3 py-2 text-left">ID</TH>
                    <TH className="px-3 py-2 text-left">Título</TH>
                    <TH className="px-3 py-2 text-left">Categoría</TH>
                    <TH className="px-3 py-2 text-left">Prioridad</TH>
                    <TH className="px-3 py-2 text-left">UI</TH>
                    <TH className="px-3 py-2 text-left">Canal</TH>
                    <TH className="px-3 py-2 text-left">Acción</TH>
                  </TR>
                </THEAD>
                <TBODY>
                  {enabledNotifications.map((notif) => (
                    <TR key={notif.notificationId || Math.random()}>
                      <TD className="px-3 py-2 font-mono text-xs">
                        {notif.notificationId ?? "(sin id)"}
                      </TD>
                      <TD className="px-3 py-2">
                        {notif.title ?? "(sin título)"}
                      </TD>
                      <TD className="px-3 py-2">
                        {notif.category ?? "—"}
                      </TD>
                      <TD className="px-3 py-2">
                        {notif.priority ?? "—"}
                      </TD>
                      <TD className="px-3 py-2">
                        {notif.uiType ??
                          (notif as any).userInterfaceType ??
                          "—"}
                      </TD>
                      <TD className="px-3 py-2">
                        {notif.deliveryChannel ?? "—"}
                      </TD>
                      <TD className="px-3 py-2">
                        <DIV className="flex flex-col gap-1">
                          <BUTTON
                            type="button"
                            disabled={
                              !currentUser ||
                              sendingId === notif.notificationId ||
                              applying
                            }
                            onClick={() =>
                              handleApplyToCurrentUser(notif)
                            }
                          >
                            {sendingId === notif.notificationId
                              ? "Aplicando…"
                              : "Aplicar a este usuario"}
                          </BUTTON>

                          <BUTTON
                            type="button"
                            disabled={applying}
                            onClick={() =>
                              handleApplyToAudience(notif)
                            }
                          >
                            {applying
                              ? "Aplicando a audiencia…"
                              : "Aplicar a audiencia"}
                          </BUTTON>
                        </DIV>
                      </TD>
                    </TR>
                  ))}
                </TBODY>
              </TABLE>
            </DIV>
          )}

          {lastApplied && (
            <P className="text-xs text-green-400">
              Se creó una notificación con{" "}
              <code>{lastApplied}</code> en{" "}
              <code>userNotifications/&lt;uid&gt;/items</code>.
            </P>
          )}

          {/* mensajes más claros para códigos nuevos */}
          {error === "all-users-not-implemented" && (
            <P className="text-xs text-yellow-400">
              targetAudienceType=&quot;allUsers&quot; aún no está
              implementado en fan-out. Usa &quot;byUserId&quot; con{" "}
              <code>targetUserIds</code> por ahora, o monta un job/Cloud Function.
            </P>
          )}
          {error === "no-targets" && (
            <P className="text-xs text-red-400">
              La notificación no tiene destinatarios (targetUserIds vacío
              o sin usuario actual).
            </P>
          )}
          {error === "apply-audience" && (
            <P className="text-xs text-red-400">
              Error al aplicar la notificación a la audiencia.
            </P>
          )}
          {error &&
            ![
              "no-user",
              "no-db",
              "all-users-not-implemented",
              "no-targets",
              "apply-audience",
            ].includes(error) && (
              <P className="text-xs text-red-400">Error: {error}</P>
            )}
        </DIV>
      </DIV>

      <NotificationsInbox className="mt-6" />
      <NotificationPopupHost />
    </AdminGuard>
  );
}
