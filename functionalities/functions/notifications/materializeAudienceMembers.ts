// functionalities/functions/notifications/materializeAudienceMembers.ts

import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Puedes ajustar esto en las env vars del proyecto de Functions
const DEFAULT_TENANT =
  process.env.NEXT_PUBLIC_FIREBASE_DEFAULT_TENANT || "nixinx";

// Tipo mínimo de AudienceDoc que nos interesa aquí
type AudienceType = "manual" | "ruleBased" | "external";

type UtmInfo = {
  utmstring?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  raw?: string;
};

type AudienceDoc = {
  audienceId: string;
  name: string;
  type: AudienceType;
  userIds?: string[];
  track?: string;
  trackCategory?: string;
  trigger?: string;
  target?: string;
  utm?: UtmInfo;
};

type SessionDoc = {
  userId?: string | null;
  deviceId?: string | null;
  userOrDeviceId?: string | null;
  locale?: string | null;
  utm?: UtmInfo | null;
  events?: Array<{
    t: number;
    type: string;
    tag: string;
    category?: string;
    meta?: Record<string, unknown>;
  }>;
  createdAt?: FirebaseFirestore.Timestamp;
};

// Payload de la función
type MaterializePayload = {
  audienceId: string;
  /** Si es true, borra primero todos los miembros previos de esa audiencia */
  rebuild?: boolean;
};

type MaterializeResult = {
  audienceId: string;
  type: AudienceType;
  fromManual: number;
  fromSessions: number;
  totalAfter: number;
};

/**
 * Crea/actualiza la colección de miembros para una audiencia:
 *
 *   Providers/AudienceMembers/<audienceId>/<memberDoc>
 *
 * - Para type="manual": materializa userIds como miembros.
 * - Para type="ruleBased": usa nx_audiences/{tenantId}/sessions
 *   + reglas simples: utm + track/trackCategory.
 * - Para type="external": asumimos que ya tienes la audiencia importada
 *   (ej. CSV a FS) y NO tocamos nada.
 */
export const materializeAudienceMembers = onCall(
  async (req: CallableRequest<MaterializePayload>): Promise<MaterializeResult> => {
    const { audienceId, rebuild } = req.data || {};
    if (!audienceId) {
      throw new HttpsError("invalid-argument", "audienceId is required");
    }

    // 1) Cargar Providers/Audiences y localizar la audiencia
    const provSnap = await db.collection("Providers").doc("Audiences").get();
    const provData = provSnap.data() || {};
    const audiences: AudienceDoc[] = Array.isArray(provData.audiences)
      ? provData.audiences
      : [];

    const audience = audiences.find((a) => a.audienceId === audienceId);
    if (!audience) {
      throw new HttpsError(
        "not-found",
        `Audience ${audienceId} not found in Providers/Audiences`,
      );
    }

    const type = audience.type as AudienceType;
    const tenantId = DEFAULT_TENANT;
    const now = Timestamp.now();

    const membersCol = db
      .collection("Providers")
      .doc("AudienceMembers")
      .collection(audienceId);

    // 2) Opcional: limpiar miembros previos
    if (rebuild) {
      const existingSnap = await membersCol.get();
      if (!existingSnap.empty) {
        const batch = db.batch();
        for (const doc of existingSnap.docs) {
          batch.delete(doc.ref);
        }
        await batch.commit();
      }
    }

    let fromManual = 0;
    let fromSessions = 0;

    // 3) Materializar manual
    if (type === "manual") {
      fromManual = await materializeFromManual(
        audience,
        membersCol,
        now,
      );
    }

    // 4) Materializar ruleBased desde sesiones (session behaviour + UTM)
    if (type === "ruleBased") {
      fromSessions = await materializeFromSessions(
        audience,
        membersCol,
        tenantId,
        now,
      );
    }

    // 5) type="external": NO hacer nada (se asume importado por CSV, etc.)

    // 6) Leer total final
    const finalSnap = await membersCol.get();
    const totalAfter = finalSnap.size;

    return {
      audienceId,
      type,
      fromManual,
      fromSessions,
      totalAfter,
    };
  },
);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function materializeFromManual(
  audience: AudienceDoc,
  membersCol: FirebaseFirestore.CollectionReference,
  now: FirebaseFirestore.Timestamp,
): Promise<number> {
  const userIds = Array.isArray(audience.userIds) ? audience.userIds : [];
  if (!userIds.length) return 0;

  let added = 0;
  let batch = db.batch();
  let ops = 0;

  const seen = new Set<string>();

  for (const uid of userIds) {
    if (!uid) continue;
    const key = `uid:${uid}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ref = membersCol.doc(key);
    batch.set(
      ref,
      {
        audienceId: audience.audienceId,
        userId: uid,
        userOrDeviceId: uid,
        originType: "uid",
        from: "manual",
        updatedAt: now,
        createdAt: now,
      },
      { merge: true },
    );
    added++;
    ops++;

    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  return added;
}

async function materializeFromSessions(
  audience: AudienceDoc,
  membersCol: FirebaseFirestore.CollectionReference,
  tenantId: string,
  now: FirebaseFirestore.Timestamp,
): Promise<number> {
  const sessionsCol = db
    .collection("nx_audiences")
    .doc(tenantId)
    .collection("sessions");

  // Por ahora: traemos todas las sesiones del tenant.
  // Más adelante se puede optimizar con índices por fecha / UTM.
  const sessionsSnap = await sessionsCol.get();
  if (sessionsSnap.empty) return 0;

  let added = 0;
  let batch = db.batch();
  let ops = 0;
  const seen = new Set<string>();

  for (const doc of sessionsSnap.docs) {
    const s = doc.data() as SessionDoc;

    const userId = s.userId || null;
    const deviceId = s.deviceId || null;
    const userOrDeviceId = s.userOrDeviceId || userId || deviceId || null;
    if (!userOrDeviceId) continue;

    const events = Array.isArray(s.events) ? s.events : [];
    const utm = s.utm || null;

    if (!matchesAudienceRule(audience, utm, events)) {
      continue;
    }

    const key = `ud:${userOrDeviceId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ref = membersCol.doc(key);
    batch.set(
      ref,
      {
        audienceId: audience.audienceId,
        userId,
        deviceId,
        userOrDeviceId,
        originType: userId ? "uid" : deviceId ? "device" : "unknown",
        from: "session",
        utm,
        lastSessionAt: s.createdAt ?? now,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true },
    );
    added++;
    ops++;

    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  return added;
}

/**
 * Regla básica:
 *  - Si la audiencia tiene UTM, debe coincidir con la sesión.
 *  - Si tiene track/trackCategory, debe haber al menos un evento que cumpla.
 */
function matchesAudienceRule(
  audience: AudienceDoc,
  utm: UtmInfo | null,
  events: SessionDoc["events"],
): boolean {
  const aUtm = audience.utm;

  if (aUtm) {
    if (aUtm.source && utm?.source !== aUtm.source) return false;
    if (aUtm.medium && utm?.medium !== aUtm.medium) return false;
    if (aUtm.campaign && utm?.campaign !== aUtm.campaign) return false;
    if (aUtm.term && utm?.term !== aUtm.term) return false;
    if (aUtm.content && utm?.content !== aUtm.content) return false;
  }

  const track = audience.track;
  const trackCategory = audience.trackCategory;

  if (!track && !trackCategory) {
    // Solo UTM (o sin reglas -> todo lo que pase UTM entra)
    return true;
  }

  if (!events || !events.length) return false;

  // Buscamos algún evento que cumpla track/trackCategory
  return events.some((ev) => {
    if (track && ev.tag !== track) return false;
    if (trackCategory && ev.category !== trackCategory) return false;
    return true;
  });
}
