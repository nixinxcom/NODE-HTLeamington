// app/lib/audiences/exportAudienceCsv.ts
"use client";

import { httpsCallable } from "firebase/functions";
import { collection, getDocs } from "firebase/firestore";
import { FbFunctions, FbDB } from "@/app/lib/services/firebase";

const USE_AUDIENCE_EXPORT_CF =
  process.env.NEXT_PUBLIC_USE_AUDIENCE_EXPORT_CF === "true";

type ExportAudienceMembersPayload = {
  audienceId: string;
};

export type AudienceExportRow = {
  audienceId: string;
  userId?: string | null;
  deviceId?: string | null;
  userOrDeviceId: string;
  originType: string;
  from: string;

  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;

  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;

  lastSessionAt?: string | null;
};

export type ExportAudienceMembersResponse = {
  csv: string;
  fileName: string;
  rows: number;
};

/**
 * Descarga CSV de miembros de audiencia.
 *
 * 1. Intenta usar la Cloud Function `exportAudienceMembersToCsv`.
 * 2. Si falla (CORS / internal / no desplegada), hace fallback:
 *    lee directamente Firestore en el cliente y genera el CSV.
 */
export async function exportAudienceCsv(
  audienceId: string,
): Promise<ExportAudienceMembersResponse> {
  if (!audienceId) {
    throw new Error("exportAudienceCsv: audienceId es requerido");
  }

  // ──────────────────────────────────────
  // 1) Intentar vía Cloud Function (si existe)
  // ──────────────────────────────────────
  if (FbFunctions && USE_AUDIENCE_EXPORT_CF) {
    try {
      const fn = httpsCallable<
        ExportAudienceMembersPayload,
        ExportAudienceMembersResponse
      >(FbFunctions, "exportAudienceMembersToCsv");

      const res = await fn({ audienceId });
      const data = res.data;

      await triggerDownloadInBrowser(data.csv, data.fileName);
      return data;
    } catch (err: any) {
      const code = err?.code ?? "unknown";
      const message = String(err?.message ?? err);

      const isExpectedInternal =
        code === "functions/internal" ||
        code === "internal" ||
        message.toLowerCase().includes("cors") ||
        message.toLowerCase().includes("not found");

      if (isExpectedInternal) {
        // No usamos console.error para que Next no lo marque como "Issue"
        console.warn(
          "[exportAudienceCsv] Callable no disponible (CORS/internal), usando fallback a Firestore.",
        );
        // seguimos al fallback sin lanzar excepción
      } else {
        console.error("[exportAudienceCsv] Error en callable (fatal)", err);
        throw new Error(`exportAudienceCsv failed (${code}): ${message}`);
      }
    }
  }

  // ──────────────────────────────────────
  // 2) Fallback: leer Firestore desde el cliente
  //    (solo para admin / entorno de desarrollo)
  // ──────────────────────────────────────
  if (!FbDB) {
    throw new Error(
      "exportAudienceCsv fallback: FbDB no inicializado (sin Firestore en cliente)",
    );
  }

  const colRef = collection(
    FbDB,
    "Providers",
    "AudienceMembers",
    audienceId,
  );
  const snap = await getDocs(colRef);

  if (snap.empty) {
    const csvEmpty = buildCsv([]);
    await triggerDownloadInBrowser(csvEmpty, `audience-${audienceId}.csv`);
    return {
      csv: csvEmpty,
      fileName: `audience-${audienceId}.csv`,
      rows: 0,
    };
  }

  const rows: AudienceExportRow[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data() as any;
    const utm = (data.utm ?? null) as any;

    const lastSessionIso =
      (data.lastSessionAt &&
        typeof data.lastSessionAt.toDate === "function" &&
        data.lastSessionAt.toDate().toISOString()) ||
      (data.createdAt &&
        typeof data.createdAt.toDate === "function" &&
        data.createdAt.toDate().toISOString()) ||
      null;

    const row: AudienceExportRow = {
      audienceId: data.audienceId ?? audienceId,
      userId: data.userId ?? null,
      deviceId: data.deviceId ?? null,
      userOrDeviceId: data.userOrDeviceId ?? "",
      originType: data.originType ?? "unknown",
      from: data.from ?? "manual",

      email: null,
      phone: null,
      firstName: null,
      lastName: null,

      utmSource: utm?.source ?? null,
      utmMedium: utm?.medium ?? null,
      utmCampaign: utm?.campaign ?? null,
      utmTerm: utm?.term ?? null,
      utmContent: utm?.content ?? null,

      lastSessionAt: lastSessionIso,
    };

    rows.push(row);
  });

  const csv = buildCsv(rows);
  const fileName = `audience-${audienceId}.csv`;

  await triggerDownloadInBrowser(csv, fileName);

  return {
    csv,
    fileName,
    rows: rows.length,
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildCsv(rows: AudienceExportRow[]): string {
  const header = [
    "audienceId",
    "userId",
    "deviceId",
    "userOrDeviceId",
    "originType",
    "from",
    "email",
    "phone",
    "firstName",
    "lastName",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "lastSessionAt",
  ];

  const lines = rows.map((r) =>
    [
      r.audienceId,
      r.userId ?? "",
      r.deviceId ?? "",
      r.userOrDeviceId,
      r.originType,
      r.from,
      r.email ?? "",
      r.phone ?? "",
      r.firstName ?? "",
      r.lastName ?? "",
      r.utmSource ?? "",
      r.utmMedium ?? "",
      r.utmCampaign ?? "",
      r.utmTerm ?? "",
      r.utmContent ?? "",
      r.lastSessionAt ?? "",
    ]
      .map(escapeCsvValue)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

function escapeCsvValue(value: string): string {
  const v = String(value ?? "");
  if (
    v.includes('"') ||
    v.includes(",") ||
    v.includes("\n") ||
    v.includes("\r")
  ) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

async function triggerDownloadInBrowser(csv: string, fileName: string) {
  if (typeof window === "undefined") return;

  try {
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || `audience-export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[exportAudienceCsv] Error al disparar descarga", err);
  }
}
