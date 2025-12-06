// functionalities/functions/notifications/resolveRecipientsFromAudiences.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export type RecipientOriginType =
  | "uid"
  | "device"
  | "email"
  | "anonymous"
  | "unknown";

export type Recipient = {
  /** clave única para deduplicar (uid/email/device) */
  key: string;
  uid?: string;
  deviceId?: string;
  email?: string;
  originAudienceId: string;
  originType: RecipientOriginType;
};

/**
 * Lee Providers/Audiences para saber tipo y configuración,
 * y luego resuelve los destinatarios finales a partir de:
 *
 *  - type="manual"  -> AudienceDoc.userIds
 *  - type="ruleBased" / "external" / etc. -> Providers/AudienceMembers/<audienceId>/*
 *
 * Deduplica por key (uid/email/device) entre TODAS las audiencias.
 */
export async function resolveRecipientsFromAudiences(
  audienceIds: string[],
): Promise<Recipient[]> {
  if (!audienceIds || !audienceIds.length) return [];

  // Cargar Providers/Audiences una sola vez
  const audiencesSnap = await db.collection("Providers").doc("Audiences").get();
  const data = audiencesSnap.data() || {};
  const audiences: any[] = Array.isArray(data.audiences) ? data.audiences : [];

  const byId = new Map<string, any>();
  for (const a of audiences) {
    if (a && typeof a.audienceId === "string") {
      byId.set(a.audienceId, a);
    }
  }

  const recipientsMap = new Map<string, Recipient>();

  for (const audienceId of audienceIds) {
    const aud = byId.get(audienceId);
    if (!aud) continue;

    const type = aud.type as "manual" | "ruleBased" | "external" | undefined;

    // 1) type="manual": usar userIds directos (uid)
    if (type === "manual" && Array.isArray(aud.userIds)) {
      for (const uid of aud.userIds as string[]) {
        if (!uid) continue;
        const key = `uid:${uid}`;
        addRecipient(recipientsMap, {
          key,
          uid,
          originAudienceId: audienceId,
          originType: "uid",
        });
      }
    }

    // 2) Miembros pre-materializados (ruleBased, external, imports, etc.)
    const membersCol = db
      .collection("Providers")
      .doc("AudienceMembers")
      .collection(audienceId);

    const membersSnap = await membersCol.get();
    for (const doc of membersSnap.docs) {
      const d = doc.data() as any;

      const uid = (d.userId || d.uid || null) as string | null;
      const deviceId = (d.deviceId || null) as string | null;
      const email = (d.email || null) as string | null;

      let key: string | null = null;
      let originType: RecipientOriginType = "unknown";

      if (uid) {
        key = `uid:${uid}`;
        originType = "uid";
      } else if (email) {
        key = `email:${String(email).toLowerCase()}`;
        originType = "email";
      } else if (deviceId) {
        key = `device:${deviceId}`;
        originType = "device";
      }

      if (!key) continue;

      addRecipient(recipientsMap, {
        key,
        uid: uid ?? undefined,
        deviceId: deviceId ?? undefined,
        email: email ?? undefined,
        originAudienceId: audienceId,
        originType,
      });
    }
  }

  return Array.from(recipientsMap.values());
}

function addRecipient(map: Map<string, Recipient>, r: Recipient) {
  if (map.has(r.key)) return;
  map.set(r.key, r);
}
