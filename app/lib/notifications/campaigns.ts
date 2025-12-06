// app/lib/notifications/campaigns.ts
"use client";

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  serverTimestamp,
  type FirestoreError,
} from "firebase/firestore";

import { FbDB } from "@/app/lib/services/firebase";

export type CampaignStatus = "draft" | "active" | "paused" | "finished";

/**
 * Canales soportados para campañas.
 * Debe alinearse con lo que usas en el Campaigns Center (page.tsx).
 */
export type DeliveryChannel = "inApp" | "push" | "email" | "sms";

export interface NotificationCampaign {
  id: string; // ID del documento en Firestore
  campaignId?: string; // ID legible generado (slug)
  name: string;
  description?: string;

  status: CampaignStatus;

  // Relaciones
  strategyId: string; // Providers/Strategies.strategies[].strategyId
  notificationIds: string[]; // Providers/Notifications.notifications[].notificationId
  audienceIds: string[]; // Providers/Audiences.audiences[].audienceId

  /**
   * Canales de entrega configurados para esta campaña.
   * Ej: ["inApp", "push"], ["email", "sms"], etc.
   */
  deliveryChannels?: DeliveryChannel[];

  // Calendarización simple
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  repeatRule?: string | null;

  createdAt?: Date | null;
  updatedAt?: Date | null;
}

function tsToDate(v: any): Date | null {
  return v && typeof v?.toDate === "function" ? v.toDate() : null;
}

function slugify(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildCampaignId(input: Partial<NotificationCampaign>): string {
  const parts: string[] = [];

  if (input.name) {
    parts.push(slugify(input.name));
  }

  if (input.strategyId) {
    parts.push(`st-${input.strategyId}`);
  }

  const nCount = input.notificationIds?.length ?? 0;
  if (nCount > 0) {
    parts.push(`${nCount}n`);
  }

  const aCount = input.audienceIds?.length ?? 0;
  if (aCount > 0) {
    parts.push(`${aCount}a`);
  }

  if (parts.length === 0) {
    return `campaign-${Date.now()}`;
  }

  return parts.join("__");
}

/**
 * Normaliza el campo deliveryChannels desde Firestore
 * y filtra cualquier basura que no sea un canal válido.
 */
function mapDeliveryChannels(raw: any): DeliveryChannel[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const allowed: DeliveryChannel[] = ["inApp", "push", "email", "sms"];

  const filtered = raw.filter((ch: any) =>
    allowed.includes(ch as DeliveryChannel),
  ) as DeliveryChannel[];

  return filtered.length > 0 ? filtered : undefined;
}

export function mapCampaignDoc(id: string, raw: any): NotificationCampaign {
  return {
    id,
    campaignId: raw.campaignId ?? id,
    name: raw.name ?? id,
    description: raw.description ?? "",
    status: (raw.status as CampaignStatus) ?? "draft",
    strategyId: raw.strategyId ?? "",
    notificationIds: Array.isArray(raw.notificationIds)
      ? raw.notificationIds
      : [],
    audienceIds: Array.isArray(raw.audienceIds) ? raw.audienceIds : [],
    deliveryChannels: mapDeliveryChannels(raw.deliveryChannels),
    startDate: raw.startDate ?? null,
    startTime: raw.startTime ?? null,
    endDate: raw.endDate ?? null,
    endTime: raw.endTime ?? null,
    repeatRule: raw.repeatRule ?? null,
    createdAt: tsToDate(raw.createdAt),
    updatedAt: tsToDate(raw.updatedAt),
  };
}

/**
 * Crea o actualiza una campaña.
 * Si `input.id` existe, hace merge sobre ese doc; si no, crea uno nuevo.
 * campaignId se genera automáticamente si no viene.
 */
export async function saveCampaign(
  input: Partial<NotificationCampaign>,
): Promise<string> {
  if (!FbDB) throw new Error("FbDB no inicializado");

  const colRef = collection(FbDB, "notificationCampaigns");

  const campaignId =
    input.campaignId ??
    buildCampaignId({
      name: input.name ?? "",
      strategyId: input.strategyId ?? "",
      notificationIds: input.notificationIds ?? [],
      audienceIds: input.audienceIds ?? [],
    });

  // Base común
  const base: any = {
    campaignId,
    name: input.name ?? "Sin nombre",
    description: input.description ?? "",
    status: input.status ?? "draft",
    strategyId: input.strategyId ?? "",
    notificationIds: input.notificationIds ?? [],
    audienceIds: input.audienceIds ?? [],
    startDate: input.startDate ?? null,
    startTime: input.startTime ?? null,
    endDate: input.endDate ?? null,
    endTime: input.endTime ?? null,
    repeatRule: input.repeatRule ?? null,
    updatedAt: serverTimestamp(),
  };

  // Sólo guardamos deliveryChannels si viene definido y es array
  if (Array.isArray(input.deliveryChannels)) {
    base.deliveryChannels = input.deliveryChannels;
  }

  if (input.id) {
    const docRef = doc(colRef, input.id);
    await setDoc(
      docRef,
      {
        ...base,
        createdAt: input.createdAt ? input.createdAt : serverTimestamp(),
      },
      { merge: true },
    );
    return input.id;
  } else {
    const docRef = await addDoc(colRef, {
      ...base,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
}

export function listenCampaigns(
  onNext: (campaigns: NotificationCampaign[]) => void,
  onError?: (err: FirestoreError) => void,
) {
  if (!FbDB) {
    onNext([]);
    return () => {};
  }

  const colRef = collection(FbDB, "notificationCampaigns");
  return onSnapshot(
    colRef,
    (snap) => {
      const list: NotificationCampaign[] = snap.docs.map((docSnap) =>
        mapCampaignDoc(docSnap.id, docSnap.data()),
      );
      onNext(list);
    },
    (err) => {
      console.error("[listenCampaigns] error", err);
      onError?.(err);
    },
  );
}
