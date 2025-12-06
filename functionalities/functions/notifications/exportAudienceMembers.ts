// functionalities/functions/notifications/exportAudienceMembers.ts

import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

/**
 * Payload esperado:
 *  - audienceId: ID de Providers/Audiences.<audienceId>
 *
 * Más adelante, si quieres, puedes extender con:
 *  - tenantId
 *  - flags tipo includeContact, etc.
 */
type ExportAudienceMembersPayload = {
  audienceId: string;
};

/**
 * Copia mínima compatible con lo que escribe materializeAudienceMembers:
 *
 * collection("Providers")
 *   .doc("AudienceMembers")
 *   .collection(audienceId)
 *
 * Campos que sabemos que existen:
 *  - audienceId
 *  - userId? / deviceId? / userOrDeviceId
 *  - originType
 *  - from ("manual" | "session" | "external"…)
 *  - utm (UtmInfo) opcional
 *  - lastSessionAt? / createdAt? / updatedAt?
 */
type UtmInfo = {
  utmstring?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  raw?: string;
};

type AudienceMemberDoc = {
  audienceId: string;
  userId?: string;
  deviceId?: string;
  userOrDeviceId: string;
  originType?: string;
  from?: string;
  utm?: UtmInfo | null;
  lastSessionAt?: any;
  createdAt?: any;
  updatedAt?: any;
};

/**
 * Fila del CSV. Aquí ya dejo los campos de contacto preparados,
 * aunque por ahora los dejamos vacíos para evitar acoplarte
 * a un esquema específico de Users.
 *
 * Cuando definas tu colección de usuarios, solo tienes que
 * rellenar esos campos dentro de `hydrateContactInfo`.
 */
export type AudienceExportRow = {
  audienceId: string;
  userId?: string | null;
  deviceId?: string | null;
  userOrDeviceId: string;
  originType: string;
  from: string;

  // Contacto – preparado para futura integración con Users
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;

  // UTM “congelado” a nivel miembro de audiencia
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;

  // Última vez que se vio en sesión
  lastSessionAt?: string | null;
};

/**
 * onCall:
 *  - Lee Providers/AudienceMembers/<audienceId>
 *  - Mapea a AudienceExportRow
 *  - Devuelve un CSV como string + filename sugerido.
 *
 * El frontend puede descargarlo como:
 *  - Blob([csv], { type: "text/csv;charset=utf-8" })
 */
export const exportAudienceMembersToCsv = onCall(
  async (
    req: CallableRequest<ExportAudienceMembersPayload>,
  ): Promise<{ csv: string; fileName: string; rows: number }> => {
    const { audienceId } = req.data || {};
    const uid = req.auth?.uid ?? null;

    if (!audienceId) {
      throw new HttpsError("invalid-argument", "audienceId is required");
    }

    console.log(
      "[exportAudienceMembersToCsv] requested by",
      uid ?? "anonymous",
      "for audience",
      audienceId,
    );

    const membersCol = db
      .collection("Providers")
      .doc("AudienceMembers")
      .collection(audienceId);

    const snapshot = await membersCol.get();

    if (snapshot.empty) {
      const csv = buildCsv([]);
      return {
        csv,
        fileName: `audience-${audienceId}.csv`,
        rows: 0,
      };
    }

    const rows: AudienceExportRow[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AudienceMemberDoc;
      const utm = data.utm ?? undefined;

      const lastSessionIso =
        (data.lastSessionAt &&
          typeof data.lastSessionAt.toDate === "function" &&
          data.lastSessionAt.toDate().toISOString()) ||
        (data.createdAt &&
          typeof data.createdAt.toDate === "function" &&
          data.createdAt.toDate().toISOString()) ||
        null;

      const baseRow: AudienceExportRow = {
        audienceId: data.audienceId,
        userId: data.userId ?? null,
        deviceId: data.deviceId ?? null,
        userOrDeviceId: data.userOrDeviceId,
        originType: data.originType ?? "unknown",
        from: data.from ?? "manual",

        // Contacto: por ahora vacío; se rellena en hydrateContactInfo
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

      rows.push(baseRow);
    });

    // Punto único a tocar en el futuro cuando tengas claro tu esquema de Users
    const hydratedRows = await hydrateContactInfo(rows);

    const csv = buildCsv(hydratedRows);

    return {
      csv,
      fileName: `audience-${audienceId}.csv`,
      rows: hydratedRows.length,
    };
  },
);

/**
 * Hook para cruzar con tu colección de usuarios y rellenar
 * email / phone / nombre, etc.
 *
 * AHORA MISMO:
 *  - Devuelve las filas tal cual.
 *
 * FUTURO:
 *  - Aquí lees tu colección Users (o Providers/Users/..., etc.)
 *  - y haces el merge por userId / deviceId.
 */
async function hydrateContactInfo(
  rows: AudienceExportRow[],
): Promise<AudienceExportRow[]> {
  // TODO: implementar cruce con colección de usuarios.
  // Ejemplo muy simplificado de cómo se vería:
  //
  // const usersCol = db.collection("Users"); // o lo que definas
  // const userIds = Array.from(
  //   new Set(rows.map((r) => r.userId).filter(Boolean) as string[]),
  // );
  //
  // // chunk de 10 en 10 si usas where("in")
  // // o simplemente usersCol.doc(uid).get() en un loop si la audiencia es pequeña.
  //
  // Luego mapeas los resultados a un mapa userId -> { email, phone, ... }
  // y los injectas en cada row.
  //

  return rows;
}

/**
 * Construye CSV con cabecera fija.
 * Columnas pensadas para poder alimentar plataformas de ads / email
 * y, al mismo tiempo, ser fáciles de cruzar en Looker / BigQuery.
 */
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

/**
 * Escapa comas, comillas y saltos de línea.
 */
function escapeCsvValue(value: string): string {
  if (
    value.includes('"') ||
    value.includes(",") ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
