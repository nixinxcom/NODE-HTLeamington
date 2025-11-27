// app/api/push/send/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";
import { getMessaging } from "firebase-admin/messaging";
import type iSettings from "@/app/lib/settings/interface";
import { ensureFaculty } from "@/app/lib/faculties";
import { getTenantIdFromRequest } from "@/app/lib/notifications/tenant";
import { verifyBearerIdToken } from "@/app/lib/verifyFirebaseToken";
import { isSuperadminHard } from "@/app/lib/authz";
import type {
  CreateNotificationInput,
  NotificationTarget,
} from "@/app/lib/notifications/types";

/* ─────────────────────────────────────────────────────────
   Cache de Settings desde FDV (Providers/Settings)
   ───────────────────────────────────────────────────────── */

const SETTINGS_TTL_MS = 60_000; // 1 minuto; ajusta si quieres

let cachedSettings: iSettings | undefined;
let cachedSettingsAt = 0;

async function getSettingsCached(): Promise<iSettings | undefined> {
  const now = Date.now();
  if (cachedSettings && now - cachedSettingsAt < SETTINGS_TTL_MS) {
    return cachedSettings;
  }

  const db = getAdminDb();
  const snap = await db.collection("Providers").doc("Settings").get();

  cachedSettings = snap.exists ? (snap.data() as iSettings) : undefined;
  cachedSettingsAt = now;

  return cachedSettings;
}

/* ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    // 1) Verificar que el feature esté habilitado para este tenant (FDV + cache)
    const settings = await getSettingsCached();
    try {
      ensureFaculty(settings, "notifications");
    } catch {
      return NextResponse.json(
        { error: "notifications_disabled" },
        { status: 403 },
      );
    }

    // 2) Auth:
    //    - En PRODUCCIÓN: sigue siendo solo superadmin (como antes).
    //    - En DESARROLLO: se omite para poder probar desde el botón.
    if (process.env.NODE_ENV !== "development") {
      const authHeader = req.headers.get("authorization");
      const decoded = await verifyBearerIdToken(authHeader);
      if (!decoded || !isSuperadminHard(decoded.email || decoded.uid)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    // 3) Leer body
    const input = (await req.json()) as CreateNotificationInput;
    const { target, payload } = input || ({} as CreateNotificationInput);

    if (!target || !payload?.title || !payload?.body) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const tenantId = getTenantIdFromRequest(req);
    const db = getAdminDb();
    const messaging = getMessaging();

    // 4) Resolver tokens según el target
    const tokens = await resolveTokens(db, tenantId, target);

    if (!tokens.length) {
      return NextResponse.json({
        ok: true,
        successCount: 0,
        failureCount: 0,
      });
    }

    // 5) Armar mensaje FCM
    const message = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      webpush: payload.clickAction
        ? { fcmOptions: { link: payload.clickAction } }
        : undefined,
    };

    // 6) Enviar
    const res = await messaging.sendEachForMulticast(message);

    // 7) Registrar en Firestore (opcional pero útil)
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("notifications")
      .add({
        target,
        payload,
        sentAt: new Date(),
        successCount: res.successCount,
        failureCount: res.failureCount,
      });

    return NextResponse.json({
      ok: true,
      successCount: res.successCount,
      failureCount: res.failureCount,
    });
  } catch (err) {
    console.error("[push/send] error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

async function resolveTokens(
  db: FirebaseFirestore.Firestore,
  tenantId: string,
  target: NotificationTarget,
): Promise<string[]> {
  if (target.type === "token") {
    return target.token ? [target.token] : [];
  }

  if (target.type === "user") {
    const snap = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("notificationTokens")
      .where("uid", "==", target.uid)
      .where("active", "==", true)
      .get();
    return snap.docs.map((d) => d.get("token")).filter(Boolean);
  }

  // broadcast
  const snap = await db
    .collection("tenants")
    .doc(tenantId)
    .collection("notificationTokens")
    .where("active", "==", true)
    .get();
  return snap.docs.map((d) => d.get("token")).filter(Boolean);
}
