// app/lib/notifications/agentCampaignsContext.ts
"use client";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";
import {
  type NotificationCampaign,
  mapCampaignDoc,
} from "./campaigns";

type NotificationsProviderDoc = {
  notifications?: any[];
};

type StrategiesProviderDoc = {
  strategies?: any[];
};

type AudiencesProviderDoc = {
  audiences?: any[];
};

/**
 * Item compacto que verá el AAI en cada doc:
 * Providers/SalesCampaigns, Providers/InfoCampaigns, etc.
 */
export type AgentCampaignContextItem = {
  promoId: string;
  campaignId?: string;
  notificationId?: string;
  scopes?: string[];
  tags?: string[];
  title: string;
  message: string;
  description?: string;
  category?: string;
  audienceSummary?: string;
  validFrom?: string;
  validTo?: string;
  channels?: string[];
  priority?: "low" | "normal" | "high";
  isActive?: boolean;
};

type AgentContextKind = "sales" | "info" | "support" | "cx" | "other";

interface BuildContextOptions {
  kind: AgentContextKind;
  outDocId: string;       // docId en Providers
  defaultScope: string;   // valor por defecto en scopes[]
  categories: string[];   // categorías de Notifications a incluir
}

/**
 * Función interna que construye un contexto compacto para AAI
 * en Providers/<outDocId>, filtrando por categorías.
 */
async function rebuildAgentContext(
  opts: BuildContextOptions,
): Promise<void> {
  if (!FbDB) throw new Error("FbDB no inicializado");

  // 1. Campañas
  const campaignsSnap = await getDocs(
    collection(FbDB, "notificationCampaigns"),
  );
  const campaigns: NotificationCampaign[] = campaignsSnap.docs.map(
    (d) => mapCampaignDoc(d.id, d.data()),
  );

  // 2. Providers/Notifications
  const notificationsSnap = await getDoc(
    doc(FbDB, "Providers", "Notifications"),
  );
  const notificationsData = notificationsSnap.exists()
    ? (notificationsSnap.data() as NotificationsProviderDoc)
    : { notifications: [] };
  const allTemplates: any[] = notificationsData.notifications ?? [];

  // 3. Providers/Strategies
  const strategiesSnap = await getDoc(
    doc(FbDB, "Providers", "Strategies"),
  );
  const strategiesData = strategiesSnap.exists()
    ? (strategiesSnap.data() as StrategiesProviderDoc)
    : { strategies: [] };
  const strategiesById: Record<string, any> = {};
  (strategiesData.strategies ?? []).forEach((s: any) => {
    if (s?.strategyId) strategiesById[s.strategyId] = s;
  });

  // 4. Providers/Audiences (para resumen)
  const audiencesSnap = await getDoc(doc(FbDB, "Providers", "Audiences"));
  const audiencesData = audiencesSnap.exists()
    ? (audiencesSnap.data() as AudiencesProviderDoc)
    : { audiences: [] };
  const audienceNameById: Record<string, string> = {};
  (audiencesData.audiences ?? []).forEach((a: any) => {
    if (!a?.audienceId) return;
    audienceNameById[a.audienceId] = a.name ?? a.audienceId;
  });

  const promos: AgentCampaignContextItem[] = [];

  const buildAudienceSummary = (
    camp: NotificationCampaign,
  ): string | undefined => {
    if (!camp.audienceIds?.length) return undefined;
    const names = camp.audienceIds.map(
      (id) => audienceNameById[id] ?? id,
    );
    return `Audiencias: ${names.join(", ")}`;
  };

  const buildDateTime = (
    date?: string | null,
    time?: string | null,
  ): string | undefined => {
    if (!date && !time) return undefined;
    if (date && time) return `${date} ${time}`;
    return date ?? time ?? undefined;
  };

  for (const camp of campaigns) {
    // Por ahora solo usamos campañas activas
    if (camp.status !== "active") continue;
    if (!camp.notificationIds?.length) continue;

    const strategy = strategiesById[camp.strategyId] ?? null;

    const templates = allTemplates.filter((n: any) =>
      camp.notificationIds.includes(n.notificationId),
    );

    for (const n of templates) {
      const notificationId = n.notificationId as string | undefined;
      if (!notificationId) continue;

      const cat = (n.category as string | undefined) ?? "other";

      // Filtro por categorías según el tipo de contexto
      if (!opts.categories.includes(cat)) continue;

      const promoId =
        (camp.campaignId ?? camp.id) + ":" + notificationId;

      const title =
        typeof n.title === "string" ? n.title : "";
      const message =
        typeof n.message === "string" ? n.message : "";

      const channels: string[] = [];
      if (strategy?.deliveryChannel) {
        channels.push(String(strategy.deliveryChannel));
      } else if (n.deliveryChannel) {
        channels.push(String(n.deliveryChannel));
      } else {
        channels.push("inApp");
      }

      promos.push({
        promoId,
        campaignId: camp.campaignId ?? camp.id,
        notificationId,
        scopes: n.scopes ?? [opts.defaultScope],
        tags: n.tags ?? [],
        title,
        message,
        description:
          typeof n.description === "string" ? n.description : "",
        category: cat,
        audienceSummary: buildAudienceSummary(camp),
        validFrom: buildDateTime(camp.startDate, camp.startTime),
        validTo: buildDateTime(camp.endDate, camp.endTime),
        channels,
        priority: (strategy?.priority ??
          n.priority ??
          "normal") as "low" | "normal" | "high",
        isActive: camp.status === "active",
      });
    }
  }

  // 5. Guardar vista en Providers/<outDocId>
  const outRef = doc(FbDB, "Providers", opts.outDocId);
  await setDoc(outRef, {
    promotions: promos,
    kind: opts.kind,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Contexto de campañas de venta:
 * categorías Notifications: "promo"
 * → Providers/SalesCampaigns
 */
export async function rebuildSalesCampaignsContext(): Promise<void> {
  return rebuildAgentContext({
    kind: "sales",
    outDocId: "SalesCampaigns",
    defaultScope: "sales",
    categories: ["promo"],
  });
}

/**
 * Contexto de campañas informativas:
 * categorías Notifications: "info"
 * → Providers/InfoCampaigns
 */
export async function rebuildInfoCampaignsContext(): Promise<void> {
  return rebuildAgentContext({
    kind: "info",
    outDocId: "InfoCampaigns",
    defaultScope: "info",
    categories: ["info"],
  });
}

/**
 * Contexto de soporte / operación:
 * ej. "warning" + "system"
 * → Providers/SupportCampaigns
 */
export async function rebuildSupportCampaignsContext(): Promise<void> {
  return rebuildAgentContext({
    kind: "support",
    outDocId: "SupportCampaigns",
    defaultScope: "support",
    categories: ["warning", "system"],
  });
}

/**
 * Contexto de CX (customer experience):
 * podrías mezclar "promo" + "info" orientadas a experiencia.
 * → Providers/CxCampaigns
 */
export async function rebuildCxCampaignsContext(): Promise<void> {
  return rebuildAgentContext({
    kind: "cx",
    outDocId: "CxCampaigns",
    defaultScope: "cx",
    categories: ["promo", "info"],
  });
}

/**
 * Contexto de "otras" campañas:
 * categoría Notifications: "other"
 * → Providers/OtherCampaigns
 */
export async function rebuildOtherCampaignsContext(): Promise<void> {
  return rebuildAgentContext({
    kind: "other",
    outDocId: "OtherCampaigns",
    defaultScope: "other",
    categories: ["other"],
  });
}
