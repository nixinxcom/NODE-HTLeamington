// app/[locale]/admin/campaigns-center/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";

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
  INPUT,
  SELECT,
} from "@/complements/components/ui/wrappers";

import { FbAuth, FbDB } from "@/app/lib/services/firebase";
import { useProvider } from "@/app/providers/FdvProvider";

import {
  type NotificationCampaign,
  type CampaignStatus,
  listenCampaigns,
  saveCampaign,
} from "@/app/lib/notifications/campaigns";
import {
  rebuildSalesCampaignsContext,
  rebuildInfoCampaignsContext,
  rebuildSupportCampaignsContext,
  rebuildCxCampaignsContext,
  rebuildOtherCampaignsContext,
} from "@/app/lib/notifications/agentCampaignsContext";


/* ─────────────────────────────────────────────────────────
   Tipos normalizados que usa el Campaigns Center
   ───────────────────────────────────────────────────────── */

type AudienceType =
  | "allUsers"
  | "authenticated"
  | "byRole"
  | "bySegment"
  | "byUserId"
  | "currentUser"
  | "unknown";

type NotificationConfig = {
  // Identidad de campaña / estrategia
  campaignId: string;          // OJO: aquí usamos el ID del doc en FS
  campaignName: string;
  campaignStatus: CampaignStatus;
  strategyId: string;
  strategyName?: string;
  audienceIds: string[];

  // Notificación concreta (template)
  notificationId: string;
  enabled: boolean;
  category?: "info" | "promo" | "warning" | "system" | "other";
  priority?: "low" | "normal" | "high";
  title?: string;
  message?: string;

  // Tipo de UI y canal
  uiType?:
    | "popup"
    | "badge"
    | "popupAndBadge"
    | "toast"
    | "banner"
    | "silent";
  userInterfaceType?:
    | "popup"
    | "badge"
    | "popupAndBadge"
    | "toast"
    | "banner"
    | "silent";
  deliveryChannel?: "inApp" | "push" | "both";
  requireReadConfirmation?: boolean;

  // Calendarización
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;

  // Audiencia efectiva que el centro va a usar
  audienceType: AudienceType;
  targetUserIds?: string[];
};

type NotificationsProviderDoc = {
  notifications?: any[];
};

type StrategiesProviderDoc = {
  strategies?: any[];
};

type AudiencesProviderDoc = {
  audiences?: any[];
};

/* ───────────────────────────────────────────────────────── */

export default function CampaignsCenterPage() {
  const { value: notificationsDoc } =
    useProvider<NotificationsProviderDoc>("notifications");

  const { value: strategiesDoc } =
    useProvider<StrategiesProviderDoc>("strategies");

  const { value: audiencesDoc } =
    useProvider<AudiencesProviderDoc>("audiences");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyingAudience, setApplyingAudience] = useState(false);

  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);

  // Draft para crear / editar campañas rápidas
  const [draftName, setDraftName] = useState("");
  const [draftStrategyId, setDraftStrategyId] = useState("");
  const [draftNotificationIds, setDraftNotificationIds] = useState<string[]>(
    [],
  );
  const [draftAudienceIds, setDraftAudienceIds] = useState<string[]>([]);
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftStartTime, setDraftStartTime] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [draftEndTime, setDraftEndTime] = useState("");
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null,
  );
  
  // Estado para reconstruir contexto AAI (AgentSalesPromos)
  const [updatingAgentContext, setUpdatingAgentContext] =
    useState(false);
  const [agentContextMessage, setAgentContextMessage] = useState<
    string | null
  >(null);

  // Escuchar auth para saber quién es el usuario actual
  useEffect(() => {
    if (!FbAuth) return;
    const unsub = onAuthStateChanged(FbAuth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // Escuchar campañas en tiempo real
  useEffect(() => {
    const unsub = listenCampaigns(
      (list) => {
        setCampaigns(list);
        setCampaignsError(null);
      },
      (err) => {
        console.error("[CampaignsCenter] listenCampaigns error", err);
        setCampaignsError(err.message);
      },
    );
    return () => unsub();
  }, []);

  const totalTemplates = notificationsDoc?.notifications?.length ?? 0;
  const totalStrategies = strategiesDoc?.strategies?.length ?? 0;
  const totalAudiences = audiencesDoc?.audiences?.length ?? 0;

  // Mapa audienceId -> nombre (para la tabla)
  const audienceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    (audiencesDoc?.audiences ?? []).forEach((a: any) => {
      if (!a?.audienceId) return;
      map[a.audienceId] = a.name ?? a.audienceId;
    });
    return map;
  }, [audiencesDoc]);

  // Estrategias activas (para el select)
  const activeStrategies: any[] = useMemo(
    () =>
      (strategiesDoc?.strategies ?? []).filter(
        (s: any) => s.status === "active",
      ),
    [strategiesDoc],
  );

  // Normalizar campañas + templates → filas (campaña + notificación)
  const enabledNotifications: NotificationConfig[] = campaigns
    .flatMap((camp) => {
      // YA NO filtramos por status aquí; queremos ver todas
      const allTemplates: any[] = notificationsDoc?.notifications ?? [];
      if (!allTemplates.length || !camp.notificationIds?.length) return [];

      const strategy: any =
        strategiesDoc?.strategies?.find(
          (s: any) => s.strategyId === camp.strategyId,
        ) ?? null;

      const templates = allTemplates.filter((n: any) =>
        camp.notificationIds.includes(n.notificationId),
      );

      return templates.map((n: any): NotificationConfig | null => {
        const id = n.notificationId as string | undefined;
        if (!id) return null;

        const uiTypeFromStrategy =
          strategy?.uiType ?? strategy?.userInterfaceType;
        const uiType =
          uiTypeFromStrategy ??
          n.uiType ??
          n.userInterfaceType ??
          undefined;

        return {
          // Campaña / estrategia
          campaignId: camp.id, // usamos el ID del doc en FS
          campaignName: camp.name,
          campaignStatus: camp.status,
          strategyId: camp.strategyId,
          strategyName: strategy?.name ?? camp.strategyId,
          audienceIds: camp.audienceIds ?? [],

          // Notificación concreta
          notificationId: id,
          enabled: true,
          category: n.category,
          priority: strategy?.priority ?? n.priority,
          title: n.title,
          message: n.message,
          uiType,
          userInterfaceType: uiType,
          deliveryChannel: strategy?.deliveryChannel ?? n.deliveryChannel,
          requireReadConfirmation:
            strategy?.requireReadConfirmation ??
            n.requireReadConfirmation ??
            false,

          // Calendarización
          startDate: camp.startDate ?? null,
          startTime: camp.startTime ?? null,
          endDate: camp.endDate ?? null,
          endTime: camp.endTime ?? null,

          // Por ahora, este centro prueba contra el usuario actual
          audienceType: "currentUser",
          targetUserIds: undefined,
        };
      });
    })
    .filter((n): n is NotificationConfig => Boolean(n));

  /* ─────────────────────────────────────────────────────────
     Helpers de UI
     ───────────────────────────────────────────────────────── */

  const formatDateTime = (d?: string | null, t?: string | null): string => {
    if (!d && !t) return "—";
    if (d && t) return `${d} ${t}`;
    return d ?? t ?? "—";
  };

  const renderAudienceLabel = (notif: NotificationConfig): string => {
    if (notif.audienceIds && notif.audienceIds.length > 0) {
      const names = notif.audienceIds.map(
        (id) => audienceNameById[id] ?? id,
      );
      return `Audiencias: ${names.join(", ")}`;
    }

    // Fallback actual (solo usuario actual)
    switch (notif.audienceType) {
      case "currentUser":
        return "Solo usuario actual (pruebas)";
      case "allUsers":
        return "Todos los dispositivos (allUsers)";
      case "authenticated":
        return "Solo usuarios autenticados";
      case "byUserId":
        return notif.targetUserIds?.length
          ? `UIDs específicos (${notif.targetUserIds.length})`
          : "UIDs específicos (sin UIDs)";
      case "byRole":
        return "Por rol (pendiente)";
      case "bySegment":
        return "Por segmento (pendiente)";
      default:
        return "Sin audiencia";
    }
  };

  /* ─────────────────────────────────────────────────────────
     Acciones
     ───────────────────────────────────────────────────────── */

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

    try {
      setSendingId(`${notif.campaignId}:${notif.notificationId}`);

      const uid = currentUser.uid;
      const colRef = collection(FbDB, "userNotifications", uid, "items");

      const uiType =
        notif.uiType ?? (notif as any).userInterfaceType ?? null;

      await addDoc(colRef, {
        notificationId: notif.notificationId,
        title: notif.title ?? "",
        message: notif.message ?? "",
        status: "unread",
        createdAt: serverTimestamp(),
        category: notif.category ?? null,
        priority: notif.priority ?? null,
        uiType,
        deliveryChannel: notif.deliveryChannel ?? null,
        requireReadConfirmation: notif.requireReadConfirmation ?? false,
        // metadata de campaña/estrategia (para tracking futuro)
        campaignId: notif.campaignId,
        strategyId: notif.strategyId,
      });

      setLastApplied(
        `${notif.notificationId} (campaña "${notif.campaignName}", usuario actual)`,
      );
    } catch (e: any) {
      console.error(
        "[CampaignsCenter] Error creando userNotification",
        e,
      );
      setError(String(e?.message || e));
    } finally {
      setSendingId(null);
    }
  };

  // Fan-out a audiencia (pendiente de conectar con Providers/Audiences)
  const handleApplyToAudience = async (notif: NotificationConfig) => {
    setError(
      "apply-audience-pending: esta acción se conectará a Providers/Audiences más adelante.",
    );
    setApplyingAudience(false);
    // Aquí más adelante se escribirá un job o fan-out real.
  };

  // Crear / actualizar campaña rápida
  const handleCreateQuickCampaign = async () => {
    setError(null);
    setLastApplied(null);

    try {
      await saveCampaign({
        id: editingCampaignId ?? undefined,
        name: draftName || "Quick test",
        status: "active",
        strategyId: draftStrategyId,
        notificationIds: draftNotificationIds,
        audienceIds: draftAudienceIds,
        startDate: draftStartDate || null,
        startTime: draftStartTime || null,
        endDate: draftEndDate || null,
        endTime: draftEndTime || null,
      });

      setDraftName("");
      setDraftStrategyId("");
      setDraftNotificationIds([]);
      setDraftAudienceIds([]);
      setDraftStartDate("");
      setDraftStartTime("");
      setDraftEndDate("");
      setDraftEndTime("");
      setEditingCampaignId(null);
    } catch (e: any) {
      console.error("[CampaignsCenter] Error saving campaign", e);
      setError(String(e?.message || e));
    }
  };

  // Clonar campaña completa
  const handleCloneCampaign = async (notif: NotificationConfig) => {
    const base = campaigns.find((c) => c.id === notif.campaignId);
    if (!base) return;

    setError(null);
    try {
      await saveCampaign({
        name: `${base.name} (copia)`,
        status: base.status,
        strategyId: base.strategyId,
        notificationIds: base.notificationIds,
        audienceIds: base.audienceIds,
        startDate: base.startDate ?? null,
        startTime: base.startTime ?? null,
        endDate: base.endDate ?? null,
        endTime: base.endTime ?? null,
        repeatRule: base.repeatRule ?? null,
      });
    } catch (e: any) {
      console.error("[CampaignsCenter] Error cloning campaign", e);
      setError(String(e?.message || e));
    }
  };

  // Editar campaña (cargar en el formulario)
  const handleEditCampaign = (notif: NotificationConfig) => {
    const base = campaigns.find((c) => c.id === notif.campaignId);
    if (!base) return;

    setEditingCampaignId(base.id);
    setDraftName(base.name);
    setDraftStrategyId(base.strategyId);
    setDraftNotificationIds(base.notificationIds ?? []);
    setDraftAudienceIds(base.audienceIds ?? []);
    setDraftStartDate(base.startDate ?? "");
    setDraftStartTime(base.startTime ?? "");
    setDraftEndDate(base.endDate ?? "");
    setDraftEndTime(base.endTime ?? "");
  };

  // Activar / pausar campaña
  const handleToggleCampaignStatus = async (
    notif: NotificationConfig,
  ) => {
    setError(null);
    try {
      const newStatus: CampaignStatus =
        notif.campaignStatus === "active" ? "paused" : "active";

      await saveCampaign({
        id: notif.campaignId,
        status: newStatus,
      });
    } catch (e: any) {
      console.error("[CampaignsCenter] Error toggling status", e);
      setError(String(e?.message || e));
    }
  };

  // Eliminar campaña
  const handleDeleteCampaign = async (notif: NotificationConfig) => {
    if (!FbDB) {
      setError("no-db");
      return;
    }

    const sure = window.confirm(
      `¿Eliminar campaña "${notif.campaignName}"?`,
    );
    if (!sure) return;

    try {
      const colRef = collection(FbDB, "notificationCampaigns");
      const docRef = doc(colRef, notif.campaignId);
      await deleteDoc(docRef);

      if (editingCampaignId === notif.campaignId) {
        setEditingCampaignId(null);
      }
    } catch (e: any) {
      console.error("[CampaignsCenter] Error deleting campaign", e);
      setError(String(e?.message || e));
    }
  };

  const handleRebuildSalesCampaignsContext = async () => {
    setError(null);
    setAgentContextMessage(null);

    try {
      setUpdatingAgentContext(true);
      await rebuildSalesCampaignsContext();
      setAgentContextMessage(
        "Contexto de campañas de ventas para AAI actualizado (Providers/SalesCampaigns).",
      );
    } catch (e: any) {
      console.error(
        "[CampaignsCenter] Error rebuilding SalesCampaigns",
        e,
      );
      setError(String(e?.message || e));
    } finally {
      setUpdatingAgentContext(false);
    }
  };

  const handleRebuildAllAgentCampaignContexts = async () => {
    setError(null);
    setAgentContextMessage(null);

    try {
      setUpdatingAgentContext(true);

      await Promise.all([
        rebuildSalesCampaignsContext(),
        rebuildInfoCampaignsContext(),
        rebuildSupportCampaignsContext(),
        rebuildCxCampaignsContext(),
        rebuildOtherCampaignsContext(),
      ]);

      setAgentContextMessage(
        "Contextos AAI de campañas actualizados (Sales/Info/Support/CX/Other).",
      );
    } catch (e: any) {
      console.error("[CampaignsCenter] Error rebuilding AAI contexts", e);
      setError(String(e?.message || e));
    } finally {
      setUpdatingAgentContext(false);
    }
  };


  const canCreateCampaign =
    !!draftStrategyId && draftNotificationIds.length > 0;

  /* ───────────────────────────────────────────────────────── */

  return (
    <AdminGuard agentId="campaigns-center" showUserChip>
      <DIV className="p-4 md:p-6 lg:p-8 space-y-4">
        <DIV className="flex flex-col gap-1">
          <H1 className="text-2xl font-semibold">Centro de Campañas</H1>
          <P className="text-sm opacity-75">
            Aquí se combinan plantillas de{" "}
            <code>Providers/Notifications</code> con estrategias de{" "}
            <code>Providers/Strategies</code> para generar campañas
            activas. Las campañas se guardan en la colección{" "}
            <code>notificationCampaigns</code>. Desde aquí puedes probar la
            entrega <strong>in-app</strong> contra el usuario actual
            escribiendo en{" "}
            <code>userNotifications/&lt;uid&gt;/items</code>. Más adelante
            se conectarán audiencias reales de{" "}
            <code>Providers/Audiences</code> y fan-out por audiencia.
          </P>

          <P className="text-xs opacity-70 mt-1">
            Plantillas (Notifications): {totalTemplates} · Estrategias:{" "}
            {totalStrategies} · Audiencias definidas: {totalAudiences} ·
            Campañas totales: {campaigns.length} · Filas (campaña +
            notificación): {enabledNotifications.length}
          </P>
        </DIV>

        <DIV className="border border-white/10 rounded-lg p-3 bg-black/40 space-y-2">
          <H2 className="text-lg font-semibold">Usuario actual</H2>
          {currentUser ? (
            <P className="text-sm">
              UID:{" "}
              <SPAN className="font-mono text-xs">
                {currentUser.uid}
              </SPAN>
            </P>
          ) : (
            <P className="text-sm text-yellow-400">
              No hay usuario autenticado; inicia sesión para probar
              campañas.
            </P>
          )}

          {error && (
            <P className="text-xs text-red-400 mt-1">
              Error: <SPAN className="font-mono">{error}</SPAN>
            </P>
          )}
          {lastApplied && (
            <P className="text-xs text-emerald-400 mt-1">
              Última aplicación:{" "}
              <SPAN className="font-mono">{lastApplied}</SPAN>
            </P>
          )}
          {campaignsError && (
            <P className="text-xs text-red-400 mt-1">
              Error campañas:{" "}
              <SPAN className="font-mono">{campaignsError}</SPAN>
            </P>
          )}
          {agentContextMessage && (
            <P className="text-xs text-emerald-400 mt-1">
              {agentContextMessage}
            </P>
          )}
        </DIV>

        {/* Crear / editar campaña rápida */}
        <DIV className="border border-white/10 rounded-lg p-3 bg-black/30 flex flex-col gap-2">
          <DIV className="flex items-center justify-between gap-2">
            <H2 className="text-lg font-semibold">
              Crear campaña rápida de prueba
            </H2>

            <BUTTON
              type="button"
              disabled={updatingAgentContext}
              onClick={handleRebuildAllAgentCampaignContexts}
            >
              {updatingAgentContext
                ? "Actualizando contextos AAI…"
                : "Actualizar contextos AAI (Sales/Info/Support/CX/Other)"}
            </BUTTON>
          </DIV>


          <DIV className="flex flex-col gap-1">
            <P className="text-xs opacity-70">Nombre de la campaña</P>
            <INPUT
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
          </DIV>

          <DIV className="flex flex-col gap-1">
            <P className="text-xs opacity-70">Estrategia (status = active)</P>
            <SELECT
              value={draftStrategyId}
              onChange={(e) => setDraftStrategyId(e.target.value)}
            >
              <option value="">Selecciona estrategia</option>
              {activeStrategies.map((s: any) => (
                <option key={s.strategyId} value={s.strategyId}>
                  {s.name ?? s.strategyId}
                </option>
              ))}
            </SELECT>
          </DIV>

          <DIV className="flex flex-col gap-1">
            <P className="text-xs opacity-70">
              Notificaciones (plantillas en Providers/Notifications)
            </P>
            <SELECT
              multiple
              value={draftNotificationIds}
              onChange={(e) => {
                const select = e.target as HTMLSelectElement;
                const values = Array.from(select.selectedOptions).map(
                  (o) => o.value,
                );
                setDraftNotificationIds(values);
              }}
            >
              {(notificationsDoc?.notifications ?? []).map((n: any) => {
                const id = n.notificationId as string | undefined;
                if (!id) return null;
                return (
                  <option key={id} value={id}>
                    {id}
                  </option>
                );
              })}
            </SELECT>
            <P className="text-[10px] opacity-60">
              Puedes elegir varias; se generará una fila por notificación.
            </P>
          </DIV>

          <DIV className="flex flex-col gap-1">
            <P className="text-xs opacity-70">
              Audiencias (Providers/Audiences) – opcional
            </P>
            <SELECT
              multiple
              value={draftAudienceIds}
              onChange={(e) => {
                const select = e.target as HTMLSelectElement;
                const values = Array.from(select.selectedOptions).map(
                  (o) => o.value,
                );
                setDraftAudienceIds(values);
              }}
            >
              {(audiencesDoc?.audiences ?? []).map((a: any) => {
                const id = a.audienceId as string | undefined;
                if (!id) return null;
                return (
                  <option key={id} value={id}>
                    {a.name ?? id}
                  </option>
                );
              })}
            </SELECT>
          </DIV>

          <DIV className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <DIV className="flex flex-col gap-1">
              <P className="text-xs opacity-70">Inicio (fecha)</P>
              <INPUT
                type="date"
                value={draftStartDate}
                onChange={(e) => setDraftStartDate(e.target.value)}
              />
            </DIV>
            <DIV className="flex flex-col gap-1">
              <P className="text-xs opacity-70">Inicio (hora)</P>
              <INPUT
                type="time"
                value={draftStartTime}
                onChange={(e) => setDraftStartTime(e.target.value)}
              />
            </DIV>
            <DIV className="flex flex-col gap-1">
              <P className="text-xs opacity-70">Fin (fecha)</P>
              <INPUT
                type="date"
                value={draftEndDate}
                onChange={(e) => setDraftEndDate(e.target.value)}
              />
            </DIV>
            <DIV className="flex flex-col gap-1">
              <P className="text-xs opacity-70">Fin (hora)</P>
              <INPUT
                type="time"
                value={draftEndTime}
                onChange={(e) => setDraftEndTime(e.target.value)}
              />
            </DIV>
          </DIV>

          <DIV className="flex items-center gap-2 mt-2">
            <BUTTON
              type="button"
              disabled={!canCreateCampaign}
              onClick={handleCreateQuickCampaign}
            >
              {editingCampaignId
                ? "Guardar cambios"
                : "Guardar campaña activa"}
            </BUTTON>
            {!canCreateCampaign && (
              <P className="text-[10px] opacity-60">
                Selecciona al menos una estrategia activa y una
                notificación.
              </P>
            )}
          </DIV>
        </DIV>

        {/* Tabla de campañas normalizadas (campaña + notificación) */}
        <DIV className="border border-white/10 rounded-lg bg-black/40 overflow-x-auto">
          <TABLE className="min-w-full text-sm">
            <THEAD>
              <TR>
                <TH className="px-3 py-2 text-left">notif</TH>
                <TH className="px-3 py-2 text-left">Campaña</TH>
                <TH className="px-3 py-2 text-left">Estado</TH>
                <TH className="px-3 py-2 text-left">Estrategia</TH>
                <TH className="px-3 py-2 text-left">Título</TH>
                <TH className="px-3 py-2 text-left">Categoría</TH>
                <TH className="px-3 py-2 text-left">Prioridad</TH>
                <TH className="px-3 py-2 text-left">UI</TH>
                <TH className="px-3 py-2 text-left">Canal</TH>
                <TH className="px-3 py-2 text-left">Inicio</TH>
                <TH className="px-3 py-2 text-left">Fin</TH>
                <TH className="px-3 py-2 text-left">Audiencias</TH>
                <TH className="px-3 py-2 text-left">Acción</TH>
              </TR>
            </THEAD>
            <TBODY>
              {enabledNotifications.length === 0 ? (
                <TR>
                  <TD
                    colSpan={13}
                    className="px-3 py-4 text-center text-xs opacity-60"
                  >
                    No hay campañas con notificaciones asociadas.
                  </TD>
                </TR>
              ) : (
                enabledNotifications.map((notif) => (
                  <TR
                    key={`${notif.campaignId}:${notif.notificationId}`}
                    className="border-t border-white/10"
                  >
                    <TD className="px-3 py-2 font-mono text-xs">
                      {notif.notificationId}
                    </TD>
                    <TD className="px-3 py-2">
                      {notif.campaignName}
                    </TD>
                    <TD className="px-3 py-2">
                      {notif.campaignStatus}
                    </TD>
                    <TD className="px-3 py-2">
                      {notif.strategyName ?? "—"}
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
                      {notif.uiType ?? notif.userInterfaceType ?? "—"}
                    </TD>
                    <TD className="px-3 py-2">
                      {notif.deliveryChannel ?? "—"}
                    </TD>
                    <TD className="px-3 py-2">
                      {formatDateTime(notif.startDate, notif.startTime)}
                    </TD>
                    <TD className="px-3 py-2">
                      {formatDateTime(notif.endDate, notif.endTime)}
                    </TD>
                    <TD className="px-3 py-2">
                      {renderAudienceLabel(notif)}
                    </TD>
                    <TD className="px-3 py-2">
                      <DIV className="flex flex-col gap-1">
                        <BUTTON
                          type="button"
                          disabled={
                            sendingId ===
                              `${notif.campaignId}:${notif.notificationId}` ||
                            !currentUser
                          }
                          onClick={() =>
                            handleApplyToCurrentUser(notif)
                          }
                        >
                          {sendingId ===
                          `${notif.campaignId}:${notif.notificationId}`
                            ? "Aplicando…"
                            : "Aplicar a este usuario"}
                        </BUTTON>

                        <BUTTON
                          type="button"
                          disabled
                          onClick={() => {
                            setApplyingAudience(true);
                            handleApplyToAudience(notif);
                          }}
                        >
                          Aplicar a audiencia (pendiente)
                        </BUTTON>

                        <BUTTON
                          type="button"
                          onClick={() => handleEditCampaign(notif)}
                        >
                          Editar campaña
                        </BUTTON>

                        <BUTTON
                          type="button"
                          onClick={() => handleCloneCampaign(notif)}
                        >
                          Clonar campaña
                        </BUTTON>

                        <BUTTON
                          type="button"
                          onClick={() =>
                            handleToggleCampaignStatus(notif)
                          }
                        >
                          {notif.campaignStatus === "active"
                            ? "Pausar campaña"
                            : "Activar campaña"}
                        </BUTTON>

                        <BUTTON
                          type="button"
                          onClick={() =>
                            handleDeleteCampaign(notif)
                          }
                        >
                          Eliminar campaña
                        </BUTTON>
                      </DIV>
                    </TD>
                  </TR>
                ))
              )}
            </TBODY>
          </TABLE>
        </DIV>
      </DIV>
    </AdminGuard>
  );
}
