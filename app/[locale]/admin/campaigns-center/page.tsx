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
  getDoc,
  setDoc,
  onSnapshot,
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
import type { AudienceDoc } from "@/app/lib/audiences/types";

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
  campaignId: string; // ID del doc en FS
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

// Lo que devuelve el Provider "audiences": un doc con campo `audiences`
type AudiencesProviderDoc = {
  audiences?: AudienceDoc[];
};

/* ─────────────────────────────────────────────────────────
   UTMs
   ───────────────────────────────────────────────────────── */

type UtmDefinition = {
  id: string; // slug interno (utm_id)
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  name: string; // nombre interno legible
  description: string;
  targetPath: string; // path destino (ej. "/")

  // URL final que se usará en las campañas externas
  exampleUrl?: string;

  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  active: boolean;
  createdAt?: number;
  updatedAt?: number;
};

type UtmsDoc = {
  utms?: UtmDefinition[];
};

/* ─────────────────────────────────────────────────────────
   Tipos para audiencias objetivo (builder)
   ───────────────────────────────────────────────────────── */

type LogicalOperator = "AND" | "OR" | "NOT";

type SubAudienceClause = {
  id: string;
  operator: LogicalOperator;
  audienceIds: string[]; // IDs de audiencias de comportamiento que matchean filtros (snapshot)
  label: string; // resumen legible
  filters: {
    track?: string;
    trigger?: string;
    target?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
  };
};

/* ─────────────────────────────────────────────────────────
   Helpers UTMs / slugs
   ───────────────────────────────────────────────────────── */

function normalizeSlugPart(part: string): string {
  return part
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildUtmSlug(source: string, medium: string, campaign: string): string {
  const parts = [source, medium, campaign]
    .map((p) => p || "")
    .filter((p) => p.trim().length > 0)
    .map(normalizeSlugPart);

  if (parts.length === 0) return "";
  return parts.join("__");
}

function buildUtmQueryString(args: {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  utmId?: string;
}): string {
  const { source, medium, campaign, term, content, utmId } = args;
  if (!source || !medium || !campaign) return "";

  const params = new URLSearchParams();
  params.set("utm_source", source);
  params.set("utm_medium", medium);
  params.set("utm_campaign", campaign);
  if (term) params.set("utm_term", term);
  if (content) params.set("utm_content", content);
  if (utmId) params.set("utm_id", utmId);

  return `?${params.toString()}`;
}

function buildExampleUrlFromDef(u: UtmDefinition): string {
  const base = u.targetPath || "/";
  const qs = buildUtmQueryString({
    source: u.source,
    medium: u.medium,
    campaign: u.campaign,
    term: u.term,
    content: u.content,
    utmId: u.id,
  });

  if (!qs) {
    return `${base}?utm_source=...`;
  }

  return `${base}${qs}`;
}

/* ─────────────────────────────────────────────────────────
   Sync UTM → Providers/Audiences (kind = "utm")
   ───────────────────────────────────────────────────────── */

async function syncUtmAudiences(nextList: UtmDefinition[]) {
  if (!FbDB) return;

  const audiencesRef = doc(FbDB, "Providers", "Audiences");
  const snap = await getDoc(audiencesRef);
  const existing = snap.exists() ? (snap.data().audiences ?? []) : [];
  const now = Date.now();

  // Preservar audiencias que no vienen de UTM
  const nonUtmAudiences = (existing as any[]).filter(
    (a) => a && a.kind !== "utm",
  );

  const utmAudiences = nextList.map((u) => {
    const created =
      typeof u.createdAt === "number" ? u.createdAt : now;
    const updated =
      typeof u.updatedAt === "number" ? u.updatedAt : now;

    return {
      // clave que usará el Campaign Center
      audienceId: `utm:${u.id}`,
      name: u.name || u.id,
      description: u.description ?? "",
      kind: "utm",

      // campos que ya usa tu UI para filtros
      track: "utm",
      trigger: "visit",
      target: u.id,
      trackCategory: u.source,

      // metadata útil: estado de la campaña externa
      active: u.active !== false,

      // timestamps
      createdAt: created,
      updatedAt: updated,
    };
  });

  await setDoc(
    audiencesRef,
    { audiences: [...nonUtmAudiences, ...utmAudiences] },
    { merge: true },
  );
}

const UTM_SOURCE_OPTIONS: string[] = [
  "facebook",
  "instagram",
  "tiktok",
  "google",
  "youtube",
  "linkedin",
  "whatsapp",
  "email",
  "sms",
  "QRcode",
  "other",
];

const UTM_MEDIUM_OPTIONS: string[] = [
  "display",
  "search",
  "video",
  "stories",
  "reels",
  "shorts",
  "feed",
  "newsletter",
  "referral",
  "other",
];

function buildTargetAudienceSlug(name: string): string {
  const slug = normalizeSlugPart(name || "");
  if (!slug) return "audiencia";
  return slug;
}

/* ─────────────────────────────────────────────────────────
   IDs especiales de audiencia (para campañas)
   ───────────────────────────────────────────────────────── */

const SPECIAL_AUDIENCE_ALL = "__allUsers";
const SPECIAL_AUDIENCE_CURRENT = "__currentUser";
const SPECIAL_AUDIENCE_NONE = "__none";

const SPECIAL_AUDIENCE_OPTIONS = [
  { id: SPECIAL_AUDIENCE_ALL, label: "Todos los usuarios" },
  { id: SPECIAL_AUDIENCE_CURRENT, label: "Usuario actual (pruebas)" },
  { id: SPECIAL_AUDIENCE_NONE, label: "Ninguna audiencia (solo guardar)" },
];

/* ───────────────────────────────────────────────────────── */

export default function CampaignsCenterPage() {
  const { value: notificationsDoc } =
    useProvider<NotificationsProviderDoc>("notifications");

  const { value: strategiesDoc } =
    useProvider<StrategiesProviderDoc>("strategies");

  // Lo que trae el provider (estado inicial)
  const { value: audiencesDocFromProvider } =
    useProvider<AudiencesProviderDoc>("audiences");

  // Snapshot en vivo de Providers/Audiences (se sobrepone al provider)
  const [liveAudiencesDoc, setLiveAudiencesDoc] =
    useState<AudiencesProviderDoc | null>(null);

  // Documento efectivo que usará todo el componente
  const audiencesDoc =
    liveAudiencesDoc ?? audiencesDocFromProvider ?? null;

  /* ─────────────────────────────────────────────────────────
     Estado UTMs
     ───────────────────────────────────────────────────────── */

  const [utmList, setUtmList] = useState<UtmDefinition[]>([]);

  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [utmName, setUtmName] = useState("");
  const [utmDescription, setUtmDescription] = useState("");
  const [utmTargetPath, setUtmTargetPath] = useState("/");
  const [utmStartDate, setUtmStartDate] = useState("");
  const [utmStartTime, setUtmStartTime] = useState("");
  const [utmEndDate, setUtmEndDate] = useState("");
  const [utmEndTime, setUtmEndTime] = useState("");
  const [utmSlug, setUtmSlug] = useState("");
  const [utmSaving, setUtmSaving] = useState(false);
  const [editingUtmId, setEditingUtmId] = useState<string | null>(null);

  const [utmErrors, setUtmErrors] = useState<Record<string, string>>({});
  const [utmTouched, setUtmTouched] = useState<Record<string, boolean>>({});

  const [utmFilterStatus, setUtmFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [utmSortField, setUtmSortField] = useState<
    "createdAt" | "updatedAt" | "source" | "medium" | "campaign" | "name"
  >("createdAt");

  const [utmSortDir, setUtmSortDir] = useState<"asc" | "desc">("desc");

  // Recalcular slug cada vez que cambian los componentes clave
  useEffect(() => {
    const slug = buildUtmSlug(utmSource, utmMedium, utmCampaign);
    setUtmSlug(slug);
  }, [utmSource, utmMedium, utmCampaign]);

  const utmQueryString = useMemo(
    () =>
      buildUtmQueryString({
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        term: utmTerm || undefined,
        content: utmContent || undefined,
        utmId: utmSlug || undefined,
      }),
    [utmSource, utmMedium, utmCampaign, utmTerm, utmContent, utmSlug],
  );

  const utmExampleUrl = useMemo(() => {
    const base = utmTargetPath || "/";
    if (!utmQueryString) return `${base}?utm_source=...`;
    return `${base}${utmQueryString}`;
  }, [utmTargetPath, utmQueryString]);

  const markUtmTouched = (field: string) =>
    setUtmTouched((prev) => ({ ...prev, [field]: true }));

  const validateUtm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!utmSource) errors.source = "Requerido";
    if (!utmMedium) errors.medium = "Requerido";
    if (!utmCampaign.trim()) errors.campaign = "Requerido";
    if (!utmName.trim()) errors.name = "Requerido";
    if (!utmDescription.trim()) errors.description = "Requerido";
    if (!utmTargetPath.trim()) errors.targetPath = "Requerido";
    return errors;
  };

  const resetUtmForm = () => {
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setUtmTerm("");
    setUtmContent("");
    setUtmName("");
    setUtmDescription("");
    setUtmTargetPath("/");
    setUtmStartDate("");
    setUtmStartTime("");
    setUtmEndDate("");
    setUtmEndTime("");
    setEditingUtmId(null);
    setUtmErrors({});
    setUtmTouched({});
  };

  // Cargar UTMs existentes desde Providers/Utms
  useEffect(() => {
    if (!FbDB) return;
    const load = async () => {
      try {
        const ref = doc(FbDB, "Providers", "Utms");
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data() as UtmsDoc;
        if (Array.isArray(data.utms)) {
          setUtmList(data.utms);
        }
      } catch (e) {
        console.error("[CampaignsCenter] Error loading UTMs", e);
      }
    };
    void load();
  }, []);

    // Escuchar en vivo Providers/Audiences para que el multiselect
  // y la lista de "audiencias objetivo" se actualicen sin recargar.
  useEffect(() => {
    if (!FbDB) return;

    const audiencesRef = doc(FbDB, "Providers", "Audiences");

    const unsub = onSnapshot(
      audiencesRef,
      (snap) => {
        if (!snap.exists()) {
          setLiveAudiencesDoc({ audiences: [] });
          return;
        }

        const data = snap.data() as any;
        const audiences = Array.isArray(data.audiences)
          ? (data.audiences as AudienceDoc[])
          : [];

        setLiveAudiencesDoc({ audiences });
      },
      (err) => {
        console.error(
          "[CampaignsCenter] onSnapshot Audiences error",
          err,
        );
      },
    );

    return () => unsub();
  }, []);

  const visibleUtms = useMemo(() => {
    let list = [...utmList];

    // Filtro por estado
    if (utmFilterStatus === "active") {
      list = list.filter((u) => u.active !== false);
    } else if (utmFilterStatus === "inactive") {
      list = list.filter((u) => u.active === false);
    }

    // Orden
    list.sort((a, b) => {
      const dir = utmSortDir === "asc" ? 1 : -1;

      const getVal = (u: UtmDefinition): any => {
        switch (utmSortField) {
          case "source":
            return u.source ?? "";
          case "medium":
            return u.medium ?? "";
          case "campaign":
            return u.campaign ?? "";
          case "name":
            return u.name ?? "";
          case "updatedAt":
            return u.updatedAt ?? u.createdAt ?? 0;
          case "createdAt":
          default:
            return u.createdAt ?? u.updatedAt ?? 0;
        }
      };

      const va = getVal(a);
      const vb = getVal(b);

      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }

      return String(va).localeCompare(String(vb)) * dir;
    });

    return list;
  }, [utmList, utmFilterStatus, utmSortField, utmSortDir]);

  const handleSaveUtm = async () => {
    if (!FbDB) return;

    const errors = validateUtm();
    setUtmErrors(errors);
    // marcar todos como tocados para que se vean en rojo
    setUtmTouched({
      source: true,
      medium: true,
      campaign: true,
      name: true,
      description: true,
      targetPath: true,
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    const now = Date.now();
    const slug =
      utmSlug ||
      buildUtmSlug(
        utmSource || "source",
        utmMedium || "medium",
        utmCampaign || "campaign",
      );

    const baseCreatedAt =
      editingUtmId != null
        ? utmList.find((u) => u.id === editingUtmId)?.createdAt ?? now
        : now;

    const newUtm: UtmDefinition = {
      id: slug,
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      term: utmTerm || undefined,
      content: utmContent || undefined,
      name: utmName.trim(),
      description: utmDescription.trim(),
      targetPath: utmTargetPath || "/",

      // Guardamos la URL de ejemplo calculada en el formulario
      exampleUrl: utmExampleUrl,

      startDate: utmStartDate || null,
      startTime: utmStartTime || null,
      endDate: utmEndDate || null,
      endTime: utmEndTime || null,
      active: true,
      createdAt: baseCreatedAt,
      updatedAt: now,
    };

    let nextList: UtmDefinition[];
    if (editingUtmId) {
      nextList = utmList.map((u) => (u.id === editingUtmId ? newUtm : u));
    } else {
      // evitamos duplicar por id
      nextList = utmList.filter((u) => u.id !== newUtm.id);
      nextList.push(newUtm);
    }

    setUtmSaving(true);
    try {
      // 1) Guardar UTMs en Providers/Utms
      const utmsRef = doc(FbDB, "Providers", "Utms");
      await setDoc(utmsRef, { utms: nextList }, { merge: true });
      setUtmList(nextList);
      setEditingUtmId(newUtm.id);

      // 2) Sincronizar audiencias basadas en UTM en Providers/Audiences
      await syncUtmAudiences(nextList);
    } catch (e) {
      console.error(
        "[CampaignsCenter] Error saving UTM / syncing audiences",
        e,
      );
    } finally {
      setUtmSaving(false);
    }
  };

  const handleEditUtm = (utm: UtmDefinition) => {
    setEditingUtmId(utm.id);
    setUtmSource(utm.source);
    setUtmMedium(utm.medium);
    setUtmCampaign(utm.campaign);
    setUtmTerm(utm.term ?? "");
    setUtmContent(utm.content ?? "");
    setUtmName(utm.name);
    setUtmDescription(utm.description);
    setUtmTargetPath(utm.targetPath || "/");
    setUtmStartDate(utm.startDate ?? "");
    setUtmStartTime(utm.startTime ?? "");
    setUtmEndDate(utm.endDate ?? "");
    setUtmEndTime(utm.endTime ?? "");
    setUtmErrors({});
    setUtmTouched({});
  };

  const handleDeleteUtm = async (id: string) => {
    if (!FbDB) return;
    const sure = window.confirm("¿Eliminar esta UTM?");
    if (!sure) return;

    const nextList = utmList.filter((u) => u.id !== id);

    try {
      const utmsRef = doc(FbDB, "Providers", "Utms");
      await setDoc(utmsRef, { utms: nextList }, { merge: true });
      setUtmList(nextList);
      if (editingUtmId === id) resetUtmForm();

      // Mantener Providers/Audiences en sync al borrar
      await syncUtmAudiences(nextList);
    } catch (e) {
      console.error("[CampaignsCenter] Error deleting UTM", e);
    }
  };

  const handleToggleUtmActive = async (id: string) => {
    if (!FbDB) return;

    const idx = utmList.findIndex((u) => u.id === id);
    if (idx === -1) return;

    const now = Date.now();
    const current = utmList[idx];

    const updated: UtmDefinition = {
      ...current,
      active: current.active === false ? true : false,
      updatedAt: now,
    };

    const nextList = [...utmList];
    nextList[idx] = updated;

    try {
      const utmsRef = doc(FbDB, "Providers", "Utms");
      await setDoc(utmsRef, { utms: nextList }, { merge: true });
      setUtmList(nextList);

      // Mantener audiencias UTM sincronizadas con la lista actual
      await syncUtmAudiences(nextList);
    } catch (e) {
      console.error("[CampaignsCenter] Error toggling UTM active state", e);
    }
  };

  /* ─────────────────────────────────────────────────────────
     Filtros / audiencias de comportamiento
     ───────────────────────────────────────────────────────── */

  // Filtros UI para audiencias de comportamiento (session behaviour + UTM; no target)
  const [audienceFilterTrack, setAudienceFilterTrack] = useState("");
  const [audienceFilterTrigger, setAudienceFilterTrigger] = useState("");
  const [audienceFilterTarget, setAudienceFilterTarget] = useState("");
  const [audienceFilterCategory, setAudienceFilterCategory] = useState("");
  const [audienceFromDate, setAudienceFromDate] = useState("");
  const [audienceToDate, setAudienceToDate] = useState("");

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
  const [campaignErrors, setCampaignErrors] = useState<{
    strategyId?: string;
    notificationIds?: string;
  }>({});
  const [campaignTouched, setCampaignTouched] = useState<{
    strategyId?: boolean;
    notificationIds?: boolean;
  }>({});

  // Estado para reconstruir contexto AAI
  const [updatingAgentContext, setUpdatingAgentContext] = useState(false);
  const [agentContextMessage, setAgentContextMessage] =
    useState<string | null>(null);

  // Builder de audiencias objetivo (sección 2)
  const [subAudienceClauses, setSubAudienceClauses] = useState<
    SubAudienceClause[]
  >([]);
  const [targetAudienceName, setTargetAudienceName] = useState("");
  const [targetAudienceDescription, setTargetAudienceDescription] =
    useState("");
  const [editingTargetAudienceId, setEditingTargetAudienceId] = useState<
    string | null
  >(null);
  const [savingTargetAudience, setSavingTargetAudience] = useState(false);
  const [audienceBuilderMessage, setAudienceBuilderMessage] = useState<
    string | null
  >(null);
  const [openTargetAudienceId, setOpenTargetAudienceId] = useState<
    string | null
  >(null);

  /* ─────────────────────────────────────────────────────────
     Efectos principales (auth + campañas + audiencias)
     ───────────────────────────────────────────────────────── */

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

  // Lista base de audiencias desde Providers/Audiences (deduplicada por audienceId)
  const audienceList: any[] = useMemo(() => {
    const raw = (audiencesDoc?.audiences ?? []) as any[];

    const byId = new Map<string, any>();

    for (const a of raw) {
      // tomamos audienceId como clave principal, y id como respaldo
      const id = (a?.audienceId ?? a?.id) as string | undefined;
      if (!id) continue;

      // si ya tenemos una con ese id, no meto otra (evito duplicados)
      if (!byId.has(id)) {
        byId.set(id, a);
      }
    }

    return Array.from(byId.values());
  }, [audiencesDoc]);

  const totalTemplates = notificationsDoc?.notifications?.length ?? 0;
  const totalStrategies = strategiesDoc?.strategies?.length ?? 0;
  const totalAudiences = audienceList.length;

  // Audiencias objetivo (kind = "target") para campañas
  const targetAudiences: any[] = useMemo(
    () => audienceList.filter((a: any) => a?.kind === "target"),
    [audienceList],
  );

  // Audiencias que representan comportamiento (sessionBehaviour, utm, etc.),
  // excluyendo las audiencias objetivo (kind = "target")
  const behaviorAudiences: any[] = useMemo(
    () =>
      audienceList.filter((a: any) => a?.kind !== "target"),
    [audienceList],
  );

  // Valores únicos para selects de filtro (sobre audiencias de comportamiento)
  const trackOptions = useMemo(
    () =>
      Array.from(
        new Set(
          behaviorAudiences
            .map((a) => (a.track as string | undefined)?.trim())
            .filter((v) => v && v.length > 0),
        ),
      ),
    [behaviorAudiences],
  );

  const triggerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          behaviorAudiences
            .map((a) => (a.trigger as string | undefined)?.trim())
            .filter((v) => v && v.length > 0),
        ),
      ),
    [behaviorAudiences],
  );

  const targetOptions = useMemo(
    () =>
      Array.from(
        new Set(
          behaviorAudiences
            .map((a) => (a.target as string | undefined)?.trim())
            .filter((v) => v && v.length > 0),
        ),
      ),
    [behaviorAudiences],
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          behaviorAudiences
            .map((a) => (a.trackCategory as string | undefined)?.trim())
            .filter((v) => v && v.length > 0),
        ),
      ),
    [behaviorAudiences],
  );

  // Lista filtrada de audiencias de comportamiento
  const filteredAudiences: any[] = useMemo(() => {
    return behaviorAudiences.filter((a) => {
      if (audienceFilterTrack && a.track !== audienceFilterTrack) {
        return false;
      }
      if (audienceFilterTrigger && a.trigger !== audienceFilterTrigger) {
        return false;
      }
      if (audienceFilterTarget && a.target !== audienceFilterTarget) {
        return false;
      }
      if (
        audienceFilterCategory &&
        a.trackCategory !== audienceFilterCategory
      ) {
        return false;
      }

      if (audienceFromDate || audienceToDate) {
        const tsLike = a.updatedAt ?? a.createdAt ?? null;
        if (!tsLike) return false;

        let d: Date | null = null;
        if (tsLike && typeof tsLike.toDate === "function") {
          d = tsLike.toDate();
        } else if (typeof tsLike === "string") {
          const parsed = new Date(tsLike);
          if (!Number.isNaN(parsed.getTime())) d = parsed;
        } else if (typeof tsLike === "number") {
          d = new Date(tsLike);
        }

        if (!d) return false;

        if (audienceFromDate) {
          const from = new Date(audienceFromDate);
          from.setHours(0, 0, 0, 0);
          if (d < from) return false;
        }
        if (audienceToDate) {
          const to = new Date(audienceToDate);
          to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
      }

      return true;
    });
  }, [
    behaviorAudiences,
    audienceFilterTrack,
    audienceFilterTrigger,
    audienceFilterTarget,
    audienceFilterCategory,
    audienceFromDate,
    audienceToDate,
  ]);

  // Mapa audienceId -> nombre (para la tabla de campañas)
  const audienceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    audienceList.forEach((a: any) => {
      if (!a?.audienceId) return;
      map[a.audienceId] = a.name ?? a.audienceId;
    });
    map[SPECIAL_AUDIENCE_ALL] = "Todos los usuarios";
    map[SPECIAL_AUDIENCE_CURRENT] = "Usuario actual (pruebas)";
    map[SPECIAL_AUDIENCE_NONE] = "Sin audiencia (solo guardar)";
    return map;
  }, [audienceList]);

  // Estrategias activas (para el select)
  const activeStrategies: any[] = useMemo(
    () =>
      (strategiesDoc?.strategies ?? []).filter(
        (s: any) => s.status === "active",
      ),
    [strategiesDoc],
  );

  // Audiencias objetivo existentes (campos adicionales que pueda tener FS)
  const targetAudiencesWithClauses: any[] = useMemo(
    () => targetAudiences,
    [targetAudiences],
  );

  // Normalizar campañas + templates → filas (campaña + notificación)
  const enabledNotifications: NotificationConfig[] = campaigns
    .flatMap((camp) => {
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
          campaignId: camp.id,
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
        // metadata de campaña/estrategia
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

  /* ─────────────────────────────────────────────────────────
     Builder de audiencias objetivo (sección 2)
     ───────────────────────────────────────────────────────── */

  const buildCurrentFiltersSnapshot = () => ({
    track: audienceFilterTrack || undefined,
    trigger: audienceFilterTrigger || undefined,
    target: audienceFilterTarget || undefined,
    category: audienceFilterCategory || undefined,
    fromDate: audienceFromDate || undefined,
    toDate: audienceToDate || undefined,
  });

  const handleAddSubAudienceClause = () => {
    // Subaudiencia sobre audiencias de comportamiento filtradas (no target)
    const matched = filteredAudiences;

    if (matched.length === 0) {
      window.alert(
        "No hay audiencias de comportamiento que coincidan con los filtros actuales.",
      );
      return;
    }

    const filters = buildCurrentFiltersSnapshot();

    const parts: string[] = [];
    if (filters.track) parts.push(`track=${filters.track}`);
    if (filters.trigger) parts.push(`trigger=${filters.trigger}`);
    if (filters.target) parts.push(`target=${filters.target}`);
    if (filters.category) parts.push(`category=${filters.category}`);
    if (filters.fromDate) parts.push(`from=${filters.fromDate}`);
    if (filters.toDate) parts.push(`to=${filters.toDate}`);

    const baseLabel =
      parts.length > 0 ? parts.join(" · ") : "Sin filtros (todas)";
    const label = `${baseLabel} · ${matched.length} audiencias`;

    const audienceIds = matched
      .map((a: any) => (a.audienceId ?? a.id) as string | undefined)
      .filter((id): id is string => Boolean(id));

    const newClause: SubAudienceClause = {
      id: `clause-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      operator: "AND",
      audienceIds,
      label,
      filters,
    };

    setSubAudienceClauses((prev) => [...prev, newClause]);
  };

  const handleChangeSubAudienceOperator = (
    clauseId: string,
    op: LogicalOperator,
  ) => {
    setSubAudienceClauses((prev) =>
      prev.map((c) =>
        c.id === clauseId ? { ...c, operator: op } : c,
      ),
    );
  };

  const handleRemoveSubAudienceClause = (clauseId: string) => {
    setSubAudienceClauses((prev) =>
      prev.filter((c) => c.id !== clauseId),
    );
  };

  const handleClearAudienceFilters = () => {
    setAudienceFilterTrack("");
    setAudienceFilterTrigger("");
    setAudienceFilterTarget("");
    setAudienceFilterCategory("");
    setAudienceFromDate("");
    setAudienceToDate("");
  };

  const handleResetAudienceBuilder = () => {
    setEditingTargetAudienceId(null);
    setTargetAudienceName("");
    setTargetAudienceDescription("");
    setSubAudienceClauses([]);
    setAudienceBuilderMessage(null);
  };

  const handleSaveTargetAudience = async () => {
    if (!FbDB) return;

    setError(null);
    setAudienceBuilderMessage(null);

    const name = targetAudienceName.trim();
    if (!name) {
      setError("audience-name-required");
      return;
    }
    if (subAudienceClauses.length === 0) {
      setError("audience-clauses-required");
      return;
    }

    const slug = buildTargetAudienceSlug(name);
    const audienceId =
      editingTargetAudienceId && editingTargetAudienceId.startsWith("target:")
        ? editingTargetAudienceId
        : `target:${slug}`;

    const now = Date.now();
    setSavingTargetAudience(true);

    try {
      const audiencesRef = doc(FbDB, "Providers", "Audiences");
      const snap = await getDoc(audiencesRef);
      const existing = snap.exists()
        ? ((snap.data().audiences ?? []) as any[])
        : [];

      const nonTargetAudiences = existing.filter(
        (a) => a && a.kind !== "target",
      );
      const targetAudiencesExisting = existing.filter(
        (a) =>
          a &&
          a.kind === "target" &&
          a.audienceId !== audienceId,
      );

      const newAudience = {
        audienceId,
        name,
        description: targetAudienceDescription.trim(),
        kind: "target",
        active: true,
        clauses: subAudienceClauses.map((c) => ({
          operator: c.operator,
          filters: c.filters,
        })),
        updatedAt: now,
        createdAt:
          editingTargetAudienceId &&
          existing.find((a) => a.audienceId === editingTargetAudienceId)
            ?.createdAt
            ? existing.find(
                (a) => a.audienceId === editingTargetAudienceId,
              )?.createdAt
            : now,
      };

      const nextAudiences = [
        ...nonTargetAudiences,
        ...targetAudiencesExisting,
        newAudience,
      ];

      await setDoc(
        audiencesRef,
        { audiences: nextAudiences },
        { merge: true },
      );

      setEditingTargetAudienceId(audienceId);
      setAudienceBuilderMessage(
        `Audiencia objetivo "${name}" guardada.`,
      );
    } catch (e: any) {
      console.error("[CampaignsCenter] Error guardando audiencia target", e);
      setError(String(e?.message || e));
    } finally {
      setSavingTargetAudience(false);
    }
  };

  const handleDeleteTargetAudience = async (audienceId: string) => {
    if (!FbDB) return;
    const sure = window.confirm(
      `¿Eliminar audiencia objetivo "${audienceNameById[audienceId] ?? audienceId}"?`,
    );
    if (!sure) return;

    try {
      const audiencesRef = doc(FbDB, "Providers", "Audiences");
      const snap = await getDoc(audiencesRef);
      const existing = snap.exists()
        ? ((snap.data().audiences ?? []) as any[])
        : [];

      const nextAudiences = existing.filter(
        (a) => (a?.audienceId ?? a?.id) !== audienceId,
      );

      await setDoc(
        audiencesRef,
        { audiences: nextAudiences },
        { merge: true },
      );

      if (editingTargetAudienceId === audienceId) {
        handleResetAudienceBuilder();
      }
      setAudienceBuilderMessage(
        `Audiencia objetivo "${audienceNameById[audienceId] ?? audienceId}" eliminada.`,
      );
    } catch (e: any) {
      console.error("[CampaignsCenter] Error eliminando audiencia target", e);
      setError(String(e?.message || e));
    }
  };

  const handleLoadTargetAudienceToBuilder = (audience: any) => {
    const audienceId = (audience.audienceId ?? audience.id) as
      | string
      | undefined;
    if (!audienceId) return;

    setEditingTargetAudienceId(audienceId);
    setTargetAudienceName(audience.name ?? audienceId);
    setTargetAudienceDescription(audience.description ?? "");

    const clauses = Array.isArray(audience.clauses)
      ? (audience.clauses as any[])
      : [];

    const rebuiltClauses: SubAudienceClause[] = clauses.map(
      (c: any, idx: number) => {
        const filters = c.filters ?? {};
        const parts: string[] = [];
        if (filters.track) parts.push(`track=${filters.track}`);
        if (filters.trigger) parts.push(`trigger=${filters.trigger}`);
        if (filters.target) parts.push(`target=${filters.target}`);
        if (filters.category) parts.push(`category=${filters.category}`);
        if (filters.fromDate) parts.push(`from=${filters.fromDate}`);
        if (filters.toDate) parts.push(`to=${filters.toDate}`);

        const baseLabel =
          parts.length > 0 ? parts.join(" · ") : "Sin filtros (todas)";
        const label = baseLabel;

        return {
          id: `${audienceId}-clause-${idx}-${Math.random()
            .toString(36)
            .slice(2, 6)}`,
          operator: (c.operator as LogicalOperator) ?? "AND",
          audienceIds: [], // se recalcularían al ejecutar el query en backend
          label,
          filters: {
            track: filters.track,
            trigger: filters.trigger,
            target: filters.target,
            category: filters.category,
            fromDate: filters.fromDate,
            toDate: filters.toDate,
          },
        };
      },
    );

    setSubAudienceClauses(rebuiltClauses);
    setAudienceBuilderMessage(
      `Audiencia "${audience.name ?? audienceId}" cargada en el builder.`,
    );
  };

  const handleRebuildTargetAudience = async (audience: any) => {
    setError(null);
    setAudienceBuilderMessage(null);

    try {
      const audienceId = (audience.audienceId ?? audience.id) as
        | string
        | undefined;
      if (!audienceId) return;

      const clauses = Array.isArray(audience.clauses)
        ? audience.clauses
        : [];

      // Aquí sólo log, donde después se llamará Cloud Function
      console.log("[CampaignsCenter] Rebuild target audience payload", {
        audienceId,
        clauses,
      });

      setAudienceBuilderMessage(
        `Se construyó payload para recalcular audiencia "${audience.name ?? audienceId}" (ver consola).`,
      );
    } catch (e: any) {
      console.error(
        "[CampaignsCenter] Error preparando recálculo de audiencia",
        e,
      );
      setError(String(e?.message || e));
    }
  };

  // Payload de audiencia objetivo para Cloud Function a partir del builder actual
  const buildAudienceQueryPayload = () => {
    return {
      baseAudienceIds: draftAudienceIds, // selección directa del multiselect de campañas
      subAudiences: subAudienceClauses.map((c) => ({
        operator: c.operator,
        filters: c.filters,
      })),
    };
  };

  // Fan-out a audiencia (a Cloud Functions, stub)
  const handleApplyToAudience = async (notif: NotificationConfig) => {
    setError(null);
    setApplyingAudience(true);

    try {
      const payload = buildAudienceQueryPayload();

      console.log("[CampaignsCenter] Payload de audiencia para CF", {
        campaignId: notif.campaignId,
        notificationId: notif.notificationId,
        payload,
      });

      setLastApplied(
        `Payload de audiencia construido para campaña "${notif.campaignName}" (ver consola).`,
      );
    } catch (e: any) {
      console.error("[CampaignsCenter] Error aplicando a audiencia", e);
      setError(String(e?.message || e));
    } finally {
      setApplyingAudience(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     Acciones campañas
     ───────────────────────────────────────────────────────── */

   const handleCreateQuickCampaign = async () => {
    setError(null);
    setLastApplied(null);

    // VALIDACIÓN requerida
    const nextErrors: typeof campaignErrors = {};
    if (!draftStrategyId) {
      nextErrors.strategyId = "Requerido";
    }
    if (draftNotificationIds.length === 0) {
      nextErrors.notificationIds =
        "Selecciona al menos una notificación.";
    }

    setCampaignErrors(nextErrors);
    setCampaignTouched({ strategyId: true, notificationIds: true });

    if (Object.keys(nextErrors).length > 0) {
      return; // no intentamos guardar
    }

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
      setCampaignErrors({});
      setCampaignTouched({});
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

  const handleChangeAudienceSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const select = e.target;
    let values = Array.from(select.selectedOptions).map((o) => o.value);

    // Si eliges "Ninguna audiencia", se limpia el resto
    if (values.includes(SPECIAL_AUDIENCE_NONE)) {
      values = [SPECIAL_AUDIENCE_NONE];
    }

    setDraftAudienceIds(values);
  };

  const canCreateCampaign =
    !!draftStrategyId && draftNotificationIds.length > 0;

  // Acordeones de secciones
  const [showCampaignPanel, setShowCampaignPanel] = useState(true);
  const [showAudiencePanel, setShowAudiencePanel] = useState(true);
  const [showUtmPanel, setShowUtmPanel] = useState(true);

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
            activas. Las campañas se guardan en{" "}
            <code>notificationCampaigns</code>. Desde aquí puedes probar la
            entrega <strong>in-app</strong> contra el usuario actual
            escribiendo en{" "}
            <code>userNotifications/&lt;uid&gt;/items</code>. Las audiencias
            se leen de <code>Providers/Audiences</code>.
          </P>

          <P className="text-xs opacity-70 mt-1">
            Plantillas (Notifications): {totalTemplates} · Estrategias:{" "}
            {totalStrategies} · Audiencias totales (todas las clases):{" "}
            {totalAudiences} · Campañas: {campaigns.length} · Filas
            (campaña + notificación): {enabledNotifications.length}
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
              Última operación:{" "}
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
          {audienceBuilderMessage && (
            <P className="text-xs text-emerald-400 mt-1">
              {audienceBuilderMessage}
            </P>
          )}
        </DIV>

        {/* ─────────────────────────────────────────────────────
            1) Creación de campañas
            ───────────────────────────────────────────────────── */}
        <DIV className="border border-white/10 rounded-lg p-3 bg-black/30 flex flex-col gap-3">
          <DIV className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <DIV className="flex items-center gap-2">
              <H2
                className="text-lg font-semibold cursor-pointer"
                onClick={() => setShowCampaignPanel((prev) => !prev)}
              >
                {showCampaignPanel ? "▽" : "▷"} Crear / editar campañas
              </H2>
            </DIV>

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

          {showCampaignPanel && (
            <>
              <DIV className="flex flex-col gap-1">
                <P className="text-xs opacity-70">Nombre de la campaña</P>
                <INPUT
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
              </DIV>

              <DIV className="flex flex-col gap-1">
                <P className="text-xs opacity-70">
                  Estrategia (status = active)
                  <SPAN className="text-red-500 ml-1">*</SPAN>
                </P>
                <SELECT
                  value={draftStrategyId}
                  onChange={(e) => {
                    setDraftStrategyId(e.target.value);
                    setCampaignTouched((prev) => ({ ...prev, strategyId: true }));
                  }}
                  className={`${
                    campaignErrors.strategyId && campaignTouched.strategyId
                      ? "border-red-500 ring-1 ring-red-500"
                      : ""
                  }`}
                >
                  <option value="">Selecciona estrategia</option>
                  {activeStrategies.map((s: any) => (
                    <option key={s.strategyId} value={s.strategyId}>
                      {s.name ?? s.strategyId}
                    </option>
                  ))}
                </SELECT>
                {campaignErrors.strategyId && campaignTouched.strategyId && (
                  <H1 className="text-[10px] text-red-400">
                    {campaignErrors.strategyId}
                  </H1>
                )}
              </DIV>

              <DIV className="flex flex-col gap-1">
                <P className="text-xs opacity-70">
                  Notificaciones (plantillas en Providers/Notifications)
                  <SPAN className="text-red-500 ml-1">*</SPAN>
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
                    setCampaignTouched((prev) => ({
                      ...prev,
                      notificationIds: true,
                    }));
                  }}
                  className={`${
                    campaignErrors.notificationIds &&
                    campaignTouched.notificationIds
                      ? "border-red-500 ring-1 ring-red-500"
                      : ""
                  } min-h-[220px]`}
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
                {campaignErrors.notificationIds &&
                  campaignTouched.notificationIds && (
                    <H1 className="text-[10px] text-red-400">
                      {campaignErrors.notificationIds}
                    </H1>
                  )}
                <P className="text-[10px] opacity-60">
                  Puedes elegir varias; se generará una fila por notificación.
                </P>
              </DIV>

              {/* Multiselect de audiencias objetivo (kind = "target" + especiales) */}
              <DIV className="flex flex-col gap-1">
                <P className="text-xs opacity-70">
                  Audiencias objetivo de la campaña (Providers/Audiences kind
                  = target + opciones especiales)
                </P>
                <SELECT
                  multiple
                  value={draftAudienceIds}
                  onChange={handleChangeAudienceSelect}
                  className="min-h-[220px]"
                >
                  {/* Opciones especiales */}
                  {SPECIAL_AUDIENCE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}

                  {/* Audiencias objetivo definidas en la sección 2 */}
                  {targetAudiencesWithClauses.map((a: any) => (
                    <option
                      key={a.audienceId}
                      value={a.audienceId}
                    >
                      {a.name ?? a.audienceId}
                    </option>
                  ))}
                </SELECT>
                <P className="text-[10px] opacity-60">
                  Estas audiencias se crean y mantienen en la sección
                  Audiencias objetivo inferior. Aquí solo eliges a quién se
                  aplica la campaña.
                </P>
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

              {/* Tabla de campañas normalizadas (campaña + notificación) */}
              <DIV className="border border-white/10 rounded-lg bg-black/40 overflow-x-auto mt-3">
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
                            {notif.uiType ??
                              notif.userInterfaceType ??
                              "—"}
                          </TD>
                          <TD className="px-3 py-2">
                            {notif.deliveryChannel ?? "—"}
                          </TD>
                          <TD className="px-3 py-2">
                            {formatDateTime(
                              notif.startDate,
                              notif.startTime,
                            )}
                          </TD>
                          <TD className="px-3 py-2">
                            {formatDateTime(
                              notif.endDate,
                              notif.endTime,
                            )}
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
                                disabled={applyingAudience}
                                onClick={() => {
                                  setApplyingAudience(true);
                                  void handleApplyToAudience(notif);
                                }}
                              >
                                Aplicar a audiencia (payload CF)
                              </BUTTON>

                              <BUTTON
                                type="button"
                                onClick={() => handleEditCampaign(notif)}
                              >
                                Editar campaña
                              </BUTTON>

                              <BUTTON
                                type="button"
                                onClick={() =>
                                  handleCloneCampaign(notif)
                                }
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
            </>
          )}
        </DIV>

        {/* ─────────────────────────────────────────────────────
            2) Generación de audiencias objetivo
            ───────────────────────────────────────────────────── */}
        <DIV className="border border-white/10 rounded-lg p-3 bg-black/30 flex flex-col gap-3">
          <DIV className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <DIV className="flex items-center gap-2">
              <H2
                className="text-lg font-semibold cursor-pointer"
                onClick={() => setShowAudiencePanel((prev) => !prev)}
              >
                {showAudiencePanel ? "▽" : "▷"} Audiencias objetivo
                (criterios + Cloud Functions)
              </H2>
            </DIV>
          </DIV>

          {showAudiencePanel && (
            <>
              <P className="text-xs opacity-70">
                Aquí defines audiencias objetivo basadas en comportamiento
                (session behaviour, UTMs, etc.), usando subaudiencias
                combinadas con <code>AND</code>, <code>OR</code> y{" "}
                <code>NOT</code>. El resultado se guarda en{" "}
                <code>Providers/Audiences</code> con{" "}
                <code>kind = target</code> y luego lo puedes usar en la
                sección de campañas.
              </P>

              {/* Filtros para audiencias de comportamiento */}
              <DIV className="flex flex-col gap-2 border border-white/10 rounded-md p-2 bg-black/40">
                <P className="text-xs opacity-70">
                  Filtros de comportamiento (session behaviour / UTMs) para
                  construir subaudiencias
                </P>

                <DIV className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <DIV className="flex flex-col gap-1">
                    <P className="text-[11px] opacity-70">track</P>
                    <SELECT
                      value={audienceFilterTrack}
                      onChange={(e) =>
                        setAudienceFilterTrack(e.target.value)
                      }
                    >
                      <option value="">(cualquiera)</option>
                      {trackOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </SELECT>
                  </DIV>

                  <DIV className="flex flex-col gap-1">
                    <P className="text-[11px] opacity-70">trigger</P>
                    <SELECT
                      value={audienceFilterTrigger}
                      onChange={(e) =>
                        setAudienceFilterTrigger(e.target.value)
                      }
                    >
                      <option value="">(cualquiera)</option>
                      {triggerOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </SELECT>
                  </DIV>

                  <DIV className="flex flex-col gap-1">
                    <P className="text-[11px] opacity-70">target</P>
                    <SELECT
                      value={audienceFilterTarget}
                      onChange={(e) =>
                        setAudienceFilterTarget(e.target.value)
                      }
                    >
                      <option value="">(cualquiera)</option>
                      {targetOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </SELECT>
                  </DIV>

                  <DIV className="flex flex-col gap-1">
                    <P className="text-[11px] opacity-70">
                      trackCategory
                    </P>
                    <SELECT
                      value={audienceFilterCategory}
                      onChange={(e) =>
                        setAudienceFilterCategory(e.target.value)
                      }
                    >
                      <option value="">(cualquiera)</option>
                      {categoryOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </SELECT>
                  </DIV>
                </DIV>

                <DIV className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <DIV className="flex flex-col gap-1">
                    <P className="text-[11px] opacity-70">
                      Desde fecha (createdAt/updatedAt)
                    </P>
                    <INPUT
                      type="date"
                      value={audienceFromDate}
                      onChange={(e) =>
                        setAudienceFromDate(e.target.value)
                      }
                    />
                  </DIV>
                  <DIV className="flex flex-col gap-1">
                    <P className="text-[11px] opacity-70">
                      Hasta fecha
                    </P>
                    <INPUT
                      type="date"
                      value={audienceToDate}
                      onChange={(e) =>
                        setAudienceToDate(e.target.value)
                      }
                    />
                  </DIV>
                </DIV>

                <DIV className="flex justify-between mt-1">
                  <BUTTON
                    type="button"
                    onClick={handleAddSubAudienceClause}
                  >
                    Agregar subaudiencia
                  </BUTTON>

                  <BUTTON
                    type="button"
                    onClick={handleClearAudienceFilters}
                  >
                    Limpiar filtros
                  </BUTTON>
                </DIV>
              </DIV>

              {/* Subaudiencias definidas + operadores */}
              <DIV className="flex flex-col gap-1 border border-dashed border-white/20 rounded-md p-2 bg-black/30 mt-2">
                <P className="text-xs opacity-70">
                  Subaudiencias que forman la audiencia objetivo. Cada fila
                  es un conjunto de audiencias de comportamiento que se
                  combinará con <code>AND</code>, <code>OR</code> o{" "}
                  <code>NOT</code> al ejecutar el query (Cloud Function).
                </P>

                {subAudienceClauses.length === 0 ? (
                  <P className="text-[11px] opacity-60 mt-1">
                    Aún no se han agregado subaudiencias. Usa el botón{" "}
                    <strong>Agregar subaudiencia</strong> después de
                    elegir filtros.
                  </P>
                ) : (
                  <DIV className="border border-white/10 rounded-md bg-black/40 overflow-x-auto mt-1">
                    <TABLE className="min-w-full text-[11px]">
                      <THEAD>
                        <TR>
                          <TH className="px-2 py-1 text-left">
                            Subaudiencia (resumen)
                          </TH>
                          <TH className="px-2 py-1 text-left">
                            Operador lógico
                          </TH>
                          <TH className="px-2 py-1 text-left">Acción</TH>
                        </TR>
                      </THEAD>
                      <TBODY>
                        {subAudienceClauses.map((clause) => (
                          <TR
                            key={clause.id}
                            className="border-t border-white/10"
                          >
                            <TD className="px-2 py-1">
                              {clause.label}
                            </TD>
                            <TD className="px-2 py-1">
                              <SELECT
                                value={clause.operator}
                                onChange={(e) =>
                                  handleChangeSubAudienceOperator(
                                    clause.id,
                                    e.target
                                      .value as LogicalOperator,
                                  )
                                }
                                className="text-[11px]"
                              >
                                <option value="AND">
                                  AND (conjuntivo / incluyente)
                                </option>
                                <option value="OR">
                                  OR (alternativo / complementario)
                                </option>
                                <option value="NOT">
                                  NOT (excluir)
                                </option>
                              </SELECT>
                            </TD>
                            <TD className="px-2 py-1">
                              <BUTTON
                                type="button"
                                onClick={() =>
                                  handleRemoveSubAudienceClause(
                                    clause.id,
                                  )
                                }
                              >
                                Eliminar subaudiencia
                              </BUTTON>
                            </TD>
                          </TR>
                        ))}
                      </TBODY>
                    </TABLE>
                  </DIV>
                )}
              </DIV>

              {/* Nombre y descripción de la audiencia objetivo */}
              <DIV className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <DIV className="flex flex-col gap-1">
                  <P className="text-xs opacity-70">
                    Nombre de la audiencia objetivo
                  </P>
                  <INPUT
                    value={targetAudienceName}
                    onChange={(e) =>
                      setTargetAudienceName(e.target.value)
                    }
                  />
                </DIV>
                <DIV className="flex flex-col gap-1">
                  <P className="text-xs opacity-70">
                    Descripción (sólo panel)
                  </P>
                  <INPUT
                    value={targetAudienceDescription}
                    onChange={(e) =>
                      setTargetAudienceDescription(e.target.value)
                    }
                  />
                </DIV>
              </DIV>

              <DIV className="flex items-center gap-2 mt-2">
                <BUTTON
                  type="button"
                  disabled={savingTargetAudience}
                  onClick={handleSaveTargetAudience}
                >
                  {savingTargetAudience
                    ? "Guardando audiencia…"
                    : editingTargetAudienceId
                    ? "Actualizar audiencia objetivo"
                    : "Guardar nueva audiencia objetivo"}
                </BUTTON>

                <BUTTON
                  type="button"
                  onClick={handleResetAudienceBuilder}
                >
                  Limpiar builder
                </BUTTON>
              </DIV>

              {/* Listado de audiencias objetivo existentes (acordeón) */}
              <DIV className="mt-4 border border-white/10 rounded-md bg-black/40 p-2 space-y-2">
                <P className="text-xs opacity-70 mb-1">
                  Audiencias objetivo existentes (kind = target)
                </P>

                {targetAudiencesWithClauses.length === 0 ? (
                  <P className="text-[11px] opacity-60">
                    Aún no hay audiencias objetivo creadas.
                  </P>
                ) : (
                  targetAudiencesWithClauses.map((a: any) => {
                    const audienceId = (a.audienceId ?? a.id) as
                      | string
                      | undefined;
                    if (!audienceId) return null;

                    const isOpen =
                      openTargetAudienceId === audienceId;

                    const clauses = Array.isArray(a.clauses)
                      ? (a.clauses as any[])
                      : [];

                    return (
                      <DIV
                        key={audienceId}
                        className="border border-white/15 rounded-md bg-black/60"
                      >
                        <DIV className="flex items-center justify-between px-2 py-1">
                          <BUTTON
                            type="button"
                            className="text-left text-xs md:text-sm font-semibold"
                            onClick={() =>
                              setOpenTargetAudienceId((prev) =>
                                prev === audienceId
                                  ? null
                                  : audienceId,
                              )
                            }
                          >
                            {isOpen ? "▽" : "▷"}{" "}
                            {a.name ?? audienceId}
                          </BUTTON>
                          <DIV className="flex flex-col items-end gap-1">
                            <P className="text-[10px] opacity-60">
                              ID:{" "}
                              <SPAN className="font-mono">
                                {audienceId}
                              </SPAN>
                            </P>
                            <DIV className="flex flex-wrap gap-1">
                              <BUTTON
                                type="button"
                                onClick={() =>
                                  handleLoadTargetAudienceToBuilder(
                                    a,
                                  )
                                }
                              >
                                Cargar en builder
                              </BUTTON>
                              <BUTTON
                                type="button"
                                onClick={() =>
                                  handleRebuildTargetAudience(a)
                                }
                              >
                                Recalcular (payload CF)
                              </BUTTON>
                              <BUTTON
                                type="button"
                                onClick={() =>
                                  handleDeleteTargetAudience(
                                    audienceId,
                                  )
                                }
                              >
                                Eliminar audiencia
                              </BUTTON>
                            </DIV>
                          </DIV>
                        </DIV>

                        {isOpen && (
                          <DIV className="border-t border-white/15 px-2 py-2 space-y-2">
                            <P className="text-[11px] opacity-70">
                              Descripción:
                            </P>
                            <P className="text-[11px]">
                              {a.description || "—"}
                            </P>

                            <P className="text-[11px] opacity-70 mt-1">
                              Subaudiencias y criterios:
                            </P>
                            {clauses.length === 0 ? (
                              <P className="text-[11px] opacity-60">
                                Esta audiencia aún no tiene cláusulas
                                definidas.
                              </P>
                            ) : (
                              <DIV className="border border-white/10 rounded-md bg-black/50 overflow-x-auto">
                                <TABLE className="min-w-full text-[11px]">
                                  <THEAD>
                                    <TR>
                                      <TH className="px-2 py-1 text-left">
                                        Operador
                                      </TH>
                                      <TH className="px-2 py-1 text-left">
                                        Filtros
                                      </TH>
                                    </TR>
                                  </THEAD>
                                  <TBODY>
                                    {clauses.map(
                                      (cl: any, idx: number) => {
                                        const f = cl.filters ?? {};
                                        const parts: string[] = [];
                                        if (f.track)
                                          parts.push(
                                            `track=${f.track}`,
                                          );
                                        if (f.trigger)
                                          parts.push(
                                            `trigger=${f.trigger}`,
                                          );
                                        if (f.target)
                                          parts.push(
                                            `target=${f.target}`,
                                          );
                                        if (f.category)
                                          parts.push(
                                            `category=${f.category}`,
                                          );
                                        if (f.fromDate)
                                          parts.push(
                                            `from=${f.fromDate}`,
                                          );
                                        if (f.toDate)
                                          parts.push(
                                            `to=${f.toDate}`,
                                          );

                                        const label =
                                          parts.length > 0
                                            ? parts.join(" · ")
                                            : "Sin filtros (todas)";

                                        return (
                                          <TR
                                            key={`${audienceId}-c-${idx}`}
                                            className="border-t border-white/10"
                                          >
                                            <TD className="px-2 py-1">
                                              {cl.operator ??
                                                "AND"}
                                            </TD>
                                            <TD className="px-2 py-1">
                                              {label}
                                            </TD>
                                          </TR>
                                        );
                                      },
                                    )}
                                  </TBODY>
                                </TABLE>
                              </DIV>
                            )}
                          </DIV>
                        )}
                      </DIV>
                    );
                  })
                )}
              </DIV>
            </>
          )}
        </DIV>

        {/* ─────────────────────────────────────────────────────
            3) Gestor de UTMs (campañas externas)
            ───────────────────────────────────────────────────── */}
        <DIV className="border border-white/10 rounded-lg p-3 bg-black/40 space-y-3">
          <DIV className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <DIV className="flex items-center gap-2">
              <H2
                className="text-lg font-semibold cursor-pointer"
                onClick={() => setShowUtmPanel((prev) => !prev)}
              >
                {showUtmPanel ? "▽" : "▷"} UTMs de campañas externas
                (Facebook / Google / TikTok…)
              </H2>
            </DIV>
            <BUTTON type="button" onClick={resetUtmForm}>
              Limpiar formulario UTM
            </BUTTON>
          </DIV>

          {showUtmPanel && (
            <>
              <P className="text-xs opacity-70">
                Aquí defines combinaciones de <code>utm_source</code>,{" "}
                <code>utm_medium</code> y <code>utm_campaign</code>. NIXINX
                genera un <code>utm_id</code> interno (slug) y lo guarda en{" "}
                <code>Providers/Utms</code>. En tus anuncios deberás usar la
                URL final que se muestra abajo. Además, estas UTMs se
                sincronizan como audiencias de tipo <code>kind=utm</code>{" "}
                en <code>Providers/Audiences</code> para que luego puedas
                usarlas como criterios de comportamiento.
              </P>

              <DIV className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">
                    Origen de la campaña: utm_source
                    <SPAN className="text-red-500 ml-1">*</SPAN>
                  </P>
                  <SELECT
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    onBlur={() => markUtmTouched("source")}
                    className={`${
                      utmErrors.source && utmTouched.source
                        ? "border-red-500 ring-1 ring-red-500"
                        : ""
                    }`}
                  >
                    <option value="">Selecciona origen…</option>
                    {UTM_SOURCE_OPTIONS.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </SELECT>
                  {utmErrors.source && utmTouched.source && (
                    <H1 className="text-[10px] text-red-400">
                      {utmErrors.source}
                    </H1>
                  )}
                </DIV>

                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">
                    Formato de la campaña: utm_medium
                    <SPAN className="text-red-500 ml-1">*</SPAN>
                  </P>
                  <SELECT
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    onBlur={() => markUtmTouched("medium")}
                    className={`${
                      utmErrors.medium && utmTouched.medium
                        ? "border-red-500 ring-1 ring-red-500"
                        : ""
                    }`}
                  >
                    <option value="">Selecciona medio…</option>
                    {UTM_MEDIUM_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </SELECT>
                  {utmErrors.medium && utmTouched.medium && (
                    <H1 className="text-[10px] text-red-400">
                      {utmErrors.medium}
                    </H1>
                  )}
                </DIV>

                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">
                    Nombre de la campaña: utm_campaign
                    <SPAN className="text-red-500 ml-1">*</SPAN>
                  </P>
                  <INPUT
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    onBlur={() => markUtmTouched("campaign")}
                    className={`${
                      utmErrors.campaign && utmTouched.campaign
                        ? "border-red-500 ring-1 ring-red-500"
                        : ""
                    }`}
                  />
                  {utmErrors.campaign && utmTouched.campaign && (
                    <H1 className="text-[10px] text-red-400">
                      {utmErrors.campaign}
                    </H1>
                  )}
                </DIV>
              </DIV>

              <DIV className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">
                    Palabra clave: utm_term (opcional)
                  </P>
                  <INPUT
                    value={utmTerm}
                    onChange={(e) => setUtmTerm(e.target.value)}
                  />
                </DIV>
                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">
                    Contenido del anuncio: utm_content (opcional)
                  </P>
                  <INPUT
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                  />
                </DIV>
              </DIV>

              <DIV className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">
                    Nombre interno legible
                    <SPAN className="text-red-500 ml-1">*</SPAN>
                  </P>
                  <INPUT
                    value={utmName}
                    onChange={(e) => setUtmName(e.target.value)}
                    onBlur={() => markUtmTouched("name")}
                    className={`${
                      utmErrors.name && utmTouched.name
                        ? "border-red-500 ring-1 ring-red-500"
                        : ""
                    }`}
                  />
                  {utmErrors.name && utmTouched.name && (
                    <H1 className="text-[10px] text-red-400">
                      {utmErrors.name}
                    </H1>
                  )}
                </DIV>

                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">
                    Path destino en la PWA (ej. <code>/</code>,{" "}
                    <code>/reservas</code>)
                    <SPAN className="text-red-500 ml-1">*</SPAN>
                  </P>
                  <INPUT
                    value={utmTargetPath}
                    onChange={(e) => setUtmTargetPath(e.target.value)}
                    onBlur={() => markUtmTouched("targetPath")}
                    className={`${
                      utmErrors.targetPath && utmTouched.targetPath
                        ? "border-red-500 ring-1 ring-red-500"
                        : ""
                    }`}
                  />
                  {utmErrors.targetPath && utmTouched.targetPath && (
                    <H1 className="text-[10px] text-red-400">
                      {utmErrors.targetPath}
                    </H1>
                  )}
                </DIV>
              </DIV>

              <DIV className="flex flex-col gap-1 mt-1">
                <P className="text-[11px] opacity-70">
                  Descripción (visible sólo en el panel)
                  <SPAN className="text-red-500 ml-1">*</SPAN>
                </P>
                <INPUT
                  value={utmDescription}
                  onChange={(e) => setUtmDescription(e.target.value)}
                  onBlur={() => markUtmTouched("description")}
                  className={`${
                    utmErrors.description && utmTouched.description
                      ? "border-red-500 ring-1 ring-red-500"
                      : ""
                  }`}
                />
                {utmErrors.description && utmTouched.description && (
                  <H1 className="text-[10px] text-red-400">
                    {utmErrors.description}
                  </H1>
                )}
              </DIV>

              <DIV className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">Inicio (fecha)</P>
                  <INPUT
                    type="date"
                    value={utmStartDate}
                    onChange={(e) => setUtmStartDate(e.target.value)}
                  />
                </DIV>
                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">Inicio (hora)</P>
                  <INPUT
                    type="time"
                    value={utmStartTime}
                    onChange={(e) => setUtmStartTime(e.target.value)}
                  />
                </DIV>
                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">Fin (fecha)</P>
                  <INPUT
                    type="date"
                    value={utmEndDate}
                    onChange={(e) => setUtmEndDate(e.target.value)}
                  />
                </DIV>
                <DIV className="flex flex-col gap-1">
                  <P className="text-[11px] opacity-70">Fin (hora)</P>
                  <INPUT
                    type="time"
                    value={utmEndTime}
                    onChange={(e) => setUtmEndTime(e.target.value)}
                  />
                </DIV>
              </DIV>

              <DIV className="mt-2 p-2 rounded-md border border-white/10 bg-black/50 space-y-1">
                <P className="text-[11px] opacity-70">
                  ID interno (utm_id / slug generado)
                </P>
                <P className="font-mono text-xs break-all">
                  {utmSlug || "(completa source, medium y campaign)"}
                </P>

                <P className="text-[11px] opacity-70 mt-2">
                  URL de ejemplo para pegar en la campaña de anuncios:
                </P>
                <P className="font-mono text-[11px] break-all">
                  {utmExampleUrl}
                </P>
              </DIV>

              <DIV className="flex items-center gap-2 mt-2">
                <BUTTON
                  type="button"
                  onClick={() => {
                    void handleSaveUtm();
                    resetUtmForm();
                  }}
                  disabled={utmSaving}
                >
                  {utmSaving
                    ? "Guardando UTM…"
                    : editingUtmId
                    ? "Guardar UTM y restablecer formulario"
                    : "Guardar nueva UTM"}
                </BUTTON>
              </DIV>

              {utmList.length > 0 && (
                <>
                  <DIV className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-3">
                    <DIV className="flex items-center gap-2 text-[11px] opacity-80">
                      <SPAN>Filtrar por estado:</SPAN>
                      <SELECT
                        value={utmFilterStatus}
                        onChange={(e) =>
                          setUtmFilterStatus(
                            e.target
                              .value as "all" | "active" | "inactive",
                          )
                        }
                        className="text-xs"
                      >
                        <option value="all">Todos</option>
                        <option value="active">Vigentes</option>
                        <option value="inactive">Caducadas</option>
                      </SELECT>
                    </DIV>

                    <DIV className="flex items-center gap-2 text-[11px] opacity-80">
                      <SPAN>Ordenar por:</SPAN>
                      <SELECT
                        value={utmSortField}
                        onChange={(e) =>
                          setUtmSortField(
                            e.target.value as
                              | "createdAt"
                              | "updatedAt"
                              | "source"
                              | "medium"
                              | "campaign"
                              | "name",
                          )
                        }
                        className="text-xs"
                      >
                        <option value="createdAt">Fecha creación</option>
                        <option value="updatedAt">
                          Última actualización
                        </option>
                        <option value="source">Source</option>
                        <option value="medium">Medium</option>
                        <option value="campaign">Campaign</option>
                        <option value="name">Nombre interno</option>
                      </SELECT>

                      <SELECT
                        value={utmSortDir}
                        onChange={(e) =>
                          setUtmSortDir(
                            e.target.value as "asc" | "desc",
                          )
                        }
                        className="text-xs"
                      >
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                      </SELECT>
                    </DIV>
                  </DIV>

                  <DIV className="border border-white/10 rounded-md bg-black/30 mt-2 overflow-x-auto">
                    <TABLE className="min-w-full text-xs">
                      <THEAD>
                        <TR>
                          <TH className="px-2 py-1 text-left">utm_id</TH>
                          <TH className="px-2 py-1 text-left">URL</TH>
                          <TH className="px-2 py-1 text-left">source</TH>
                          <TH className="px-2 py-1 text-left">medium</TH>
                          <TH className="px-2 py-1 text-left">campaign</TH>
                          <TH className="px-2 py-1 text-left">nombre</TH>
                          <TH className="px-2 py-1 text-left">path</TH>
                          <TH className="px-2 py-1 text-left">rango</TH>
                          <TH className="px-2 py-1 text-left">Estado</TH>
                          <TH className="px-2 py-1 text-left">Acción</TH>
                        </TR>
                      </THEAD>
                      <TBODY>
                        {visibleUtms.map((u) => (
                          <TR
                            key={u.id}
                            className="border-t border-white/10"
                          >
                            {/* 1ª columna: utm_id */}
                            <TD className="px-2 py-1 font-mono">
                              {u.id}
                            </TD>

                            {/* 2ª columna: URL final */}
                            <TD className="px-2 py-1 font-mono text-[10px] break-all">
                              {u.exampleUrl ?? buildExampleUrlFromDef(u)}
                            </TD>

                            <TD className="px-2 py-1">{u.source}</TD>
                            <TD className="px-2 py-1">{u.medium}</TD>
                            <TD className="px-2 py-1">{u.campaign}</TD>
                            <TD className="px-2 py-1">{u.name}</TD>
                            <TD className="px-2 py-1">
                              {u.targetPath}
                            </TD>
                            <TD className="px-2 py-1">
                              {u.startDate || u.startTime
                                ? `${u.startDate ?? ""} ${
                                    u.startTime ?? ""
                                  }`.trim()
                                : "—"}{" "}
                              →{" "}
                              {u.endDate || u.endTime
                                ? `${u.endDate ?? ""} ${
                                    u.endTime ?? ""
                                  }`.trim()
                                : "—"}
                            </TD>
                            <TD className="px-2 py-1">
                              {u.active === false
                                ? "Caducada"
                                : "Vigente"}
                            </TD>
                            <TD className="px-2 py-1">
                              <DIV className="flex flex-col gap-1">
                                <BUTTON
                                  type="button"
                                  onClick={() => handleEditUtm(u)}
                                >
                                  Editar
                                </BUTTON>
                                <BUTTON
                                  type="button"
                                  onClick={() =>
                                    handleToggleUtmActive(u.id)
                                  }
                                >
                                  {u.active === false
                                    ? "Marcar como vigente"
                                    : "Marcar como caducada"}
                                </BUTTON>
                                <BUTTON
                                  type="button"
                                  onClick={() =>
                                    handleDeleteUtm(u.id)
                                  }
                                >
                                  Eliminar
                                </BUTTON>
                              </DIV>
                            </TD>
                          </TR>
                        ))}
                      </TBODY>
                    </TABLE>
                  </DIV>
                </>
              )}
            </>
          )}
        </DIV>
      </DIV>
    </AdminGuard>
  );
}
