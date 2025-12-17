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
import { requireCctCapAsync } from "@/app/lib/cct/guard";

/* ─────────────────────────────────────────────────────────
   Cache simple de Settings (FDV: Providers/Settings)
   ───────────────────────────────────────────────────────── */

const SETTINGS_DOC_PATH =
  process.env.NEXT_PUBLIC_SETTINGS_DOC_PATH || "Providers/Settings";

let cachedSettings:
  | {
      value: iSettings | null;
      expiresAt: number;
    }
  | null = null;

async function getSettingsCached(): Promise<iSettings | null> {
  const now = Date.now();
  if (cachedSettings && cachedSettings.expiresAt > now) {
    return cachedSettings.value;
  }

  const db = getAdminDb();
  const snap = await db.doc(SETTINGS_DOC_PATH).get();
  const data = (snap.data() as iSettings | undefined) ?? null;

  cachedSettings = {
    value: data,
    // Cache 30s; ajusta si quieres
    expiresAt: now + 30_000,
  };

  return data;
}

/* ─────────────────────────────────────────────────────────
   Resolver tokens según el target
   ───────────────────────────────────────────────────────── */

async function resolveTokensForTarget(
  target: NotificationTarget,
  tenantId: string,
): Promise<string[]> {
  const db = getAdminDb();

  // 1) Token directo
  if (target.type === "token") {
    const t = (target.token || "").trim();
    return t ? [t] : [];
  }

  // 2) Por usuario (uid -> tokens activos)
  if (target.type === "user") {
    const snap = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("notificationTokens")
      .where("uid", "==", target.uid)
      .where("active", "==", true)
      .get();

    return snap.docs
      .map((d) => d.get("token") as string | undefined)
      .filter(Boolean) as string[];
  }

  // 3) Broadcast (todos los tokens activos del tenant)
  const snap = await db
    .collection("tenants")
    .doc(tenantId)
    .collection("notificationTokens")
    .where("active", "==", true)
    .get();

  return snap.docs
    .map((d) => d.get("token") as string | undefined)
    .filter(Boolean) as string[];
}

/* ─────────────────────────────────────────────────────────
   Handler principal (POST)
   ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb();
    const tenantId = getTenantIdFromRequest(req);

    // Leer body UNA sola vez (y permitir cct en body para PowerShell)
    const raw = (await req.json().catch(() => ({}))) as any;

    // Detectar si VIENE CCT realmente (para decidir bypass legacy en dev)
    const hasCct =
      !!req.headers.get("x-nixinx-cct")?.trim() ||
      (req.headers.get("authorization")?.startsWith("CCT ") ?? false) ||
      (typeof raw?.cct === "string" && raw.cct.trim().length > 0);

    // CCT gating (independiente)
    const cctRes = await requireCctCapAsync({
      req,
      tenantId,
      cap: "Notifications",
      body: raw,
      allowMissingInDev: true,
    });

    const cctOkForNotifications = hasCct && cctRes.ok;

    if (!cctRes.ok) {
      return NextResponse.json(
        { error: cctRes.error },
        { status: cctRes.status },
      );
    }

    // 1) Legacy Faculties (se mantiene). PERO:
    // En development, si traes CCT válido para Notifications, no bloqueamos por faculties.
    const settings = await getSettingsCached();
    if (!(process.env.NODE_ENV === "development" && cctOkForNotifications)) {
      try {
        ensureFaculty(settings, "notifications");
      } catch {
        return NextResponse.json(
          { error: "notifications_disabled" },
          { status: 403 },
        );
      }
    }

    // 2) Auth prod: superadmin
    if (process.env.NODE_ENV !== "development") {
      const authHeader = req.headers.get("authorization");
      const decoded = await verifyBearerIdToken(authHeader);
      if (!decoded || !isSuperadminHard(decoded.email || decoded.uid)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    // 3) Interpretar body como input real
    const input = raw as CreateNotificationInput;
    const { target, payload } = input || ({} as CreateNotificationInput);

    if (!target || !payload?.title || !payload?.body) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    // 4) Resolver tokens FCM
    const tokens = await resolveTokensForTarget(target, tenantId);

    if (!tokens.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "no_tokens",
          successCount: 0,
          failureCount: 0,
        },
        { status: 200 },
      );
    }

    // 5) Enviar vía FCM
    const messaging = getMessaging();

    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ?? undefined,
      webpush: payload.clickAction
        ? {
            fcmOptions: {
              link: payload.clickAction,
            },
          }
        : undefined,
    });

    // 6) Log simple (debug)
    await db.collection("pushLogs").add({
      tenantId,
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
